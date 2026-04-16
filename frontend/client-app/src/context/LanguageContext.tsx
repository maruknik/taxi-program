import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { languageService, SupportedLanguage, i18n } from '@/src/i18n';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'uk',
  setLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('uk');

  useEffect(() => {
    languageService.initializeLanguage().then((lang) => {
      setCurrentLanguage(lang);
    });
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    await languageService.setLanguage(lang);
    setCurrentLanguage(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  return useContext(LanguageContext);
}

export function useTranslation() {
  const { currentLanguage } = useContext(LanguageContext);
  return { t: (key: string, options?: any) => i18n.t(key, options), currentLanguage };
}
