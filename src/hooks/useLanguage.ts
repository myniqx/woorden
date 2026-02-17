import { useState, useEffect } from 'preact/hooks';
import type { Language } from '../types';

const LANGUAGE_KEY = 'woorden_language';
const DEFAULT_LANGUAGE: Language = 'tr';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === 'tr' || stored === 'en' || stored === 'ar' || stored === 'fr') {
    return stored;
  }

  return DEFAULT_LANGUAGE;
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  return { language, setLanguage };
}
