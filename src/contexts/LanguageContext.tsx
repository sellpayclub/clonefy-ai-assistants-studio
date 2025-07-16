import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'es' | 'en' | 'de';
type LanguageCode = Language;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Helper function to detect user's preferred language
const detectUserLanguage = (): Language => {
  // Check for saved language first
  const saved = localStorage.getItem('clonefy-language') as Language;
  if (saved && ['pt', 'es', 'en', 'de'].includes(saved)) {
    return saved;
  }
  
  // Detect browser language
  const browserLang = navigator.language.toLowerCase();
  
  // Map browser languages to supported languages
  if (browserLang.startsWith('pt')) return 'pt';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('de')) return 'de';
  
  // Check additional languages from navigator.languages
  const browserLanguages = navigator.languages || [navigator.language];
  for (const lang of browserLanguages) {
    const langCode = lang.toLowerCase();
    if (langCode.startsWith('pt')) return 'pt';
    if (langCode.startsWith('es')) return 'es';
    if (langCode.startsWith('en')) return 'en';
    if (langCode.startsWith('de')) return 'de';
  }
  
  // Default fallback
  return 'pt';
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return detectUserLanguage();
  });

  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const module = await import(`../translations/${language}.ts`);
        setTranslations(module.default);
      } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to Portuguese if translation fails
        if (language !== 'pt') {
          const fallback = await import('../translations/pt.ts');
          setTranslations(fallback.default);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  useEffect(() => {
    localStorage.setItem('clonefy-language', language);
  }, [language]);

  const t = (key: string): string => {
    if (isLoading) return key; // Return key while loading
    
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Don't render children until translations are loaded
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};