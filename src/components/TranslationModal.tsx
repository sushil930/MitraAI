import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/utils/apiService';
import { Languages, Globe, ArrowRight, Copy, Check, Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';

interface TranslationModalProps {
  open: boolean;
  onClose: () => void;
}

const TranslationModal: React.FC<TranslationModalProps> = ({ open, onClose }) => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  // Reset copied state when translated text changes
  useEffect(() => {
    setCopied(false);
  }, [translatedText]);

  // Language options
  const languages = [
    { code: 'auto', name: 'Detect Language' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ur', name: 'Urdu' },
    { code: 'tr', name: 'Turkish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'pl', name: 'Polish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
  ];

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Only pass sourceLanguage if it's not 'auto'
      const sourceLang = sourceLanguage === 'auto' ? undefined : sourceLanguage;
      
      const result = await apiService.translateText(
        sourceText,
        targetLanguage,
        sourceLang
      );
      
      setTranslatedText(result.translatedText);
      
      // If language was auto-detected, show what was detected
      if (sourceLanguage === 'auto' && result.detectedSourceLanguage) {
        setDetectedLanguage(result.detectedSourceLanguage);
      } else {
        setDetectedLanguage(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to translate text');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleSwapLanguages = () => {
    // Only swap if not using auto-detect
    if (sourceLanguage !== 'auto') {
      const temp = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(temp);
      
      // Also swap the text if there's translated text
      if (translatedText) {
        setSourceText(translatedText);
        setTranslatedText(sourceText);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-6 w-6" />
            Translation Tool
          </DialogTitle>
          <DialogDescription>
            Translate text between multiple languages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language Selection */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Source Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={`source-${lang.code}`} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSwapLanguages}
              disabled={sourceLanguage === 'auto' || loading}
              className="rounded-full"
              title="Swap languages"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <div className="flex-1">
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages
                    .filter(lang => lang.code !== 'auto') // Remove 'auto' from target options
                    .map((lang) => (
                      <SelectItem key={`target-${lang.code}`} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Source Text Input */}
          <div className="relative">
            <Textarea
              placeholder="Enter text to translate"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[120px] pr-12"
              disabled={loading}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {sourceText.length} chars
            </div>
          </div>

          {/* Translate Button */}
          <Button 
            onClick={handleTranslate} 
            disabled={loading || !sourceText.trim()} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Translate
              </>
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Detected Language */}
          {detectedLanguage && (
            <div className="text-sm text-muted-foreground">
              Detected language: {languages.find(l => l.code === detectedLanguage)?.name || detectedLanguage}
            </div>
          )}

          {/* Translation Result */}
          {translatedText && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Translation</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg min-h-[120px] whitespace-pre-wrap">
                {translatedText}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranslationModal;