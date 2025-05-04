
import React, { useState, useEffect } from 'react';
import { getGreeting, getDescriptionText, getSimulatedResponse } from '@/utils/assistantUtils';
import { getStoredPreferences, getStoredHistory, addHistoryItem, HistoryItem } from '@/utils/localStorage';
import Header from './Header';
import ChatInput from './ChatInput';
import ResponseArea from './ResponseArea';
import FileUpload from './FileUpload';
import SettingsModal from './SettingsModal';
import NameModal from './NameModal';

const AIAssistant: React.FC = () => {
  const [greeting, setGreeting] = useState('');
  const [description, setDescription] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [conversation, setConversation] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize on first render
  useEffect(() => {
    const { name } = getStoredPreferences();
    const savedHistory = getStoredHistory();
    
    setConversation(savedHistory);
    
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
  
  // Handle sending a new message
  const handleSendMessage = async (message: string) => {
    // Add user message to history
    const updatedHistory = addHistoryItem(message);
    setConversation(updatedHistory);
    
    setLoading(true);
    
    try {
      // Get simulated response (in a real app, this would be an API call)
      const response = await getSimulatedResponse(message);
      
      // Update with AI response
      const historyWithResponse = addHistoryItem(message, response);
      setConversation(historyWithResponse);
    } catch (error) {
      console.error('Error getting response:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file uploads
  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };
  
  // Remove a file from the upload list
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background to-accent/10 transition-colors duration-300">
      <div className="wave"></div>
      
      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        
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
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onUploadFile={handleFileUpload}
          disabled={loading} 
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
