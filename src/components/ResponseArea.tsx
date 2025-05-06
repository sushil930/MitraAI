
import React, { useMemo } from 'react';
import { HistoryItem } from '@/utils/localStorage';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface ResponseAreaProps {
  loading: boolean;
  conversation: HistoryItem[];
  emptyMessage?: string;
}

// Extract message bubble components for better code organization
const UserMessage = ({ content }: { content: string }) => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
      <span className="text-xs font-medium">You</span>
    </div>
    <div className="bg-secondary/30 px-4 py-3 rounded-xl rounded-tl-none">
      <p>{content}</p>
    </div>
  </div>
);

// Static AI avatar (no animation)
// In AIMessage
const AIMessage = ({ content }: { content: string }) => {
  // Ensure content is always a string
  const safeContent = typeof content === 'string' 
    ? content 
    : (content ? JSON.stringify(content) : 'No content available');
    
  return (
    <div className="flex gap-3 items-start ml-6">
      <motion.div 
        className="w-10 h-10 rounded-full overflow-hidden"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      > 
        <img 
          src="/assistant.gif" 
          alt="AI Assistant" 
          className="w-full h-full object-cover"
          style={{ animationPlayState: 'paused' }}
        />
      </motion.div>
      <div className="bg-primary/5 px-4 py-3 rounded-xl rounded-tl-none prose dark:prose-invert max-w-none">
        <ReactMarkdown>{safeContent}</ReactMarkdown>
      </div>
    </div>
  );
};

// Animated AI avatar for the skeleton/loading state
// In SkeletonMessage
const SkeletonMessage = () => (
  <div className="flex gap-3 items-start ml-6">
    <motion.div 
      className="w-16 h-16 rounded-full overflow-hidden ai-thinking" // Added ai-thinking class
      animate={{
        scale: [1, 1.05, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.5, 1],
        repeat: Infinity,
      }}
    > 
      <img 
        src="/assistant.gif" 
        alt="AI Assistant" 
        className="w-full h-full object-cover" 
      />
    </motion.div>
    <div className="bg-primary/5 px-4 py-3 rounded-xl rounded-tl-none w-full max-w-[80%]">
      <div className="space-y-2">
        <motion.div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
      </div>
    </div>
  </div>
);

// In Empty State
const ResponseArea: React.FC<ResponseAreaProps> = ({ 
  conversation, 
  emptyMessage = "Ask me anything to get started!" 
}) => {
  const responseEndRef = React.useRef<HTMLDivElement>(null);
  
  const conversationContent = useMemo(() => {
    // Ensure conversation is always an array
    const currentConversation = Array.isArray(conversation) ? conversation : [];
    
    return currentConversation.map((item) => (
      <motion.div 
        key={item.id} 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <UserMessage content={item.query} />
        
        {/* Show Skeleton if response is undefined/null, otherwise show AI message */}
        {item.response === undefined || item.response === null ? (
           <SkeletonMessage />
        ) : (
           <AIMessage content={item.response} />
        )}
      </motion.div>
    ));
  }, [conversation]); // Dependency is just the conversation array
  
  // Empty state
  if (conversation.length === 0) {
    return (
      <div className="w-full rounded-2xl glass-card p-6 h-[300px] overflow-hidden flex items-center justify-center">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <motion.div 
            className="mx-auto w-24 h-24 rounded-full overflow-hidden ai-thinking" // Increased size and added ai-thinking
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          > 
            <img 
              src="/assistant.gif" 
              alt="AI Assistant" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.p 
            className="text-muted-foreground text-lg" // Increased text size
            animate={{ 
              opacity: [0.7, 1, 0.7] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {emptyMessage}
          </motion.p>
        </motion.div>
      </div>
    );
  }
  
  // Render conversation with or without loading state
  return (
    <div className="w-full rounded-2xl glass-card p-4 h-[300px]">
      <ScrollArea className="h-full pr-4">
        <div className="space-y-6">
          {conversationContent}
          <div ref={responseEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResponseArea;