
import React from 'react';
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
import { FemaleSign, MaleSign, Translate, User } from 'lucide-react';
import { getStoredPreferences, updatePreference } from '@/utils/localStorage';

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
  
  const handleLanguageChange = (value: 'en' | 'hi') => {
    updatePreference('language', value);
  };
  
  const handleGenderChange = (value: 'neutral' | 'male' | 'female') => {
    updatePreference('gender', value);
  };
  
  return (
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
                    <MaleSign className="mb-2 h-5 w-5" />
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
                    <FemaleSign className="mb-2 h-5 w-5" />
                    Female
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
          
          <TabsContent value="language" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center">
                <Translate className="mr-2 h-4 w-4" /> 
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
  );
};

export default SettingsModal;
