'use client';

import { useEffect, useRef } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOfflineStatus();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // On initial load, we don't want to show any toast.
    // We only show toasts on status *change*.
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (!isOnline) {
      toast({
        title: t('toasts.offline'),
        variant: 'destructive',
        duration: 5000,
      });
    } else {
      toast({ title: t('toasts.online'), duration: 3000 });
    }
  }, [isOnline, toast, t]);

  return <>{children}</>;
}
