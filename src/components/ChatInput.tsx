
import React, { useState } from 'react';
import { Mic, MicOff, Send, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPlaceholderText } from '@/utils/assistantUtils';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadFile: (files: FileList) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onUploadFile,
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
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
    // In a real implementation, this would handle speech recognition
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate speech recognition
      setTimeout(() => {
        setMessage(prev => prev + "How can I help you today?");
        setIsListening(false);
      }, 2000);
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

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
            disabled={disabled}
            className="glass-input py-6 px-4 pr-10 w-full text-base"
          />
        </div>
        
        <Button
          onClick={toggleMic}
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full transition-all duration-300",
            isListening ? 'bg-assistant-pink/20 scale-110' : ''
          )}
          disabled={disabled}
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
        >
          <Upload className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="rounded-full assistant-gradient-bg"
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
      </div>
    </div>
  );
};

export default ChatInput;
