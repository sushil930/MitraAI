
import { getStoredPreferences } from './localStorage';

// Gender-based greeting options
const greetings = {
  neutral: {
    en: ["Hello", "Hi", "Hey there", "Welcome"],
    hi: ["नमस्ते", "हेलो", "हाय", "स्वागत है"]
  },
  male: {
    en: ["Hello Sir", "Hi there Sir", "Welcome Sir"],
    hi: ["नमस्ते श्रीमान", "हेलो सर", "स्वागत है श्रीमान"]
  },
  female: {
    en: ["Hello Ma'am", "Hi there Ma'am", "Welcome Ma'am"],
    hi: ["नमस्ते मैडम", "हेलो मैडम", "स्वागत है मैडम"]
  }
};

// Get a random greeting based on preferences
export const getGreeting = (): string => {
  const { language, gender, name } = getStoredPreferences();
  const genderGreetings = greetings[gender][language];
  const randomGreeting = genderGreetings[Math.floor(Math.random() * genderGreetings.length)];
  
  if (name) {
    return `${randomGreeting}, ${name}!`;
  }
  return `${randomGreeting}!`;
};

// Generate placeholder text based on language
export const getPlaceholderText = (): string => {
  const { language } = getStoredPreferences();
  return language === 'en' 
    ? "Ask me anything..." 
    : "कुछ भी पूछें...";
};

// Get description text based on language
export const getDescriptionText = (): string => {
  const { language } = getStoredPreferences();
  return language === 'en'
    ? "I can help you search the web, analyze documents, and answer your questions"
    : "मैं आपको वेब खोज, दस्तावेज़ विश्लेषण और आपके प्रश्नों के उत्तर देने में मदद कर सकता हूं";
};

// Simulated AI response (placeholder)
export const getSimulatedResponse = (query: string): Promise<string> => {
  const { language } = getStoredPreferences();
  
  // Simple responses for demo purposes
  const responses = {
    en: [
      `I've processed your query: "${query}". Here's what I found...`,
      `Thanks for asking about "${query}". Let me help you with that...`,
      `I'm analyzing your question about "${query}". Here's my response...`
    ],
    hi: [
      `मैंने आपकी क्वेरी का विश्लेषण किया है: "${query}". यहां मुझे क्या मिला...`,
      `"${query}" के बारे में पूछने के लिए धन्यवाद। मुझे आपकी मदद करें...`,
      `मैं "${query}" के बारे में आपके प्रश्न का विश्लेषण कर रहा हूं। यहां मेरी प्रतिक्रिया है...`
    ]
  };
  
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * responses[language].length);
      resolve(responses[language][randomIndex]);
    }, 1000);
  });
};

// Formatting file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Get assistant name based on gender
export const getAssistantName = (): string => {
  const { gender } = getStoredPreferences();
  
  switch (gender) {
    case 'male': return 'Aiden';
    case 'female': return 'Sophia';
    default: return 'Mitra';
  }
};
