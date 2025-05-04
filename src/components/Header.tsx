
import React from 'react';
import { Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAssistantName } from '@/utils/assistantUtils';
import { getStoredPreferences, updatePreference } from '@/utils/localStorage';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { theme } = getStoredPreferences();
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>(theme);

  // Toggle theme between light and dark
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    setCurrentTheme(newTheme);
    updatePreference('theme', newTheme);
  };

  // Set initial theme on component mount
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, [currentTheme]);

  return (
    <header className="w-full flex justify-between items-center py-4 px-6 animate-fade-in">
      <div className="flex items-center space-x-2">
        <div className="h-10 w-10 rounded-full assistant-gradient-bg flex items-center justify-center">
          <span className="text-white text-lg font-bold">
            {getAssistantName().charAt(0)}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <span className="assistant-gradient-text">{getAssistantName()}</span>
            <span className="ml-2 text-foreground">Assistant</span>
          </h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
          aria-label={currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {currentTheme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="rounded-full"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
