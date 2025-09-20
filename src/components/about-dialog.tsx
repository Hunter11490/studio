'use client';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <p dir="ltr" className="mt-2 text-xs italic">For your beautiful eyes Bebo 143</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
