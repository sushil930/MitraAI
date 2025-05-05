
import React, { useState, useEffect } from 'react';
import { getGreeting, getDescriptionText } from '@/utils/assistantUtils';
import { 
  getStoredPreferences, 
  getStoredHistory, 
  addHistoryItem, 
  HistoryItem, 
  clearHistory, 
  updateHistoryItemResponse,
  getStoredConversations,
  archiveCurrentConversation,
  Conversation,
  deleteConversation
} from '@/utils/localStorage';
import { apiService } from '@/utils/apiService';
import Header from './Header';
import ChatInput from './ChatInput';
import ResponseArea from './ResponseArea';
import FileUpload from './FileUpload';
import SettingsModal from './SettingsModal';
import NameModal from './NameModal';
import ConversationHistory from './ConversationHistory';

const AIAssistant: React.FC = () => {
  const [greeting, setGreeting] = useState('');
  const [description, setDescription] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [conversation, setConversation] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [selectedImageForSearch, setSelectedImageForSearch] = useState<File | null>(null);
  
  const [pastConversations, setPastConversations] = useState<Conversation[]>([]);
  
  // Initialize on first render
  useEffect(() => {
    const { name } = getStoredPreferences();
    const savedHistory = getStoredHistory();
    const savedConversations = getStoredConversations();
    
    setConversation(savedHistory);
    setPastConversations(savedConversations);
    
    // Show name modal if name not set
    if (!name) {
      setNameModalOpen(true);
    }
    
    setInitialized(true);
  }, []);
  
  // Update greeting and description when preferences change
  useEffect(() => {
    if (initialized) {
      setGreeting(getGreeting());
      setDescription(getDescriptionText());
    }
  }, [initialized, settingsOpen, nameModalOpen]);
  
  // Add a new state variable for document context
  const [documentContext, setDocumentContext] = useState<string | null>(null);
  
  // Handle sending a new message
  const handleSendMessage = async (message: string) => {
    const newItemId = crypto.randomUUID(); 
    // Use the user's message for the placeholder if it's an image search query
    const placeholderMessage = selectedImageForSearch ? message : message;
    const placeholderHistory = addHistoryItem(placeholderMessage, undefined, newItemId); 
    setConversation(placeholderHistory);
    setLoading(true);
    const currentSelectedImage = selectedImageForSearch; 

    try {
      const { language, gender } = getStoredPreferences();
      let responseText: string; // Ensure we always store a string
      
      if (currentSelectedImage) {
        // Use image search endpoint
        const result = await apiService.searchImage(
          message, 
          currentSelectedImage,
          language
        );
        
        if (result && typeof result === 'object' && 'searchUrl' in result) {
          window.open(result.searchUrl, '_blank');
          responseText = `Opened Google Images search for '${currentSelectedImage.name}' in a new tab based on your query: "${message}".`;
        } else {
          // Handle unexpected response format
          console.warn('Unexpected response format from searchImage:', result);
          responseText = 'Received unexpected response format from image search.';
        }
        
        setSelectedImageForSearch(null);
        setUploadedFiles(prev => prev.filter(file => file !== currentSelectedImage));

      } else {
        // Regular text search
        const historyForContext = placeholderHistory.slice(1); 
        
        let enhancedQuery = message;
        if (documentContext) {
          enhancedQuery = `Based on the following document:\n\n${documentContext}\n\nQuestion: ${message}`;
        }
        
        // Call API
        const apiResult = await apiService.getResponse(
          enhancedQuery, 
          historyForContext,
          language,
          gender.charAt(0).toUpperCase() + gender.slice(1) as 'Neutral' | 'Male' | 'Female'
        );

        // Ensure apiResult is a string
        if (typeof apiResult === 'string') {
          responseText = apiResult;
        } else if (apiResult && typeof apiResult === 'object') {
          // *** Cast apiResult to any to access potential properties ***
          const resultObj = apiResult as any; 
          
          // Try to extract a string from the object
          if (resultObj.text && typeof resultObj.text === 'string') {
            responseText = resultObj.text;
          } else if (resultObj.response && typeof resultObj.response === 'string') {
            responseText = resultObj.response;
          } else {
            // Last resort: stringify the object
            try {
              responseText = JSON.stringify(resultObj);
            } catch (e) {
              responseText = "Received a complex response that couldn't be displayed.";
            }
          }
        } else {
          console.warn('apiService.getResponse returned non-string in handleSendMessage:', apiResult);
          responseText = "Received unexpected response format."; // Fallback string
        }
      }

      // Update history with the guaranteed response string
      const finalHistory = updateHistoryItemResponse(newItemId, responseText); 
      setConversation(finalHistory);

    } catch (error) {
      console.error('Error getting response:', error);
      const errorText = error instanceof Error ? error.message : "Sorry, I encountered an error.";
      const errorHistory = updateHistoryItemResponse(newItemId, errorText);
      setConversation(errorHistory);
      if (currentSelectedImage) {
          setSelectedImageForSearch(null);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file uploads
  const handleFileUpload = async (files: FileList) => {
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    for (const file of newFiles) {
      setLoading(true);
      let responseText: string | undefined; // Use a clearly typed variable
      let extractedText: string | null = null;
      const message = `Analyze this ${file.type.startsWith('image/') ? 'image' : 'document'}: ${file.name}`;
      const newItemId = crypto.randomUUID(); // Use ID for potential error update
      const placeholderHistory = addHistoryItem(message, undefined, newItemId);
      setConversation(placeholderHistory);

      try {
        if (file.type.startsWith('image/')) {
          // Assuming analyzeImage should return a string analysis
          const analysisResult = await apiService.analyzeImage(file);
          // Ensure the result is a string
          if (typeof analysisResult === 'string') {
            responseText = analysisResult;
          } else {
            // Fallback if the backend returned something unexpected
            console.warn('apiService.analyzeImage did not return a string:', analysisResult);
            responseText = `Received unexpected analysis format for ${file.name}.`; 
          }
        } else {
          // Document handling
          const result = await apiService.analyzeDocument(file);
          extractedText = result.extractedText ?? null;
          
          if (extractedText) {
            setDocumentContext(extractedText);
            responseText = `Document '${file.name}' has been processed. You can now ask questions about its content.`;
          } else {
            // Use the response field from backend or a default
            responseText = result.response || `Document '${file.name}' uploaded, but no text could be extracted or no specific response provided.`;
          }
        }
        
        // Update history with the final response string
        const finalHistory = updateHistoryItemResponse(newItemId, responseText);
        setConversation(finalHistory);

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        const errorText = error instanceof Error ? error.message : `Failed to process ${file.name}.`;
        // Update the placeholder with the error message
        const errorHistory = updateHistoryItemResponse(newItemId, errorText);
        setConversation(errorHistory);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Remove a file from the upload list
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle starting a new conversation
  const handleNewConversation = () => {
    // Archive current conversation before clearing
    archiveCurrentConversation();
    
    // Update the past conversations state
    setPastConversations(getStoredConversations());
    
    // Clear current conversation state
    setConversation([]);
    setUploadedFiles([]);
    setDocumentContext(null); // Clear document context
  };
  
  // Handle selecting a past conversation
  const handleConversationSelected = (items: HistoryItem[]) => {
    setConversation(items);
  };
  
  // Handle deleting a past conversation
  const handleConversationDeleted = (id: string) => {
    setPastConversations(prev => prev.filter(conv => conv.id !== id));
  };
  
  // New method to select an image for search
  const handleSelectImageForSearch = (index: number) => {
    const selectedFile = uploadedFiles[index];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setSelectedImageForSearch(selectedFile);
    }
  };
  
  // Add a new function to handle clearing the current chat
  const handleClearChat = () => {
    // Clear the current conversation state without archiving
    clearHistory(); // This clears from localStorage
    setConversation([]); // This clears from state
    setUploadedFiles([]); // Also clear any uploaded files
    setSelectedImageForSearch(null); // Reset selected image if any
    setDocumentContext(null); // Clear document context
  };
  
  // Add a new handler for image search
  const handleImageSearch = async (file: File) => {
    setLoading(true);
    const newItemId = crypto.randomUUID();
    const message = `Searching for images similar to '${file.name}'...`;
    const placeholderHistory = addHistoryItem(message, undefined, newItemId);
    setConversation(placeholderHistory);

    try {
      const { language } = getStoredPreferences();
      // Use a generic query, backend will refine it for keyword generation
      const queryForBackend = "Find similar images"; 
      
      // Call the API service
      const result = await apiService.searchImage(queryForBackend, file, language);
      
      // Ensure result is properly handled
      if (result && typeof result === 'object' && 'searchUrl' in result) {
        window.open(result.searchUrl, '_blank');
        // Update history to indicate success
        const successMessage = `Opened Google Images search for '${file.name}' in a new tab.`;
        const finalHistory = updateHistoryItemResponse(newItemId, successMessage);
        setConversation(finalHistory);
      } else {
        // Handle unexpected response format
        console.warn('Unexpected response format from searchImage:', result);
        const errorMessage = 'Received unexpected response format from image search.';
        const errorHistory = updateHistoryItemResponse(newItemId, errorMessage);
        setConversation(errorHistory);
      }

    } catch (error) {
      console.error('Error during image search:', error);
      const errorText = error instanceof Error ? error.message : "Sorry, I encountered an error during the image search.";
      // Update history with error
      const errorHistory = updateHistoryItemResponse(newItemId, errorText);
      setConversation(errorHistory);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background to-accent/10 transition-colors duration-300">
      <div className="wave"></div>
      
      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Header 
          onOpenSettings={() => setSettingsOpen(true)} 
          onNewConversation={handleNewConversation}
        />
        
        <div className="space-y-1 text-center animate-fade-in">
          <h2 className="text-3xl font-bold">{greeting}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        <ResponseArea 
          loading={loading} 
          conversation={conversation} 
        />
        
        <FileUpload 
          files={uploadedFiles} 
          onRemoveFile={handleRemoveFile}
          onSelectImageForSearch={handleSelectImageForSearch}
          selectedImageForSearch={selectedImageForSearch}
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onUploadFile={handleFileUpload}
          onClearChat={conversation.length > 0 ? handleClearChat : undefined}
          onImageSearch={handleImageSearch} // Ensure this handler is passed
          disabled={loading}
          hasSelectedImage={!!selectedImageForSearch} 
        />
        
        <ConversationHistory 
          conversations={pastConversations}
          onConversationSelected={handleConversationSelected}
          onConversationDeleted={handleConversationDeleted}
        />
      </div>
      
      <SettingsModal 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        onNameChange={() => {
          setSettingsOpen(false);
          setNameModalOpen(true);
        }}
      />
      
      <NameModal 
        open={nameModalOpen} 
        onClose={() => setNameModalOpen(false)}
      />
    </div>
  );
};

export default AIAssistant;
