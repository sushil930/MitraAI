
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPlaceholderText } from '@/utils/assistantUtils';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react'; // Import the Icon component

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
      const speechEvent = event as CustomSpeechRecognitionEvent;
      let finalTranscript = '';

      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) {
        if (speechEvent.results[i].isFinal) {
          finalTranscript += speechEvent.results[i][0].transcript;
        }
      }

      // If we have a final transcript, send it directly
      if (finalTranscript.trim()) {
        onSendMessage(finalTranscript.trim());
        // Optionally clear the input field visually, though it wasn't being used directly
        setMessage(''); 
      } else {
        // If only interim results, update the input field (optional, could be removed)
        let interimTranscript = '';
        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; ++i) {
           if (!speechEvent.results[i].isFinal) {
              interimTranscript += speechEvent.results[i][0].transcript;
           }
        }
        setMessage(interimTranscript); // Show interim results in the input
      }
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
  }, [onSendMessage]); // Add onSendMessage to dependency array

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

  // In the return statement
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
            className={`glass-input py-6 px-4 pr-10 w-full text-base ${hasSelectedImage ? 'border-assistant-pink shadow-glow-pink' : ''}`}
          />
        </div>
        
        {/* Buttons with enhanced hover effects */}
        {onClearChat && (
          <Button
            onClick={onClearChat}
            variant="outline"
            size="icon"
            className="rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
            title="Clear chat history"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
        
        {/* Other buttons with similar enhancements */}
        {/* ... */}
        
        {/* Replace the above comments with these buttons: */}
        {onImageSearch && (
          <Button
            onClick={handleImageSearchClick}
            variant="outline"
            size="icon"
            className="rounded-full hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-300"
            disabled={disabled}
            title="Search for similar images on the web"
          >
            <Icon icon="tabler:camera-up" className="h-5 w-5" />
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
          className="rounded-full hover:bg-green-500/10 hover:text-green-500 transition-all duration-300"
          disabled={disabled}
          title="Upload files"
        >
          <Icon icon="mi:document-add" className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="rounded-full assistant-gradient-bg hover:shadow-lg hover:scale-105 transition-all duration-300"
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