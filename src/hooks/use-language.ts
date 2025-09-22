'use client';

import { useContext, useCallback, useState, useEffect } from 'react';
import { LanguageProviderContext, LanguageProviderState } from '@/components/providers/language-provider';
import { quotes } from '@/lib/quotes';
import { translations } from '@/lib/localization';

type QuoteResult = {
  quote: string;
  author: string;
};

export type ExtendedLanguageProviderState = LanguageProviderState & {
  tQuote: () => QuoteResult;
};


export const useLanguage = (): ExtendedLanguageProviderState => {
  const context = useContext(LanguageProviderContext);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const { t: originalT, lang } = context;

  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>): string => {
      // Prevent client-side translations on the server.
      if (!isClient) {
        // Fallback to a non-translated key or a default value if needed during SSR
        // This attempts to get the english version as a fallback on server.
        const keys = key.split('.');
        let result: any = (translations['en'] as any);
        for(const k of keys) {
            if (typeof result === 'object' && result !== null && k in result) {
                result = result[k];
            } else {
                return key;
            }
        }
        return typeof result === 'string' ? result : key;
      }
      
      let translation = originalT(key, replacements);
      return translation;
    },
    [originalT, isClient]
  );
  
  const tQuote = useCallback((): QuoteResult => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    // Only determine language on client
    const currentLang = isClient ? lang : 'en';

    if (currentLang === 'ar' && randomQuote.ar_quote) {
      return { quote: randomQuote.ar_quote, author: randomQuote.ar_author };
    }
    return { quote: randomQuote.quote, author: randomQuote.author };
  }, [lang, isClient]);

  return { ...context, t, tQuote };
};
