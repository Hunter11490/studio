'use client';

import { Ban } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

export function BannedUser() {
  const { t } = useLanguage();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <Ban className="h-24 w-24 text-destructive" />
      <h1 className="text-3xl font-bold text-destructive">{t('admin.bannedTitle')}</h1>
      <p className="max-w-md text-muted-foreground">{t('admin.bannedDesc')}</p>
      <Button onClick={logout} variant="outline" className="mt-4">
        {t('auth.logout')}
      </Button>
    </div>
  );
}
