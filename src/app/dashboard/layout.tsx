'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { AuthLoader } from '@/components/auth-loader';
import { BannedUser } from '@/components/banned-user';
import { PendingApproval } from '@/components/pending-approval';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

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

  // The 'pending' status is no longer used for new signups, 
  // but this check is kept for any old users that might still have this status.
  if (user.status === 'pending') {
    return <PendingApproval />;
  }


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
