'use client';

import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from './logo';
import { StoredUser } from '@/types';
import { StethoscopeLogo } from './stethoscope-logo';

type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { t } = useLanguage();
  const { users } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const projectOwner = users.find(u => u.username === 'HUNTER') as StoredUser | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio('/bebno-music.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
    }
  
    if (open) {
      window.history.pushState({ dialog: 'about' }, '');

      audioRef.current?.play().catch(error => console.log("Audio play failed:", error));
      
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.dialog === 'about') {
          onOpenChange(false);
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } else {
        audioRef.current?.pause();
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && window.history.state?.dialog === 'about') {
      window.history.back();
    }
    if (!isOpen) {
        audioRef.current?.pause();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background opacity-90" />
        <StethoscopeLogo className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2/3 w-2/3 text-primary/10 animate-pulse" />
        
        <div className="relative z-10 p-6">
          <DialogHeader className="items-center text-center">
              <Logo className="h-16 w-16 text-primary mb-2" />
            <DialogTitle className="font-headline text-2xl">{t('dialogs.aboutTitle')}</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {t('dialogs.aboutDesc')}
            </DialogDescription>
          </DialogHeader>
          {projectOwner && (
            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{t('dialogs.contactOwner')}</p>
              <p dir="ltr">{projectOwner.email}</p>
              <p dir="ltr">{projectOwner.phoneNumber}</p>
              <p dir="ltr" className="mt-4 text-xs italic uppercase animate-pulse">For your beautiful eyes Bebo 143</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
