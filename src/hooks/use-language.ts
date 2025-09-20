'use client';

import { useContext } from 'react';
import { LanguageProviderContext, LanguageProviderState } from '@/components/providers/language-provider';

export const useLanguage = (): LanguageProviderState => {
  const context = useContext(LanguageProviderContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
