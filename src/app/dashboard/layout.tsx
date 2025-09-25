'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthLoader } from '@/components/auth-loader';
import { BannedUser } from '@/components/banned-user';
import { PendingApproval } from '@/components/pending-approval';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t, dir } = useLanguage();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);
  
  if (!user) {
    return <AuthLoader />;
  }
  
  if (user.status === 'banned') {
    return <BannedUser />;
  }

  if (user.status === 'pending') {
    return <PendingApproval />;
  }

  const showBackButton = pathname !== '/dashboard';

  return (
    <div className="flex min-h-screen w-full flex-col">
       <main className="flex-grow relative">
        {showBackButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button asChild variant="secondary" size="icon" className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-full shadow-lg animate-pulse-glow">
                    <Link href="/dashboard">
                      <ArrowLeft className="h-6 w-6" />
                    </Link>
                  </Button>
              </TooltipTrigger>
              <TooltipContent side={dir === 'rtl' ? 'left' : 'right'}>
                <p>{t('common.backToMenu')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {children}
      </main>
    </div>
  );
}
