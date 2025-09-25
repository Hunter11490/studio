'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { useDoctors } from '@/hooks/use-doctors';
import { format, formatRelative, parseISO, startOfToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { PatientRegistrationDialog } from '@/components/reception/patient-registration-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, User, Maximize, Minimize } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Patient } from '@/types';
import { Stethoscope } from 'lucide-react';
import { NotificationsButton } from '@/components/notifications-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function PatientItem({ patient }: { patient: Patient }) {
  const { t } = useLanguage();
  const { doctors } = useDoctors();
  const [isEditing, setIsEditing] = useState(false);
  
  const referringDoctor = patient.doctorId ? doctors.find(d => d.id === patient.doctorId) : null;

  return (
    <>
      <div className="py-3 flex justify-between items-center">
        <div>
          <p className="font-semibold">{patient.patientName}</p>
          <p className="text-sm text-muted-foreground">{t('reception.toDepartment')} {t(`departments.${patient.department}`)}</p>
          {referringDoctor && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <User className="h-3 w-3" />
              {t('reception.referredBy')}: {referringDoctor.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground" dir="ltr">
                {format(parseISO(patient.createdAt), 'hh:mm a')}
            </div>
        </div>
      </div>
      <PatientRegistrationDialog 
        open={isEditing} 
        onOpenChange={setIsEditing} 
        patientToEdit={patient}
      />
    </>
  );
}


export default function ReceptionPage() {
  const { t, lang } = useLanguage();
  const { patients } = usePatients();
  const [isFormOpen, setFormOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const groupedPatients = useMemo(() => {
    return patients.reduce((acc, patient) => {
      const date = parseISO(patient.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(patient);
      return acc;
    }, {} as Record<string, Patient[]>);
  }, [patients]);
  
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedPatients).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedPatients]);

  const getRelativeDate = (dateString: string) => {
    const date = parseISO(dateString);
    const today = startOfToday();
    const locale = lang === 'ar' ? ar : undefined;
    return formatRelative(date, today, { locale });
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col items-center">
             <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.reception')}</h1>
        </div>
        <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreenToggle}
                  >
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

      <ScrollArea className="flex-grow p-4 md:p-8">
        <div className="space-y-6">
            {patients.length === 0 ? (
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8 py-20">
                    <div className="flex flex-col items-center gap-2 text-center">
                    <Stethoscope className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight">{t('reception.noPatientsTitle')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('reception.noPatientsDesc')}
                    </p>
                    <Button onClick={() => setFormOpen(true)} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('reception.addPatient')}
                    </Button>
                    </div>
                </div>
            ) : sortedGroupKeys.map(dateKey => (
              <Card key={dateKey}>
                <CardHeader>
                  <CardTitle className="text-base font-medium capitalize">{getRelativeDate(dateKey)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {groupedPatients[dateKey]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(patient => (
                       <PatientItem key={patient.id} patient={patient} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </ScrollArea>
      
      <Button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">{t('reception.addPatient')}</span>
      </Button>

      <PatientRegistrationDialog open={isFormOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
