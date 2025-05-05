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
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting response:', error);
      throw error;
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
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('query', query);
      formData.append('language', language);
      
      const response = await fetch(`${API_BASE_URL}/search-image`, {
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
      
      const data = await response.json();
      if (!data.searchUrl) {
        throw new Error('Backend did not return a search URL.');
      }
      return data; // Return the whole object { searchUrl: '...' }
    } catch (error) {
      console.error('Error searching image:', error);
      throw error;
    }
  }
};