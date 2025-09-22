'use client';

import { MedicalLoader } from '@/components/medical-loader';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { useEffect, useState } from 'react';

export function AuthLoader() {
  const { t, tQuote } = useLanguage();
  const [quote, setQuote] = useState({ quote: '', author: '' });

  useEffect(() => {
    setQuote(tQuote());
  }, [tQuote]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="h-24 w-24 text-primary" />
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-semibold tracking-tight text-primary animate-glow">{t('appName')}</h1>
          <p className="text-sm text-muted-foreground">{t('appSubtitle')}</p>
        </div>
      </div>
      <MedicalLoader />
      <div className="mt-8 text-center max-w-md">
        <blockquote className="text-lg italic text-foreground">
          &ldquo;{quote.quote}&rdquo;
        </blockquote>
        <cite className="mt-2 block text-sm text-muted-foreground">&ndash; {quote.author}</cite>
      </div>
    </div>
  );
}
