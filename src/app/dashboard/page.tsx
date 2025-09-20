'use client';

import { useMemo } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { DoctorGrid } from '@/components/doctor/doctor-grid';
import { useLanguage } from '@/hooks/use-language';
import { Frown } from 'lucide-react';

export default function DashboardPage() {
  const { doctors, searchTerm, filterPartners } = useDoctors();
  const { t } = useLanguage();

  const filteredDoctors = useMemo(() => {
    return doctors
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
  }, [doctors, searchTerm, filterPartners]);

  if (doctors.length === 0) {
     return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">{t('common.noResults')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('header.addDoctor')} to get started.
            </p>
          </div>
        </div>
      )
  }

  if (filteredDoctors.length === 0) {
    return (
        <div className="flex flex-1 items-center justify-center">
             <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Frown className="h-12 w-12" />
                <p className="text-lg">{t('common.noResults')}</p>
             </div>
        </div>
    )
  }

  return <DoctorGrid doctors={filteredDoctors} />;
}
