
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
    const placeholderHistory = addHistoryItem(message, undefined, newItemId); 
    setConversation(placeholderHistory);
    setLoading(true);

    try {
      const { language, gender } = getStoredPreferences();
      let response;
      
      // Check if we have a selected image for search
      if (selectedImageForSearch) {
        // Use image search endpoint
        response = await apiService.searchImage(
          message,
          selectedImageForSearch,
          language
        );
        
        // Clear the selected image after search
        setSelectedImageForSearch(null);
        // Also remove it from uploaded files
        setUploadedFiles(prev => prev.filter(file => file !== selectedImageForSearch));
      } else {
        // Use regular text search
        const historyForContext = placeholderHistory.slice(1);
        
        // If we have document context, include it in the query
        let enhancedQuery = message;
        if (documentContext) {
          // Prepend the document context to the query
          enhancedQuery = `Based on the following document:\n\n${documentContext}\n\nQuestion: ${message}`;
        }
        
        response = await apiService.getResponse(
          enhancedQuery, 
          historyForContext,
          language,
          gender.charAt(0).toUpperCase() + gender.slice(1) as 'Neutral' | 'Male' | 'Female'
        );
      }

      const finalHistory = updateHistoryItemResponse(newItemId, response); 
      setConversation(finalHistory);

    } catch (error) {
      console.error('Error getting response:', error);
      const errorText = error instanceof Error ? error.message : "Sorry, I encountered an error.";
      const errorHistory = updateHistoryItemResponse(newItemId, errorText);
      setConversation(errorHistory);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file uploads
  const handleFileUpload = async (files: FileList) => {
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Process each file if needed
    for (const file of newFiles) {
      setLoading(true);
      try {
        let response;
        let extractedText = null;
        
        if (file.type.startsWith('image/')) {
          response = await apiService.analyzeImage(file);
        } else {
          // For documents, we now get both extracted text and response
          const result = await apiService.analyzeDocument(file);
          response = result.response || "Document uploaded successfully. You can now ask questions about it.";
          extractedText = result.extractedText;
          
          // If we got extracted text, store it in state
          if (extractedText) {
            setDocumentContext(extractedText);
            // Add a message to indicate document is ready for questions
            response = `Document '${file.name}' has been processed. You can now ask questions about its content.`;
          }
        }
        
        // Add the file analysis to the conversation
        const message = `Analyze this ${file.type.startsWith('image/') ? 'image' : 'document'}: ${file.name}`;
        const updatedHistory = addHistoryItem(message, response);
        setConversation(updatedHistory);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
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
      
      // Open the returned URL in a new tab
      if (result.searchUrl) {
        window.open(result.searchUrl, '_blank');
        // Update history to indicate success
        const successMessage = `Opened Google Images search for '${file.name}' in a new tab.`;
        const finalHistory = updateHistoryItemResponse(newItemId, successMessage);
        setConversation(finalHistory);
      } else {
        // Handle case where URL is missing (shouldn't happen with apiService check)
        throw new Error('Search URL was not returned from the backend.');
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
