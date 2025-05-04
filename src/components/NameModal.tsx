
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getStoredPreferences, updatePreference } from '@/utils/localStorage';

interface NameModalProps {
  open: boolean;
  onClose: () => void;
}

const NameModal: React.FC<NameModalProps> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const { name: storedName } = getStoredPreferences();
  
  // Load name from preferences
  useEffect(() => {
    setName(storedName || '');
  }, [storedName, open]);
  
  const handleSave = () => {
    updatePreference('name', name.trim());
    onClose();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>What's your name?</DialogTitle>
          <DialogDescription>
            I'll use your name to personalize our conversations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
            className="w-full"
            autoFocus
          />
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Skip
          </Button>
          <Button onClick={handleSave} className="assistant-gradient-bg">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NameModal;
