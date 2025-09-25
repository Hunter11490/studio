'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function SessionTimer({ expiryTimestamp }: { expiryTimestamp: number }) {
  const { logout, checkAhmedSession } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();

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
        // The checkAhmedSession in AuthProvider will handle the logout.
        // We can show a toast here to inform the user.
        toast({
          title: t('admin.sessionExpiredTitle'),
          description: t('admin.sessionExpiredDesc'),
          variant: 'destructive',
        });
        // The redirect will happen automatically when the user state becomes null.
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryTimestamp]);

  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
  const seconds = Math.floor((remainingTime / 1000) % 60);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm animate-pulse-glow">
      <Timer className="h-4 w-4 text-primary" />
      <div className="text-foreground" dir="ltr">
        <span className="font-mono font-bold tracking-wider">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
