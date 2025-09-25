'use client';

import { useMemo, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Frown, UserSearch, FileDown, HeartPulse } from 'lucide-react';
import { Doctor } from '@/types';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/excel';
import { translateText, DoctorInfo } from '@/ai/flows/translation-flow';
import { PartnerExportData } from '@/types';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function DoctorsChart({ doctors }: { doctors: Doctor[] }) {
    const chartData = useMemo(() => {
        return doctors.slice(0, 10).map(d => ({
            name: d.name.split(' ')[0], // Use first name for brevity
            referrals: d.referralCount,
            fill: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))`
        }));
    }, [doctors]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                />
                <Bar dataKey="referrals" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}


export default function CardiologyPage() {
    const { doctors, searchTerm, filterPartners, viewMode, sortOption } = useDoctors();
    const { t } = useLanguage();
    const { toast } = useToast();
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

        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{t('departments.cardiology')} - {t('partnerDashboard.exportReferrals')}</CardTitle>
                        <CardDescription>{t('common.loading')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DoctorsChart doctors={filteredDoctors} />
                    </CardContent>
                </Card>
                {filteredDoctors.map(doctor => (
                    <Card key={doctor.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HeartPulse className="text-primary h-5 w-5"/>
                                {doctor.name}
                            </CardTitle>
                            <CardDescription>{doctor.specialty}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm">
                             <p className="text-muted-foreground">{doctor.clinicAddress}</p>
                             <p className="font-mono" dir="ltr">{doctor.phoneNumber}</p>
                        </CardContent>
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
