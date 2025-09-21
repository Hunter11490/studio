'use client';

import { useEffect } from 'react';
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

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { t } = useLanguage();
  const { users } = useAuth();
  
  const projectOwner = users.find(u => u.username === 'HUNTER') as StoredUser | undefined;

  useEffect(() => {
    if (open) {
      // Push a new state to the history when the dialog opens
      window.history.pushState({ dialog: 'about' }, '');

      const handlePopState = (event: PopStateEvent) => {
        // If the state we pushed is popped (e.g., by back button), close the dialog
        if (event.state?.dialog === 'about') {
          onOpenChange(false);
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (isOpen: boolean) => {
    // If we're closing and the current history state is our dialog state, go back
    if (!isOpen && window.history.state?.dialog === 'about') {
      window.history.back();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
            <Logo className="h-16 w-16 text-primary mb-2" />
          <DialogTitle className="font-headline text-2xl">{t('dialogs.aboutTitle')}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {t('dialogs.aboutDesc')}
          </DialogDescription>
        </DialogHeader>
        {projectOwner && (
          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p className="font-semibold">{t('dialogs.contactOwner')}</p>
            <p dir="ltr">{projectOwner.email}</p>
            <p dir="ltr">{projectOwner.phoneNumber}</p>
            <p dir="ltr" className="mt-2 text-xs italic uppercase">For your beautiful eyes Bebo 143</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
