'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize, Minimize, Wrench, Utensils, Trash2, Check, Clock } from 'lucide-react';
import { NotificationsButton } from '@/components/notifications-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

type ServiceRequest = {
  id: string;
  type: 'maintenance' | 'cleaning' | 'catering';
  description: string;
  department: string;
  status: 'new' | 'in-progress' | 'completed';
  createdAt: string;
};

const initialRequests: ServiceRequest[] = [
  { id: '1', type: 'maintenance', description: 'Leaking faucet in Room 302', department: 'icu', status: 'new', createdAt: new Date().toISOString() },
  { id: '2', type: 'cleaning', description: 'Emergency cleanup in Operating Room 1', department: 'surgicalOperations', status: 'in-progress', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '3', type: 'catering', description: 'Special dietary meal for patient in Ward B, Bed 5', department: 'internalMedicine', status: 'new', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: '4', type: 'maintenance', description: 'AC unit not working in main lobby', department: 'reception', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
];

const requestConfig = {
  maintenance: { icon: Wrench, color: 'text-orange-500' },
  cleaning: { icon: Trash2, color: 'text-blue-500' },
  catering: { icon: Utensils, color: 'text-green-500' },
};

function RequestCard({ request, onUpdateStatus }: { request: ServiceRequest; onUpdateStatus: (id: string, status: ServiceRequest['status']) => void; }) {
  const { t, lang } = useLanguage();
  const { icon: Icon, color } = requestConfig[request.type];
  
  return (
    <Card className="mb-2">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", color)} />
            <span>{t(`departments.${request.department}`)}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm">{request.description}</p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: lang === 'ar' ? ar : undefined })}
        </p>
      </CardContent>
    </Card>
  );
}

export default function ServicesPage() {
    const { t } = useLanguage();
    const [requests, setRequests] = useLocalStorage<ServiceRequest[]>('hospital_services_requests', initialRequests);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleFullscreenToggle = async () => {
        if (typeof window !== 'undefined') {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else if (document.exitFullscreen) {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };
    
    const updateStatus = (id: string, status: ServiceRequest['status']) => {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    const newRequests = useMemo(() => requests.filter(r => r.status === 'new'), [requests]);
    const inProgressRequests = useMemo(() => requests.filter(r => r.status === 'in-progress'), [requests]);
    const completedRequests = useMemo(() => requests.filter(r => r.status === 'completed'), [requests]);
    
    return (
        <div className="flex flex-col h-screen bg-secondary/40">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
              <div className="flex items-center gap-2">
                  <Logo className="h-8 w-8 text-primary" />
              </div>
              <div className="flex flex-col items-center">
                  <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.services')}</h1>
              </div>
              <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleFullscreenToggle}>
                          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{isFullscreen ? t('header.exitFullscreen') : t('header.enterFullscreen')}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <NotificationsButton />
                  <UserMenu />
              </div>
          </header>
          
          <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-auto">
              <div className="bg-card rounded-lg flex flex-col p-2">
                  <h2 className="font-bold p-2">{t('services.newRequest')} ({newRequests.length})</h2>
                  <div className="flex-grow overflow-y-auto">
                      {newRequests.map(r => <RequestCard key={r.id} request={r} onUpdateStatus={updateStatus} />)}
                  </div>
              </div>
              <div className="bg-card rounded-lg flex flex-col p-2">
                  <h2 className="font-bold p-2">{t('services.inProgress')} ({inProgressRequests.length})</h2>
                  <div className="flex-grow overflow-y-auto">
                      {inProgressRequests.map(r => <RequestCard key={r.id} request={r} onUpdateStatus={updateStatus} />)}
                  </div>
              </div>
              <div className="bg-card rounded-lg flex flex-col p-2">
                  <h2 className="font-bold p-2">{t('services.completed')} ({completedRequests.length})</h2>
                  <div className="flex-grow overflow-y-auto">
                      {completedRequests.map(r => <RequestCard key={r.id} request={r} onUpdateStatus={updateStatus} />)}
                  </div>
              </div>
          </main>
        </div>
    )
}