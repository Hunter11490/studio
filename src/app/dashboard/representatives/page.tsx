'use client';

import { useMemo, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Frown, UserSearch, FileDown, Users, Activity, UserCheck } from 'lucide-react';
import { Doctor } from '@/types';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/excel';
import { translateText, DoctorInfo } from '@/ai/flows/translation-flow';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DoctorGrid } from '@/components/doctor/doctor-grid';
import { DoctorList } from '@/components/doctor/doctor-list';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type PartnerExportData = {
  [key: string]: string | number;
};

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function RepresentativesPage() {
  const { doctors, searchTerm, filterPartners, viewMode, sortOption, updateMultipleDoctors } = useDoctors();
  const { t, dir } = useLanguage();
  const { toast } = useToast();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  
  const departmentStats = useMemo(() => {
    const totalReferrals = doctors.reduce((acc, doc) => acc + doc.referralCount, 0);
    const mostActiveDoctor = doctors.length > 0 
      ? doctors.reduce((prev, current) => (prev.referralCount > current.referralCount) ? prev : current)
      : null;
      
    return {
      doctorCount: doctors.length,
      totalReferrals,
      mostActiveDoctor: mostActiveDoctor?.name || t('common.notAvailable')
    }
  }, [doctors, t]);

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
    const partners = doctors.filter(d => d.isPartner);
    if (partners.length === 0) {
      toast({ title: t('partnerDashboard.noPartners') });
      return;
    }
    try {
      toast({title: t('toasts.exporting'), description: t('toasts.exportingDesc')});
      const translatedData = await getTranslatedDoctorData(partners);
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
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8 col-span-full py-20">
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
        <div className="flex flex-1 items-center justify-center mt-8 col-span-full py-20">
             <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Frown className="h-12 w-12" />
                <p className="text-lg">{t('common.noResults')}</p>
             </div>
        </div>
      )
    }

    return viewMode === 'grid' 
                ? <DoctorGrid doctors={filteredAndSortedDoctors} />
                : <DoctorList doctors={filteredAndSortedDoctors} />
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title={t('oncology.totalDoctors')} value={departmentStats.doctorCount} icon={Users} />
            <StatCard title={t('oncology.totalReferrals')} value={departmentStats.totalReferrals} icon={Activity} />
            <StatCard title={t('oncology.mostActive')} value={departmentStats.mostActiveDoctor} icon={UserCheck} />
        </div>
        
        {renderContent()}
      </main>
      <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleExportPartners}
              className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
              size="icon"
              >
              <FileDown className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={dir === 'rtl' ? 'right' : 'left'}>
             <p>{t('partnerDashboard.exportExcel')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

    </>
  );
}
