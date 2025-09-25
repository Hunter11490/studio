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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
       <main className="flex-grow p-4 md:p-8 relative">
        {showBackButton && (
          <Button asChild variant="outline" size="icon" className="absolute top-4 left-4 z-10">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {children}
      </main>
    </div>
  );
}
