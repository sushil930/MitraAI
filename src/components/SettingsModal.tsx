
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, UserRound, UserSquare, Globe, Trash2 } from 'lucide-react';
import { getStoredPreferences, updatePreference, clearAllData } from '@/utils/localStorage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onNameChange: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  open, 
  onClose,
  onNameChange
}) => {
  const { language, gender } = getStoredPreferences();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const handleLanguageChange = (value: 'en' | 'hi') => {
    updatePreference('language', value);
  };
  
  const handleGenderChange = (value: 'neutral' | 'male' | 'female') => {
    updatePreference('gender', value);
  };
  
  const handleResetData = () => {
    clearAllData();
    setResetDialogOpen(false);
    // Close the settings modal after reset
    onClose();
    // Force page reload to reflect cleared data
    window.location.reload();
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Customize your assistant experience
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="language">Language</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6 py-4">
              <div>
                <Button 
                  variant="outline" 
                  onClick={onNameChange} 
                  className="w-full"
                >
                  Change Your Name
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Assistant Gender</Label>
                <RadioGroup 
                  defaultValue={gender} 
                  onValueChange={(value) => handleGenderChange(value as 'neutral' | 'male' | 'female')}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem 
                      value="neutral" 
                      id="gender-neutral" 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor="gender-neutral"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <User className="mb-2 h-5 w-5" />
                      Neutral
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="male" 
                      id="gender-male" 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor="gender-male"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <UserSquare className="mb-2 h-5 w-5" />
                      Male
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="female" 
                      id="gender-female" 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor="gender-female"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <UserRound className="mb-2 h-5 w-5" />
                      Female
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Reset Data Button */}
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="destructive" 
                  onClick={() => setResetDialogOpen(true)} 
                  className="w-full flex items-center justify-center"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This will clear all your conversations and preferences
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="language" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Globe className="mr-2 h-4 w-4" /> 
                  Interface Language
                </Label>
                <RadioGroup 
                  defaultValue={language} 
                  onValueChange={(value) => handleLanguageChange(value as 'en' | 'hi')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem 
                      value="en" 
                      id="lang-en" 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor="lang-en"
                      className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      English
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="hi" 
                      id="lang-hi" 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor="lang-hi"
                      className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      हिन्दी (Hindi)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your conversations and reset all preferences.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground">
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsModal;
