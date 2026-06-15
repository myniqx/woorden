import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import type { Language } from '../types';
import { locales } from '@/locales';

const LANGUAGE_KEY = 'woorden_language';
const DEFAULT_LANGUAGE: Language = 'tr';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === 'tr' || stored === 'en' || stored === 'ar' || stored === 'fr') return stored;
  return DEFAULT_LANGUAGE;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof locales.en;
  merge: (template: string, replacements: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => { },
  t: locales[DEFAULT_LANGUAGE],
  merge: (template: string, _: Record<string, string | number>) => template,
});

export function useLanguageState() {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const setLanguage = (newLanguage: Language) => setLanguageState(newLanguage);
  const t = locales[language] || locales[DEFAULT_LANGUAGE];

  function merge(template: string, replacements: Record<string, string | number>): string {
    return Object.entries(replacements).reduce(
      (str, [key, val]) => str.replace(`{${key}}`, String(val)),
      template,
    );
  }

  return { language, setLanguage, t, merge };
}

export function useLanguage() {
  return useContext(LanguageContext);
}
