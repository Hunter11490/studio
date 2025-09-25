'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { AdminPanel } from '@/components/admin/admin-panel';
import { Logo } from '@/components/logo';
import { UserMenu } from '@/components/layout/user-menu';
import { PatientStatsDashboard } from '@/components/admin/patient-stats-dashboard';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || user?.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* You can add a proper loader here */}
        <p>Loading or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col items-center">
             <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.admin')}</h1>
        </div>
        <div className="flex items-center gap-4">
            <UserMenu />
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main content: User management */}
        <div className="lg:col-span-3 h-full">
          <AdminPanel />
        </div>
        
        {/* Sidebar: Stats */}
        <div className="lg:col-span-2 h-full">
          <PatientStatsDashboard />
        </div>
      </main>
    </div>
  );
}
