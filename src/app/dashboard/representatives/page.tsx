'use client';

import { useMemo, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { DoctorGrid } from '@/components/doctor/doctor-grid';
import { DoctorList } from '@/components/doctor/doctor-list';
import { useLanguage } from '@/hooks/use-language';
import { Frown, UserSearch, FileDown } from 'lucide-react';
import { Doctor } from '@/types';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/excel';
import { translateText, DoctorInfo } from '@/ai/flows/translation-flow';
import { PartnerExportData } from '@/types';
import { Header } from '@/components/layout/header';


export default function RepresentativesPage() {
  const { doctors, searchTerm, filterPartners, viewMode, sortOption } = useDoctors();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  
  const partnerDoctors = useMemo(() => {
    return doctors.filter(d => d.isPartner)
  }, [doctors]);

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

  const getTranslatedDoctorData = async (doctorsToTranslate: Doctor[]): Promise<PartnerExportData[]> => {
    const doctorsInfo: DoctorInfo[] = doctorsToTranslate.map(d => ({
        name: d.name,
        specialty: d.specialty,
        clinicAddress: d.clinicAddress
    }));

    let translatedDocs: DoctorInfo[] = [];
    try {
        const response = await translateText({ doctors: doctorsInfo, targetLanguage: 'Arabic' });
        translatedDocs = response.doctors;
    } catch (error) {
        console.error("Batch translation failed, falling back to original data.", error);
        translatedDocs = doctorsInfo; // Fallback to original
    }

    const headers: { [key: string]: string } = {
        name: t('partnerDashboard.exportName'),
        address: t('partnerDashboard.exportAddress'),
        phone: t('partnerDashboard.exportPhone'),
        referrals: t('partnerDashboard.exportReferrals'),
        commission: t('partnerDashboard.exportCommission'),
    };

    return doctorsToTranslate.map((originalDoctor, index) => {
        const translatedInfo = translatedDocs[index] || originalDoctor;
        const referralCount = originalDoctor.referralCount;
        return {
            [headers.name]: translatedInfo.name,
            [headers.address]: translatedInfo.clinicAddress,
            [headers.phone]: originalDoctor.phoneNumber,
            [headers.referrals]: referralCount,
            [headers.commission]: referralCount * 100,
        };
    });
  };

  const handleExportPartners = async () => {
    if (partnerDoctors.length === 0) {
      toast({ title: t('partnerDashboard.noPartners') });
      return;
    }
    try {
      toast({title: t('toasts.exporting'), description: t('toasts.exportingDesc')});
      const translatedData = await getTranslatedDoctorData(partnerDoctors);
      const fileName = `${t('partnerDashboard.exportFileName')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportToExcel(translatedData, fileName);
      toast({ title: t('toasts.exportSuccess') });
    } catch (error) {
      console.error(error);
      toast({ title: t('toasts.exportError'), variant: 'destructive' });
    }
  };
  
  const renderContent = () => {
    if (doctors.length === 0) {
       return (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8">
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
        )
    }

    if (filteredAndSortedDoctors.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center mt-8">
             <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Frown className="h-12 w-12" />
                <p className="text-lg">{t('common.noResults')}</p>
             </div>
        </div>
      )
    }

    return (
        <>
            {viewMode === 'grid' 
                ? <DoctorGrid doctors={filteredAndSortedDoctors} />
                : <DoctorList doctors={filteredAndSortedDoctors} />}

            {viewMode === 'list' && partnerDoctors.length > 0 && (
                <Button
                onClick={handleExportPartners}
                className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
                size="icon"
                >
                <FileDown className="h-6 w-6" />
                <span className="sr-only">{t('partnerDashboard.exportExcel')}</span>
                </Button>
            )}
        </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {renderContent()}
      </main>
      <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
    </>
  );
}
