import React from 'react';
import { Conversation, deleteConversation, restoreConversation } from '@/utils/localStorage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, MessageSquare, Clock } from 'lucide-react';

interface ConversationHistoryProps {
  conversations: Conversation[];
  onConversationSelected: (items: any[]) => void;
  onConversationDeleted: (id: string) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  onConversationSelected,
  onConversationDeleted
}) => {
  if (conversations.length === 0) {
    return null; // Don't show anything if there are no past conversations
  }

  const handleRestore = (id: string) => {
    const items = restoreConversation(id);
    onConversationSelected(items);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    deleteConversation(id);
    onConversationDeleted(id);
  };

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5" />
        Conversation History
      </h3>
      
      <ScrollArea className="h-[200px] w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {conversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => handleRestore(conv.id)}
              className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors flex justify-between items-start"
            >
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full assistant-gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{conv.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.timestamp).toLocaleString()} · {conv.items.length} messages
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => handleDelete(conv.id, e)}
                aria-label="Delete conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationHistory;