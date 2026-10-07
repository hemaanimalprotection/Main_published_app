import React, { createContext, useContext, useState, useEffect } from 'react';
import { ar } from '../locales/ar';
import { fr } from '../locales/fr';

export type Language = 'ar' | 'fr';
type Translations = typeof ar;

interface LanguageContextType {
  language: Language;
  t: Translations;
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mawa_language');
    if (saved === 'ar' || saved === 'fr') return saved;
    // Default to Arabic for Syrian context
    return 'ar';
  });

  const isRtl = language === 'ar';
  const t = language === 'ar' ? ar : fr;

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('mawa_language', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'fr' : 'ar');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, isRtl, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
