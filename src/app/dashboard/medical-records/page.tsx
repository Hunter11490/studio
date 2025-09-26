'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { Patient } from '@/types';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize, Minimize, Search, User, FileClock } from 'lucide-react';
import { format, differenceInYears, parseISO, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';
import { NotificationsButton } from '@/components/notifications-button';

export default function MedicalRecordsPage() {
    const { t, lang } = useLanguage();
    const { patients } = usePatients();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
    
    const filteredPatients = useMemo(() => {
        return patients.filter(p => 
            p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.medicalRecords')}</h1>
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

            <main className="flex-grow p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('medicalRecords.title')}</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('medicalRecords.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('medicalRecords.fullName')}</TableHead>
                                        <TableHead>{t('medicalRecords.age')}</TableHead>
                                        <TableHead>{t('medicalRecords.lastVisit')}</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.map((patient) => {
                                        let age: number | string = 'N/A';
                                        const dobString = `${patient.dob.year}-${patient.dob.month}-${patient.dob.day}`;
                                        const dobDate = parseISO(dobString);
                                        if (isValid(dobDate)) {
                                            const calculatedAge = differenceInYears(new Date(), dobDate);
                                            if (!isNaN(calculatedAge)) {
                                                age = calculatedAge;
                                            }
                                        }

                                        return (
                                            <TableRow key={patient.id}>
                                                <TableCell className="font-medium">{patient.patientName}</TableCell>
                                                <TableCell>{age}</TableCell>
                                                <TableCell>
                                                    {format(new Date(patient.createdAt), 'PPP', { locale: lang === 'ar' ? ar : undefined })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline">
                                                        <FileClock className="mr-2 h-4 w-4" />
                                                        {t('medicalRecords.viewHistory')}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredPatients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                {t('medicalRecords.noRecords')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
