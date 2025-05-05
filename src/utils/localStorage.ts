
// User preferences storage
interface UserPreferences {
  name: string;
  language: 'en' | 'hi';
  gender: 'neutral' | 'male' | 'female';
  theme: 'light' | 'dark';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  name: '',
  language: 'en',
  gender: 'neutral',
  theme: 'dark',
};

// Get stored user preferences or return defaults
export const getStoredPreferences = (): UserPreferences => {
  try {
    const storedPrefs = localStorage.getItem('ai-assistant-prefs');
    if (storedPrefs) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) };
    }
  } catch (e) {
    console.error('Error loading preferences:', e);
  }
  return { ...DEFAULT_PREFERENCES };
};

// Update a single preference
export const updatePreference = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): UserPreferences => {
  const currentPrefs = getStoredPreferences();
  const updatedPrefs = { ...currentPrefs, [key]: value };
  
  try {
    localStorage.setItem('ai-assistant-prefs', JSON.stringify(updatedPrefs));
  } catch (e) {
    console.error('Error saving preferences:', e);
  }
  
  return updatedPrefs;
};

// Clear all preferences (reset to defaults)
export const clearPreferences = (): void => {
  try {
    localStorage.removeItem('ai-assistant-prefs');
  } catch (e) {
    console.error('Error clearing preferences:', e);
  }
};

// Session history storage
export interface HistoryItem {
  id: string;
  query: string;
  response?: string;
  timestamp: number;
}

// Get stored conversation history
export const getStoredHistory = (): HistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem('ai-assistant-history');
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
  } catch (e) {
    console.error('Error loading history:', e);
  }
  return [];
};

// Add a new history item
// Update the response of a specific history item by its ID
export const updateHistoryItemResponse = (id: string, response: string): HistoryItem[] => {
  const currentHistory = getStoredHistory();
  const updatedHistory = currentHistory.map(item =>
    item.id === id ? { ...item, response } : item
  );

  try {
    localStorage.setItem('ai-assistant-history', JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Error updating history:', e);
  }

  return updatedHistory;
};

// Modify addHistoryItem slightly to accept an optional ID
export const addHistoryItem = (query: string, response?: string, id?: string): HistoryItem[] => {
  const currentHistory = getStoredHistory();
  const newItem: HistoryItem = {
    id: id || crypto.randomUUID(), // Use provided ID or generate new one
    query,
    response,
    timestamp: Date.now()
  };

  // Avoid adding duplicates if an ID was provided (shouldn't happen with UUIDs but good practice)
  const historyWithoutPotentialDuplicate = id ? currentHistory.filter(item => item.id !== id) : currentHistory;

  const updatedHistory = [newItem, ...historyWithoutPotentialDuplicate].slice(0, 50); // Keep last 50 items

  try {
    localStorage.setItem('ai-assistant-history', JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Error saving history:', e);
  }

  return updatedHistory;
};

// Clear conversation history
export const clearHistory = (): void => {
  try {
    localStorage.removeItem('ai-assistant-history');
  } catch (e) {
    console.error('Error clearing history:', e);
  }
};

// Past conversations storage
export interface Conversation {
  id: string;
  title: string; // First message or auto-generated title
  items: HistoryItem[];
  timestamp: number;
}

// Get stored past conversations
export const getStoredConversations = (): Conversation[] => {
  try {
    const storedConversations = localStorage.getItem('ai-assistant-conversations');
    if (storedConversations) {
      return JSON.parse(storedConversations);
    }
  } catch (e) {
    console.error('Error loading conversations:', e);
  }
  return [];
};

// Save current conversation to history and clear current
export const archiveCurrentConversation = (): void => {
  const currentHistory = getStoredHistory();
  
  // Only archive if there's something to archive
  if (currentHistory.length > 0) {
    const conversations = getStoredConversations();
    
    // Create a title from the first message or use a timestamp
    const title = currentHistory.length > 0 
      ? currentHistory[currentHistory.length - 1].query.substring(0, 30) + (currentHistory[currentHistory.length - 1].query.length > 30 ? '...' : '')
      : `Conversation ${new Date().toLocaleString()}`;
    
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      items: [...currentHistory],
      timestamp: Date.now()
    };
    
    // Add to conversations history
    const updatedConversations = [newConversation, ...conversations].slice(0, 10); // Keep last 10 conversations
    
    try {
      localStorage.setItem('ai-assistant-conversations', JSON.stringify(updatedConversations));
    } catch (e) {
      console.error('Error saving conversations:', e);
    }
  }
  
  // Clear current history
  clearHistory();
};

// Delete a specific conversation from history
export const deleteConversation = (id: string): Conversation[] => {
  const conversations = getStoredConversations();
  const updatedConversations = conversations.filter(conv => conv.id !== id);
  
  try {
    localStorage.setItem('ai-assistant-conversations', JSON.stringify(updatedConversations));
  } catch (e) {
    console.error('Error deleting conversation:', e);
  }
  
  return updatedConversations;
};

export const clearAllData = (): void => {
  try {
    localStorage.removeItem('ai-assistant-prefs'); // Correct key
    localStorage.removeItem('ai-assistant-history'); // Correct key
    localStorage.removeItem('ai-assistant-conversations'); // Correct key
    // Clear any other data you might be storing using the correct keys
    console.log('All data cleared from localStorage.');
  } catch (e) {
    console.error('Error clearing all data:', e);
  }
};

// Restore a conversation from history to current
export const restoreConversation = (id: string): HistoryItem[] => {
  const conversations = getStoredConversations();
  const conversation = conversations.find(conv => conv.id === id);
  
  if (conversation) {
    try {
      localStorage.setItem('ai-assistant-history', JSON.stringify(conversation.items));
    } catch (e) {
      console.error('Error restoring conversation:', e);
    }
    
    return conversation.items;
  }
  
  return [];
};
