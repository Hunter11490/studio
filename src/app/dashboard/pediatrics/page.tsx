'use client';

import { useMemo, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Baby, Frown, UserSearch, Star } from 'lucide-react';
import { Doctor } from '@/types';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StethoscopeLogo } from '@/components/stethoscope-logo';

export default function PediatricsPage() {
    const { doctors, searchTerm, filterPartners } = useDoctors();
    const { t } = useLanguage();
    const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);

    const filteredDoctors = useMemo(() => {
        return doctors
            .filter(doctor => !searchTerm || doctor.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(doctor => !filterPartners || doctor.isPartner);
    }, [doctors, searchTerm, filterPartners]);

    const renderContent = () => {
        if (doctors.length === 0) {
            return (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <UserSearch className="h-16 w-16 text-muted-foreground" />
                        <h3 className="text-2xl font-bold tracking-tight">{t('common.noResults')}</h3>
                        <p className="text-sm text-muted-foreground">{t('header.addDoctor')} لبدء استخدام التطبيق.</p>
                        <Button onClick={() => setAddDoctorOpen(true)} className="mt-4">{t('header.addDoctor')}</Button>
                    </div>
                </div>
            );
        }

        if (filteredDoctors.length === 0) {
            return (
                <div className="flex flex-1 items-center justify-center mt-8">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <Frown className="h-12 w-12" />
                        <p className="text-lg">{t('common.noResults')}</p>
                    </div>
                </div>
            );
        }

        const colors = ['bg-blue-100 dark:bg-blue-900/30', 'bg-pink-100 dark:bg-pink-900/30', 'bg-green-100 dark:bg-green-900/30', 'bg-yellow-100 dark:bg-yellow-900/30'];

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDoctors.map((doctor, index) => (
                    <Card key={doctor.id} className={cn("overflow-hidden relative", colors[index % colors.length])}>
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold text-primary">{doctor.name}</CardTitle>
                                    <CardDescription>{doctor.specialty}</CardDescription>
                                </div>
                                <Baby className="h-8 w-8 text-primary/50"/>
                             </div>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p>{doctor.clinicAddress}</p>
                            <p className="font-mono text-muted-foreground" dir="ltr">{doctor.phoneNumber}</p>
                            {doctor.isPartner && <Star className="h-4 w-4 text-yellow-500 fill-current mt-2"/>}
                        </CardContent>
                        <StethoscopeLogo className="absolute -right-5 -bottom-5 h-24 w-24 text-primary/5 opacity-50"/>
                    </Card>
                ))}
            </div>
        )
    };

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
