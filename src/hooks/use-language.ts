'use client';

import { useContext, useCallback } from 'react';
import { LanguageProviderContext, LanguageProviderState } from '@/components/providers/language-provider';
import { quotes } from '@/lib/quotes';

type QuoteResult = {
  quote: string;
  author: string;
};

export type ExtendedLanguageProviderState = LanguageProviderState & {
  tQuote: () => QuoteResult;
};


export const useLanguage = (): ExtendedLanguageProviderState => {
  const context = useContext(LanguageProviderContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const { t: originalT, lang } = context;

  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>): string => {
      let translation = originalT(key);
      if (replacements) {
        Object.keys(replacements).forEach(rKey => {
          translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
        });
      }
      return translation;
    },
    [originalT]
  );
  
  const tQuote = useCallback((): QuoteResult => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    if (lang === 'ar') {
      return { quote: randomQuote.ar_quote, author: randomQuote.ar_author };
    }
    return { quote: randomQuote.quote, author: randomQuote.author };
  }, [lang]);

  return { ...context, t, tQuote };
};
