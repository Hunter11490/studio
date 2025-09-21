'use client';

import { useState } from 'react';
import { PlusCircle, Users, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { UserMenu } from './user-menu';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { PartnerDashboard } from '../doctor/partner-dashboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useLanguage();
  const { doctors, searchTerm, setSearchTerm, filterPartners, setFilterPartners, viewMode, setViewMode } = useDoctors();
  const { user } = useAuth();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  const [isPartnerDashboardOpen, setPartnerDashboardOpen] = useState(false);

  const partnerCount = doctors.filter(d => d.isPartner).length;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-auto flex-col gap-2 border-b bg-background px-4 py-2 md:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and left-aligned items */}
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <Button size="sm" className="gap-1" onClick={() => setAddDoctorOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">{t('header.addDoctor')}</span>
            </Button>
          </div>

          {/* Centered App Name & Subtitle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap">{t('appName')}</h1>
            <p className="text-[9px] text-muted-foreground whitespace-nowrap -mt-1">{t('appSubtitle')}</p>
          </div>

          {/* User Menu and right-aligned items */}
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>

        {/* Search and stats for all screen sizes */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-full lg:w-[320px] relative">
            <Input
              type="search"
              placeholder={t('header.searchPlaceholder')}
              className="w-full rounded-lg bg-secondary pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{t('header.totalDoctors')}:</span>
              <span className="font-bold text-foreground">{doctors.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{t('header.totalPartners')}:</span>
              <span className="font-bold text-foreground">{partnerCount}</span>
               <Button variant="outline" size="xs" className="gap-1" onClick={() => setPartnerDashboardOpen(true)}>
                <Users className="h-3 w-3" />
              </Button>
            </div>
            <Button
              variant={filterPartners ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilterPartners(!filterPartners)}
              className="gap-1 h-7"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline">{t('header.filterPartners')}</span>
            </Button>
             <div className="flex items-center rounded-md border p-0.5 bg-secondary">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="xs" className="h-6 w-6 p-1" onClick={() => setViewMode('grid')}>
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('header.gridView')}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="xs" className="h-6 w-6 p-1" onClick={() => setViewMode('list')}>
                                <List className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('header.listView')}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
          </div>
        </div>
      </header>
      <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
      <PartnerDashboard open={isPartnerDashboardOpen} onOpenChange={setPartnerDashboardOpen} />
    </>
  );
}
