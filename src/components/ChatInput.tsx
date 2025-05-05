
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Upload, Trash2, Search } from 'lucide-react'; // Add Search icon
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPlaceholderText } from '@/utils/assistantUtils';
import { cn } from '@/lib/utils';

// Define the interface for the SpeechRecognition API
interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  // Add the missing event handlers
  onresult: ((this: CustomSpeechRecognition, ev: CustomSpeechRecognitionEvent) => any) | null;
  onerror: ((this: CustomSpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: CustomSpeechRecognition, ev: Event) => any) | null;
  // Add other properties/methods if needed
}

// Define the interface for the SpeechRecognitionEvent
// Inherit from Event and add specific properties
interface CustomSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  // Add other properties if needed
}

// Define the interface for SpeechRecognitionErrorEvent (if not globally available)
// Usually available, but defining it ensures compatibility
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string; // Typically a SpeechRecognitionErrorCode enum, but string is safer
  readonly message: string;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: new () => CustomSpeechRecognition;
    webkitSpeechRecognition: new () => CustomSpeechRecognition;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadFile: (files: FileList) => void;
  onClearChat?: () => void;
  onImageSearch?: (file: File) => void; // Add new prop for image search
  disabled?: boolean;
  hasSelectedImage?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onUploadFile,
  onClearChat,
  onImageSearch, // Add new prop
  disabled = false,
  hasSelectedImage = false
}) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageSearchInputRef = useRef<HTMLInputElement>(null); // New ref for image search input
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Process speech in chunks
    recognition.interimResults = true; // Get results as they come in
    recognition.lang = 'en-US'; // Set language

    recognition.onresult = (event: Event) => {
      // Type assertion is still needed here as the base 'Event' doesn't have these properties
      const speechEvent = event as CustomSpeechRecognitionEvent; 
      let interimTranscript = '';
      let finalTranscript = '';

      // Use speechEvent.resultIndex directly
      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) { 
        if (speechEvent.results[i].isFinal) {
          finalTranscript += speechEvent.results[i][0].transcript;
        } else {
          interimTranscript += speechEvent.results[i][0].transcript;
        }
      }
      setMessage(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: Event) => {
      // Type assertion for error event
      const errorEvent = event as SpeechRecognitionErrorEvent;
      console.error('Speech recognition error', errorEvent.error, errorEvent.message);
      setIsListening(false);
    };

    // onend uses a standard Event, no change needed here
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Cleanup function to stop recognition if component unmounts
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      console.error('Speech Recognition not initialized.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Clear message before starting new recognition
      setMessage(''); 
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false); // Ensure state is reset on error
      }
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files);
    }
  };

  // Add new handler for image search
  const handleImageSearchClick = () => {
    if (imageSearchInputRef.current) {
      imageSearchInputRef.current.click();
    }
  };

  // Add new handler for image search file change
  const handleImageSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onImageSearch) {
      onImageSearch(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasSelectedImage ? "Ask a question about the selected image..." : getPlaceholderText()}
            disabled={disabled}
            className={`glass-input py-6 px-4 pr-10 w-full text-base ${hasSelectedImage ? 'border-assistant-pink' : ''}`}
          />
        </div>
        
        {/* Add Clear Chat button */}
        {onClearChat && (
          <Button
            onClick={onClearChat}
            variant="outline"
            size="icon"
            className="rounded-full"
            title="Clear chat history"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
        
        {/* Add Image Search button */}
        {onImageSearch && (
          <Button
            onClick={handleImageSearchClick}
            variant="outline"
            size="icon"
            className="rounded-full"
            disabled={disabled}
            title="Search for similar images on the web"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        <Button
          onClick={toggleMic}
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full transition-all duration-300",
            isListening ? 'bg-assistant-pink/20 scale-110' : '',
            !recognitionRef.current ? 'opacity-50 cursor-not-allowed' : ''
          )}
          disabled={disabled || !recognitionRef.current}
          title={!recognitionRef.current ? "Speech recognition not supported" : (isListening ? "Stop listening" : "Start listening")}
        >
          {isListening ? (
            <div className="relative">
              <MicOff className="h-5 w-5 text-assistant-pink animate-pulse" />
              <div className="absolute -inset-2 border-2 border-assistant-pink/30 rounded-full animate-ping" />
            </div>
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          onClick={handleFileClick}
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={disabled}
          title="Upload files"
        >
          <Upload className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="rounded-full assistant-gradient-bg"
          title="Send message"
        >
          <Send className="h-5 w-5 text-white" />
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
        
        {/* Add hidden input for image search */}
        <input
          type="file"
          ref={imageSearchInputRef}
          onChange={handleImageSearchChange}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
};

export default ChatInput;
