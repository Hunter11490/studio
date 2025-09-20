'use client';

import { createContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { translations } from '@/lib/localization';
import type { Translation } from '@/types';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

export type LanguageProviderState = {
  lang: Language;
  setLang: (lang: Language) => void;
  dir: Direction;
  t: (key: string) => string;
};

export const LanguageProviderContext = createContext<LanguageProviderState | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useLocalStorage<Language>('language', 'en');
  const [dir, setDir] = useState<Direction>('ltr');

  useEffect(() => {
    const newDir = lang === 'ar' ? 'rtl' : 'ltr';
    setDir(newDir);
    document.documentElement.lang = lang;
    document.documentElement.dir = newDir;
  }, [lang]);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let result: string | Translation = translations[lang];
      for (const k of keys) {
        if (typeof result === 'object' && result !== null && k in result) {
          result = result[k] as string | Translation;
        } else {
          return key; // Return the key itself if not found
        }
      }
      return typeof result === 'string' ? result : key;
    },
    [lang]
  );

  const value = {
    lang,
    setLang,
    dir,
    t,
  };

  return <LanguageProviderContext.Provider value={value}>{children}</LanguageProviderContext.Provider>;
}
