
import React from 'react';
import { HistoryItem } from '@/utils/localStorage';
import { cn } from '@/lib/utils';

interface ResponseAreaProps {
  loading: boolean;
  conversation: HistoryItem[];
  emptyMessage?: string;
}

const ResponseArea: React.FC<ResponseAreaProps> = ({ 
  loading, 
  conversation, 
  emptyMessage = "Ask me anything to get started!" 
}) => {
  const responseEndRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when conversation updates
  React.useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="w-full rounded-2xl glass-card p-6 h-[300px] overflow-y-auto">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="flex space-x-2 items-center">
            <div className="w-3 h-3 rounded-full assistant-gradient-bg animate-pulse"></div>
            <div className="w-3 h-3 rounded-full assistant-gradient-bg animate-pulse delay-150"></div>
            <div className="w-3 h-3 rounded-full assistant-gradient-bg animate-pulse delay-300"></div>
            <span className="ml-2">Thinking...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (conversation.length === 0) {
    return (
      <div className="w-full rounded-2xl glass-card p-6 h-[300px] overflow-y-auto flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full assistant-gradient-bg flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  // Render conversation
  return (
    <div className="w-full rounded-2xl glass-card p-4 h-[300px] overflow-y-auto">
      <div className="space-y-6">
        {conversation.map((item, index) => (
          <div 
            key={item.id} 
            className={cn(
              "space-y-3",
              index === conversation.length - 1 && "animate-fade-in"
            )}
          >
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-medium">You</span>
              </div>
              <div className="bg-secondary/30 px-4 py-3 rounded-xl rounded-tl-none">
                <p>{item.query}</p>
              </div>
            </div>
            
            {item.response && (
              <div className={cn(
                "flex gap-3 items-start ml-6",
                index === conversation.length - 1 && "animate-fade-in transition-all"
              )}>
                <div className="w-8 h-8 rounded-full assistant-gradient-bg flex items-center justify-center">
                  <span className="text-xs font-medium text-white">AI</span>
                </div>
                <div className="bg-primary/5 px-4 py-3 rounded-xl rounded-tl-none">
                  <p>{item.response}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={responseEndRef} />
      </div>
    </div>
  );
};

export default ResponseArea;
