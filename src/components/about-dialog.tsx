'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/use-language';
import { Logo } from './logo';

type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { t } = useLanguage();
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
      </DialogContent>
    </Dialog>
  );
}
