'use client';

import { useState } from 'react';
import { PlusCircle, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { UserMenu } from './user-menu';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';

export function Header() {
  const { t } = useLanguage();
  const { doctors, searchTerm, setSearchTerm, filterPartners, setFilterPartners } = useDoctors();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);

  const partnerCount = doctors.filter(d => d.isPartner).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-lg font-bold tracking-tight">{t('appName')}</h1>
      </div>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="relative ml-auto flex-1 md:grow-0">
          <Input
            type="search"
            placeholder={t('header.searchPlaceholder')}
            className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button
          variant={filterPartners ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setFilterPartners(!filterPartners)}
          className="gap-1"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden md:inline">{t('header.filterPartners')}</span>
        </Button>
        
        <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen}>
          <Button size="sm" className="gap-1" onClick={() => setAddDoctorOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden md:inline">{t('header.addDoctor')}</span>
          </Button>
        </DoctorFormDialog>

        <div className="flex items-center gap-4 text-sm font-medium">
          <span>{t('header.totalDoctors')}: {doctors.length}</span>
          <span>{t('header.totalPartners')}: {partnerCount}</span>
        </div>
        
        <UserMenu />
      </div>
    </header>
  );
}
