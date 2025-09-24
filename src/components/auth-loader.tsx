'use client';

import { MedicalLoader } from '@/components/medical-loader';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function AuthLoader() {
  const { t, tQuote } = useLanguage();
  const [quote, setQuote] = useState({ quote: '', author: '' });
  const [isFading, setIsFading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This runs only on the client, after the initial render
    setQuote(tQuote());
    setIsClient(true);
  }, [tQuote]);

  useEffect(() => {
    if (!isClient) return;

    const intervalId = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setQuote(tQuote());
        setIsFading(false);
      }, 500); // This should match the transition duration
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [isClient, tQuote]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="h-24 w-24 text-primary" />
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-semibold tracking-tight text-primary animate-glow">{isClient ? t('appName') : 'Spirit'}</h1>
          <p className="text-sm text-muted-foreground">{isClient ? t('appSubtitle') : 'For Managing Centers and Hospitals'}</p>
        </div>
      </div>
      <MedicalLoader />
      <div className={cn(
          "mt-8 text-center max-w-md min-h-[6rem] transition-opacity duration-500 ease-in-out",
          isFading ? "opacity-0" : "opacity-100"
        )}>
        {isClient ? (
          <>
            <blockquote className="text-lg italic text-foreground">
              &ldquo;{quote.quote}&rdquo;
            </blockquote>
            <cite className="mt-2 block text-sm text-muted-foreground">&ndash; {quote.author}</cite>
          </>
        ) : (
            // Placeholder to prevent layout shift
            <div className="space-y-2">
                <div className="h-6 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
            </div>
        )}
      </div>
    </div>
  );
}
