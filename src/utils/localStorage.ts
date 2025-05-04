
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
export const addHistoryItem = (query: string, response?: string): HistoryItem[] => {
  const currentHistory = getStoredHistory();
  const newItem: HistoryItem = {
    id: crypto.randomUUID(),
    query,
    response,
    timestamp: Date.now()
  };
  
  const updatedHistory = [newItem, ...currentHistory].slice(0, 50); // Keep last 50 items
  
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
