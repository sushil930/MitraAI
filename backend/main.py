import os
import requests
import google.generativeai as genai # Import Gemini library
from flask import Flask, request, jsonify, send_file # Added send_file
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
import google.ai.generativelanguage as glm
import requests
import pdfplumber
from docx import Document
import fitz # PyMuPDF
from PIL import Image
import pytesseract
import io # Add this import
from google.cloud import translate_v2 as translate # Add this import
import urllib.parse # Added for search URL encoding
import mimetypes # Added for guessing image type
from PyPDF2 import PdfReader # Corrected import for PdfReader

# --- ReportLab Imports --- 
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
# --- End ReportLab Imports --- 

# Load environment variables from .env file
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file. AI features will be disabled.")
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        GEMINI_API_KEY = None

# --- Initialize Google Translate Client ---
# Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set
# pointing to your service account key file.
translate_client = None
try:
    translate_client = translate.Client()
    print("Google Translate client initialized successfully.")
except Exception as e:
    print(f"Error initializing Google Translate client: {e}. Translation endpoint will be disabled.")
    # You might want to handle this more gracefully depending on your app's needs

app = Flask(__name__)

# Add CORS configuration - This should be fine now
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

# --- Translation Endpoint (Correct Placement) --- 
@app.route('/translate', methods=['POST'])
def handle_translate():
    if not translate_client:
        return jsonify({"error": "Translation service not available."}), 503
        
    data = request.get_json()
    if not data or 'text' not in data or 'target_language' not in data:
        return jsonify({"error": "Missing 'text' or 'target_language' in request"}), 400
        
    text_to_translate = data['text']
    target_language = data['target_language']
    source_language = data.get('source_language', None)
    
    try:
        result = translate_client.translate(
            text_to_translate,
            target_language=target_language,
            source_language=source_language
        )
        
        translated_text = result['translatedText']
        detected_source_language = result.get('detectedSourceLanguage', source_language)
        
        return jsonify({
            "translatedText": translated_text,
            "detectedSourceLanguage": detected_source_language
        })
        
    except Exception as e:
        print(f"Error during translation: {e}")
        return jsonify({"error": f"An error occurred during translation: {str(e)}"}), 500

# --- Main execution --- 
# Initialize Google Translate client (if not already done)
try:
    translate_client = translate.Client()
except Exception as e:
    print(f"Warning: Could not initialize Google Translate client: {e}")
    translate_client = None

# --- Add the new endpoint --- 
@app.route('/images-to-pdf', methods=['POST'])
def handle_images_to_pdf():
    if 'images' not in request.files:
        return jsonify({'error': 'No image files provided'}), 400

    files = request.files.getlist('images')

    if not files:
        return jsonify({'error': 'No image files provided'}), 400

    if len(files) > 10:
        return jsonify({'error': 'Maximum 10 images allowed'}), 400

    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=A4)
    width, height = A4 # Get A4 dimensions (page size)

    try:
        for file in files:
            filename = file.filename.lower() if file.filename else '' # Handle case where filename might be None
            if '.' not in filename or filename.rsplit('.', 1)[1] not in allowed_extensions:
                return jsonify({'error': f'Invalid file type: {file.filename}. Allowed types: {allowed_extensions}'}), 400

            try:
                img_data = file.read()
                img = Image.open(io.BytesIO(img_data))
                # Convert image to RGB if it has transparency (like PNG) to avoid potential issues with some PDF viewers
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    img = img.convert('RGB')
                    
                img_width, img_height = img.size

                # Calculate scaling factor to fit image within A4 page, maintaining aspect ratio
                scale_w = width / img_width
                scale_h = height / img_height
                scale = min(scale_w, scale_h) # Use the smaller scale factor

                # Calculate new dimensions based on scale factor
                new_width = int(img_width * scale)
                new_height = int(img_height * scale)

                # --- High-Quality Resizing using Pillow --- 
                if new_width > 0 and new_height > 0:
                    # Use LANCZOS for best quality resizing
                    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    
                    # Save the resized image to a temporary buffer
                    resized_img_buffer = io.BytesIO()
                    # Determine format based on original, default to JPEG for broad compatibility if unknown
                    original_format = img.format if img.format else 'JPEG'
                    if original_format.upper() == 'PNG':
                         resized_img.save(resized_img_buffer, format='PNG')
                    else:
                         # Use JPEG with high quality for other formats
                         resized_img.save(resized_img_buffer, format='JPEG', quality=95) 
                    resized_img_buffer.seek(0)
                    
                    # Center the image on the page
                    x_offset = (width - new_width) / 2
                    y_offset = (height - new_height) / 2

                    # Draw the *resized* image data onto the PDF
                    c.drawImage(ImageReader(resized_img_buffer), x_offset, y_offset, width=new_width, height=new_height, preserveAspectRatio=True)
                # --- End of Resizing --- 
                else:
                    # Handle case of zero dimension if necessary, though unlikely with scaling
                    print(f"Skipping image {file.filename} due to zero calculated dimension.")

                c.showPage() # Move to the next page

            except Exception as img_proc_error:
                print(f"Error processing image {file.filename}: {img_proc_error}")
                # Consider logging the full traceback here for debugging
                # import traceback
                # traceback.print_exc()
                return jsonify({'error': f'Failed to process image: {file.filename}'}), 500

        c.save()
        pdf_buffer.seek(0)
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='converted_document.pdf'
        )

    except Exception as e:
        print(f"Error creating PDF: {e}")
        # Consider logging the full traceback here
        # import traceback
        # traceback.print_exc()
        return jsonify({'error': 'Failed to create PDF document'}), 500

# Make sure this is at the very end
if __name__ == '__main__':
    # Make sure GOOGLE_APPLICATION_CREDENTIALS is set before running
    if 'GOOGLE_APPLICATION_CREDENTIALS' not in os.environ:
        print("\nWarning: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")
        print("Translation API calls will likely fail. Please set it to the path of your service account key file.\n")
    app.run(debug=True, port=5000)