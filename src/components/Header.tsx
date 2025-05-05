
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, PlusCircle, Wrench, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/use-theme';

interface HeaderProps {
  onOpenSettings: () => void;
  onNewConversation: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onOpenSettings, 
  onNewConversation
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // Use the theme hook

  const goToTools = () => {
    navigate('/tools');
  };

  return (
    <header className="flex justify-between items-center py-2">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-bold">Mitra Assistant</h1>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenSettings} title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={goToTools} title="Tools">
          <Wrench className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNewConversation} title="Start new conversation">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
