'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize, Minimize } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Logo } from '@/components/logo';
import { StethoscopeLogo } from '@/components/stethoscope-logo';


export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const bgImage = PlaceHolderImages.find(img => img.id === 'auth-split-screen');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t } = useLanguage();

  const handleFullscreenToggle = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <main className="relative grid min-h-screen w-full grid-cols-1 bg-background lg:grid-cols-2">
       <div className="absolute top-4 right-4 z-20">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFullscreenToggle}
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  <span className="sr-only">{isFullscreen ? t('header.exitFullscreen') : t('header.enterFullscreen')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? t('header.exitFullscreen') : t('header.enterFullscreen')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

      {/* Right side with the form */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

       {/* Left side with the background image and branding */}
       <div className="relative hidden items-end bg-muted p-10 text-white lg:flex">
        {bgImage && (
            <Image
            src={bgImage.imageUrl}
            alt={bgImage.description}
            data-ai-hint={bgImage.imageHint}
            fill
            className="object-cover"
            priority
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <StethoscopeLogo className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1/2 w-1/2 text-white/5 opacity-50" />
        <div className="relative z-20 mt-auto">
          <div className="flex items-center gap-4">
             <Logo className="h-16 w-16 text-white" />
             <div>
                <h1 className="text-4xl font-bold font-headline">
                    {t('appName')}
                </h1>
                <p className="mt-2 text-lg">
                    {t('appSubtitle')}
                </p>
             </div>
          </div>
        </div>
      </div>

    </main>
  );
}
