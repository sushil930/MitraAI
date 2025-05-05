import os
import requests
import google.generativeai as genai # Import Gemini library
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import mimetypes # Import mimetypes
import urllib.parse # Import urllib.parse
from pypdf import PdfReader # Import PdfReader from pypdf
import io # Import io for handling file streams

# Load environment variables from .env file
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file. AI features will be disabled.")
    # Handle this case - maybe disable AI features or exit
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        GEMINI_API_KEY = None # Disable AI if configuration fails

app = Flask(__name__)

# Add CORS configuration
CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}})

# --- Updated /search endpoint with Gemini --- 
@app.route('/search', methods=['POST'])
def search():
    if not GEMINI_API_KEY:
        return jsonify({"error": "AI Service not configured or configuration failed."}), 503 # Service Unavailable
        
    try:
        data = request.json
        query = data.get('query', '')
        language = data.get('language', 'en') # Keep language for potential future use
        gender = data.get('gender', 'Neutral') # Keep gender for potential future use
        history = data.get('history', []) # Expecting [{'role': 'user'/'model', 'parts': 'text'}, ...]

        if not query:
            return jsonify({"error": "Query cannot be empty"}), 400

        # Initialize the Gemini model
        # Use 'gemini-1.5-flash' for a balance of speed and capability
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Start a chat session with the provided history
        # Ensure history format matches Gemini's expected format
        # Filter out any potentially empty/invalid history items just in case
        valid_history = [item for item in history if item.get('role') and item.get('parts')]
        chat = model.start_chat(history=valid_history)

        # Send the new user query
        response = chat.send_message(query)

        # Return the model's response text
        return jsonify({"response": response.text})

    except Exception as e:
        print(f"Error during Gemini API call in /search: {e}")
        # Check for specific Gemini API errors if needed
        # Example: handle authentication errors, rate limits, etc.
        return jsonify({"error": f"An error occurred while contacting the AI service: {str(e)}"}), 500

# --- New /search-image endpoint --- 
@app.route('/search-image', methods=['POST'])
def search_image():
    if not GEMINI_API_KEY:
        return jsonify({"error": "AI Service not configured or configuration failed."}), 503

    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        image_file = request.files['image']
        # Use a more specific prompt for Gemini to get descriptive keywords
        query = request.form.get('query', 'Generate concise keywords describing the main subject of this image for a web search.') 
        language = request.form.get('language', 'en')

        image_bytes = image_file.read()
        mime_type = image_file.mimetype
        if not mime_type:
             mime_type, _ = mimetypes.guess_type(image_file.filename)
             if not mime_type:
                 return jsonify({"error": "Could not determine image type"}), 400

        image_part = {
            'mime_type': mime_type,
            'data': image_bytes
        }

        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Ask Gemini for descriptive keywords
        prompt_parts = [image_part, query]
        response = model.generate_content(prompt_parts)
        
        # Clean up the keywords from the response
        keywords = response.text.strip().replace('\n', ' ')
        
        # Construct Google Images search URL
        search_query = urllib.parse.quote_plus(keywords)
        search_url = f"https://www.google.com/search?tbm=isch&q={search_query}"

        # Return the search URL instead of the raw response text
        return jsonify({"searchUrl": search_url})

    except Exception as e:
        print(f"Error during Gemini API call in /search-image: {e}")
        return jsonify({"error": f"An error occurred while processing the image: {str(e)}"}), 500

# --- New /upload-doc endpoint --- 
@app.route('/upload-doc', methods=['POST'])
def upload_doc():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']

        # Check if the file is a PDF
        if file.mimetype == 'application/pdf':
            try:
                # Read the PDF file from the stream
                pdf_stream = io.BytesIO(file.read())
                reader = PdfReader(pdf_stream)
                extracted_text = ""
                for page in reader.pages:
                    extracted_text += page.extract_text() + "\n" # Add newline between pages
                
                if not extracted_text:
                     return jsonify({"response": "Could not extract text from the PDF (it might be image-based or empty)."})
                
                # Return the extracted text
                return jsonify({"extracted_text": extracted_text})
            except Exception as pdf_error:
                print(f"Error processing PDF: {pdf_error}")
                return jsonify({"error": f"Failed to process PDF file: {str(pdf_error)}"}), 500
        else:
            # Handle other file types later if needed
            return jsonify({"error": "Unsupported file type. Currently only PDF is supported."}), 415

    except Exception as e:
        print(f"Error during file upload in /upload-doc: {e}")
        return jsonify({"error": f"An error occurred during file upload: {str(e)}"}), 500

# --- Weather Endpoint --- 
@app.route('/get-weather', methods=['GET'])
def get_weather():
    location_query = request.args.get('location')
    api_key = os.getenv('ACCUWEATHER_API_KEY')

    if not location_query:
        return jsonify({'error': 'Location query parameter is required'}), 400
    
    if not api_key:
        return jsonify({'error': 'AccuWeather API key not configured'}), 500

    # 1. Get Location Key
    location_url = f"http://dataservice.accuweather.com/locations/v1/cities/search"
    location_params = {'apikey': api_key, 'q': location_query}
    location_response = None
    try:
        location_response = requests.get(location_url, params=location_params)
        location_response.raise_for_status()
        location_data = location_response.json()
        if not location_data:
            return jsonify({'error': f'Location not found: {location_query}'}), 404
        location_key = location_data[0]['Key']
        location_name = f"{location_data[0]['LocalizedName']}, {location_data[0]['Country']['LocalizedName']}"
    except requests.exceptions.RequestException as e:
        print(f"Error fetching location key: {e}")
        status_code = location_response.status_code if location_response is not None else 503
        error_msg = 'Invalid AccuWeather API key or unauthorized access' if status_code == 401 else 'Failed to connect to AccuWeather Locations API'
        return jsonify({'error': error_msg}), status_code
    except (IndexError, KeyError) as e:
        print(f"Error parsing location data: {e}")
        return jsonify({'error': 'Unexpected response format from AccuWeather Locations API'}), 500

    # 2. Get Current Conditions
    conditions_url = f"http://dataservice.accuweather.com/currentconditions/v1/{location_key}"
    conditions_params = {'apikey': api_key, 'details': 'true'}
    conditions_response = None
    try:
        conditions_response = requests.get(conditions_url, params=conditions_params)
        conditions_response.raise_for_status()
        conditions_data = conditions_response.json()
        if not conditions_data:
             return jsonify({'error': 'No current conditions data available'}), 404
        weather_info = {
            'locationName': location_name,
            'weatherText': conditions_data[0].get('WeatherText'),
            'temperature': conditions_data[0].get('Temperature', {}).get('Metric', {}),
            'realFeelTemperature': conditions_data[0].get('RealFeelTemperature', {}).get('Metric', {}),
            'relativeHumidity': conditions_data[0].get('RelativeHumidity'),
            'wind': conditions_data[0].get('Wind', {}).get('Speed', {}).get('Metric', {}),
            'uvIndex': conditions_data[0].get('UVIndex'),
            'uvIndexText': conditions_data[0].get('UVIndexText'),
            # Add other fields as needed
        }
        return jsonify(weather_info)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching current conditions: {e}")
        status_code = conditions_response.status_code if conditions_response is not None else 503
        error_msg = 'Invalid AccuWeather API key or unauthorized access' if status_code == 401 else 'Failed to connect to AccuWeather Current Conditions API'
        return jsonify({'error': error_msg}), status_code
    except (IndexError, KeyError) as e:
        print(f"Error parsing conditions data: {e}")
        return jsonify({'error': 'Unexpected response format from AccuWeather Current Conditions API'}), 500

# --- Main execution --- 
if __name__ == '__main__':
    app.run(debug=True, port=5000)