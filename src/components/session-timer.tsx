'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SessionTimer({ expiryTimestamp }: { expiryTimestamp: number }) {
  const { logout, forceAhmedPasswordChange } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const calculateRemainingTime = () => {
    const now = Date.now();
    return Math.max(0, expiryTimestamp - now);
  };

  const [remainingTime, setRemainingTime] = useState(calculateRemainingTime);

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemainingTime = calculateRemainingTime();
      setRemainingTime(newRemainingTime);

      if (newRemainingTime <= 0) {
        clearInterval(interval);
        toast({
          title: t('admin.sessionExpiredTitle'),
          description: t('admin.sessionExpiredDesc'),
          variant: 'destructive',
        });
        forceAhmedPasswordChange();
        logout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp, logout, t, toast, forceAhmedPasswordChange]);

  const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
  const seconds = Math.floor((remainingTime / 1000) % 60);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm animate-pulse-glow">
      <Timer className="h-5 w-5 text-primary" />
      <div className="text-foreground" dir="ltr">
        <span>{t('admin.sessionEndsIn')} </span>
        <span className="font-mono font-bold tracking-wider">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
