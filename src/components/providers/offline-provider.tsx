'use client';

import { useEffect } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOfflineStatus();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOnline) {
      toast({
        title: t('toasts.offline'),
        variant: 'destructive',
        duration: 5000,
      });
    } else {
      // This might be too noisy if it shows on first load
      // toast({ title: t('toasts.online'), duration: 3000 });
    }
  }, [isOnline, toast, t]);

  return <>{children}</>;
}
