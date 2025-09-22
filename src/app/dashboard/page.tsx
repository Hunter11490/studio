'use client';

import { useMemo, useEffect, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { DoctorGrid } from '@/components/doctor/doctor-grid';
import { DoctorList } from '@/components/doctor/doctor-list';
import { useLanguage } from '@/hooks/use-language';
import { Frown, UserSearch } from 'lucide-react';
import { Doctor } from '@/types';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';


export default function DashboardPage() {
  const { doctors, searchTerm, filterPartners, viewMode, sortOption } = useDoctors();
  const { t } = useLanguage();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);


  const filteredAndSortedDoctors = useMemo(() => {
    
    const sorted = [...doctors].sort((a: Doctor, b: Doctor) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'address':
          return a.clinicAddress.localeCompare(b.clinicAddress);
        default:
          return 0;
      }
    });

    return sorted
      .filter(doctor => {
        if (!filterPartners) return true;
        return doctor.isPartner;
      })
      .filter(doctor => {
        if (!searchTerm) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          doctor.name.toLowerCase().includes(lowercasedTerm) ||
          doctor.specialty.toLowerCase().includes(lowercasedTerm) ||
          doctor.clinicAddress.toLowerCase().includes(lowercasedTerm)
        );
      });
  }, [doctors, searchTerm, filterPartners, sortOption]);

  if (doctors.length === 0) {
     return (
        <>
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <UserSearch className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">{t('common.noResults')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('header.addDoctor')} لبدء استخدام التطبيق.
            </p>
             <Button onClick={() => setAddDoctorOpen(true)} className="mt-4">
              {t('header.addDoctor')}
            </Button>
          </div>
        </div>
        <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
        </>
      )
  }

  if (filteredAndSortedDoctors.length === 0) {
    return (
        <div className="flex flex-1 items-center justify-center">
             <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Frown className="h-12 w-12" />
                <p className="text-lg">{t('common.noResults')}</p>
             </div>
        </div>
    )
  }

  return viewMode === 'grid' 
    ? <DoctorGrid doctors={filteredAndSortedDoctors} />
    : <DoctorList doctors={filteredAndSortedDoctors} />;
}
