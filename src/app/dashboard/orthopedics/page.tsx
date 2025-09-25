'use client';

import { useMemo, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { DoctorGrid } from '@/components/doctor/doctor-grid';
import { DoctorList } from '@/components/doctor/doctor-list';
import { useLanguage } from '@/hooks/use-language';
import { Frown, UserSearch, Users, Activity, UserCheck } from 'lucide-react';
import { Doctor, Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

function RecentPatients({ patients }: { patients: Patient[] }) {
    const { t, lang } = useLanguage();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('oncology.recentCases')}</CardTitle>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                    {patients.map((patient) => (
                        <div key={patient.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{patient.patientName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{patient.patientName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(patient.createdAt), { addSuffix: true, locale: lang === 'ar' ? ar : undefined })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {patients.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">{t('oncology.noRecentCases')}</div>
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

export default function DepartmentPage() {
  const { doctors, searchTerm, filterPartners, viewMode, sortOption } = useDoctors();
  const { patients } = usePatients();
  const { t } = useLanguage();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  
  const departmentSpecialty = "Orthopedics";
  
  const departmentDoctors = useMemo(() => {
    return doctors.filter(d => d.specialty === departmentSpecialty);
  }, [doctors]);

  const departmentPatients = useMemo(() => {
    return patients
      .filter(p => p.department.toLowerCase() === departmentSpecialty.toLowerCase().replace(/ /g, ''))
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [patients]);
  
  const departmentStats = useMemo(() => {
    const totalReferrals = departmentDoctors.reduce((acc, doc) => acc + doc.referralCount, 0);
    const mostActiveDoctor = departmentDoctors.length > 0 
      ? departmentDoctors.reduce((prev, current) => (prev.referralCount > current.referralCount) ? prev : current)
      : null;
      
    return {
      doctorCount: departmentDoctors.length,
      totalReferrals,
      mostActiveDoctor: mostActiveDoctor?.name || t('common.notAvailable')
    }
  }, [departmentDoctors, t]);

  const filteredAndSortedDoctors = useMemo(() => {
    const sorted = [...departmentDoctors].sort((a: Doctor, b: Doctor) => {
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
  }, [departmentDoctors, searchTerm, filterPartners, sortOption]);

  
  const renderContent = () => {
    if (departmentDoctors.length === 0 && !searchTerm) {
       return (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8 col-span-1 md:col-span-2 lg:col-span-3 py-20">
            <div className="flex flex-col items-center gap-2 text-center">
              <UserSearch className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">{t('oncology.noDoctors')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('oncology.addFirstDoctor')}
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
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-1 items-center justify-center mt-8 py-20">
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
      <Header onAddDoctor={() => setAddDoctorOpen(true)} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title={t('oncology.totalDoctors')} value={departmentStats.doctorCount} icon={Users} />
            <StatCard title={t('oncology.totalReferrals')} value={departmentStats.totalReferrals} icon={Activity} />
            <StatCard title={t('oncology.mostActive')} value={departmentStats.mostActiveDoctor} icon={UserCheck} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle>{t('oncology.doctorList')}</CardTitle>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
           </Card>
           <div className="lg:col-span-2">
                <RecentPatients patients={departmentPatients} />
           </div>
        </div>

      </main>
      <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} departmentSpecialty={departmentSpecialty} />
    </>
  );
}
