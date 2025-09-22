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

type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ShootingStars = () => (
  <div className="shooting-stars-bg">
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
    <div className="shooting-star"></div>
  </div>
);

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
      <DialogContent className="sm:max-w-md bg-transparent border-none shadow-2xl shadow-primary/50 text-white overflow-hidden">
        <ShootingStars />
        <div className="relative z-10 backdrop-blur-sm p-6 rounded-lg">
          <DialogHeader className="items-center text-center">
              <Logo className="h-16 w-16 text-primary mb-2 animate-glow" />
            <DialogTitle className="font-headline text-2xl text-white">{t('dialogs.aboutTitle')}</DialogTitle>
            <DialogDescription className="text-center pt-2 text-white/80">
              {t('dialogs.aboutDesc')}
            </DialogDescription>
          </DialogHeader>
          {projectOwner && (
            <div className="pt-4 text-center text-sm text-white/70">
              <p className="font-semibold">{t('dialogs.contactOwner')}</p>
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
