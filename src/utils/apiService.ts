import { HistoryItem } from './localStorage';

const API_BASE_URL = 'http://localhost:5000'; // Changed port from 8000 to 5000

// Convert frontend HistoryItem to backend format
const convertHistoryForBackend = (history: HistoryItem[]) => {
  return history.map(item => ({
    role: item.response ? 'model' : 'user',
    parts: item.response || item.query
  }));
};

// API service for interacting with the backend
export const apiService = {
  // Get a greeting with the user's name
  async getGreeting(name: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/greet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting greeting:', error);
      return `Hello ${name}!`; // Fallback greeting
    }
  },
  
  // Send a search query to the backend
  async getResponse(query: string, history: HistoryItem[], language: 'en' | 'hi', gender: 'Neutral' | 'Male' | 'Female'): Promise<string> {
    try {
      // Convert history to the format expected by the backend
      const formattedHistory = convertHistoryForBackend(history);
      
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          language,
          gender,
          history: formattedHistory
        })
      });
      
      if (!response.ok) {
        // Try to get error message from backend response
        let errorMsg = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore if response is not JSON */ }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      // *** Add check here ***
      if (typeof data.response === 'string') {
        return data.response;
      } else {
        console.warn('API response for /search was not a string:', data.response);
        // Attempt to stringify if it's an object, otherwise return a default error message
        if (typeof data.response === 'object' && data.response !== null) {
          try {
            return JSON.stringify(data.response);
          } catch (stringifyError) {
            return 'Received complex object response from API that could not be displayed.';
          }
        } 
        return 'Received unexpected response format from API.';
      }
    } catch (error) {
      console.error('Error getting response:', error);
      // Ensure the thrown error is always an Error object with a string message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unknown error occurred while fetching the response.');
      }
    }
  },
  
  // Upload and analyze a document
  async analyzeDocument(file: File): Promise<{ extractedText?: string, response?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/upload-doc`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        extractedText: data.extracted_text,
        response: data.response // For backward compatibility
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  },
  
  // Upload and analyze an image
  async analyzeImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/upload-image`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  },
  
  // Get weather data for a location
  async getWeather(location: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/get-weather?location=${encodeURIComponent(location)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting weather data:', error);
      throw error;
    }
  },
  
  // NEW METHOD: Search through an image with a query
  async searchImage(query: string, imageFile: File, language: 'en' | 'hi' = 'en'): Promise<{ searchUrl: string }> { // Return type changed
    console.log('Frontend: Calling searchImage API...'); // Add logging
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('query', query);
      formData.append('language', language);
      
      const response = await fetch(`${API_BASE_URL}/search-image`, {
        method: 'POST',
        body: formData
        // Consider adding a timeout here if requests hang indefinitely
      });
      
      console.log('Frontend: Received response status:', response.status); // Add logging
      
      if (!response.ok) {
        // Try to get error message from backend response
        let errorMsg = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Frontend: Backend error data:', errorData); // Log error details
          errorMsg = errorData.error || errorMsg;
        } catch (e) { 
          console.error('Frontend: Could not parse error response as JSON.'); // Log parsing error
          /* Ignore if response is not JSON */ 
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      console.log('Frontend: Received data:', data); // Log success data
      if (!data.searchUrl || typeof data.searchUrl !== 'string') { // Add type check
        console.error('Frontend: Invalid searchUrl received:', data.searchUrl); // Log invalid URL
        throw new Error('Backend did not return a valid search URL.');
      }
      return data; // Return the whole object { searchUrl: '...' }
    } catch (error) {
      console.error('Frontend: Error in searchImage API call:', error); // Log any caught error
      // Rethrow the error so the calling component knows something went wrong
      throw error instanceof Error ? error : new Error('An unknown error occurred during image search.');
    }
  },
  
  // NEW METHOD: Translate text
  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<{ translatedText: string, detectedSourceLanguage?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          target_language: targetLanguage,
          source_language: sourceLanguage // Will be undefined if not provided
        })
      });
      
      if (!response.ok) {
        let errorMsg = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  },
  
  // NEW METHOD: Convert images to PDF
  async convertImagesToPdf(imageFiles: File[]): Promise<Blob> {
    try {
      const formData = new FormData();
      
      // Append each image file to the FormData with the same key name 'images'
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      
      const response = await fetch(`${API_BASE_URL}/images-to-pdf`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        // Try to get error message from backend response
        let errorMsg = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore if response is not JSON */ }
        throw new Error(errorMsg);
      }
      
      // Return the response as a blob (PDF file)
      return await response.blob();
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      throw error;
    }
  }
};
