'use client';

import { useContext, useCallback } from 'react';
import { LanguageProviderContext, LanguageProviderState } from '@/components/providers/language-provider';

export const useLanguage = (): LanguageProviderState => {
  const context = useContext(LanguageProviderContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const { t: originalT } = context;

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
  
  return { ...context, t };
};
