'use client';

import { Hourglass } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';

export function PendingApproval() {
  const { t } = useLanguage();
  const { logout, users } = useAuth();
  const adminUser = users.find(u => u.username === 'HUNTER');


  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <Hourglass className="h-24 w-24 text-primary animate-pulse" />
      <h1 className="text-3xl font-bold text-primary">{t(`admin.status.pending`)}</h1>
      <p className="max-w-md text-muted-foreground">{t('admin.pendingDesc')}</p>
      {adminUser && (
        <p className="font-semibold" dir="ltr">
            {t('admin.contactAdmin', { phoneNumber: adminUser.phoneNumber })}
        </p>
      )}
      <Button onClick={logout} variant="outline" className="mt-4">
        {t('auth.logout')}
      </Button>
    </div>
  );
}
