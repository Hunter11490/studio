'use client';

import { useState, useMemo } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Maximize, Minimize, HeartPulse, Thermometer, Wind, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationsButton } from '@/components/notifications-button';
import { Patient, TriageLevel } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const triageConfig = {
  critical: { color: "bg-red-500", label: "Critical" },
  urgent: { color: "bg-yellow-500", label: "Urgent" },
  stable: { color: "bg-green-500", label: "Stable" },
  minor: { color: "bg-blue-500", label: "Minor" },
};

function VitalSign({ icon: Icon, value, unit, label }: { icon: React.ElementType, value: string | number, unit: string, label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent><p>{label}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="font-mono">{value}</span>
      <span className="text-muted-foreground">{unit}</span>
    </div>
  )
}

function PatientCard({ patient }: { patient: Patient }) {
  const { t } = useLanguage();
  const config = triageConfig[patient.triageLevel as TriageLevel] || triageConfig.minor;
  const { vitalSigns } = patient;

  return (
    <Card className="mb-2">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{patient.patientName}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="xs">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>{t('emergency.admitToICU')}</DropdownMenuItem>
                <DropdownMenuItem>{t('emergency.admitToWard')}</DropdownMenuItem>
                <DropdownMenuItem>{t('emergency.discharge')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", config.color)}></div>
            <span className="text-xs font-medium">{t(`emergency.triage.${patient.triageLevel}`)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
        <VitalSign icon={HeartPulse} value={vitalSigns?.heartRate || 'N/A'} unit="bpm" label={t('emergency.vitals.heartRate')} />
        <VitalSign icon={Activity} value={vitalSigns?.bloodPressure || 'N/A'} unit="mmHg" label={t('emergency.vitals.bloodPressure')} />
        <VitalSign icon={Wind} value={vitalSigns?.spo2 || 'N/A'} unit="%" label={t('emergency.vitals.spo2')} />
        <VitalSign icon={Thermometer} value={vitalSigns?.temperature || 'N/A'} unit="°C" label={t('emergency.vitals.temperature')} />
      </CardContent>
    </Card>
  );
}


export default function EmergencyPage() {
  const { t } = useLanguage();
  const { patients } = usePatients();
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

  const emergencyPatients = useMemo(() => {
    return patients.filter(p => p.department === 'emergency');
  }, [patients]);
  
  const waitingPatients = emergencyPatients.filter(p => p.status === 'Waiting');
  const treatmentPatients = emergencyPatients.filter(p => p.status === 'In Treatment');
  const observationPatients = emergencyPatients.filter(p => p.status === 'Observation');

  return (
    <div className="flex flex-col h-screen bg-secondary/40">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
          </div>
          <div className="flex flex-col items-center">
              <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.emergency')}</h1>
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
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-auto">
          <div className="bg-card rounded-lg flex flex-col p-2">
              <h2 className="font-bold p-2">{t('emergency.waiting')} ({waitingPatients.length})</h2>
              <div className="flex-grow overflow-y-auto">
                  {waitingPatients.map(p => <PatientCard key={p.id} patient={p} />)}
              </div>
          </div>
          <div className="bg-card rounded-lg flex flex-col p-2">
              <h2 className="font-bold p-2">{t('emergency.inTreatment')} ({treatmentPatients.length})</h2>
              <div className="flex-grow overflow-y-auto">
                  {treatmentPatients.map(p => <PatientCard key={p.id} patient={p} />)}
              </div>
          </div>
          <div className="bg-card rounded-lg flex flex-col p-2">
              <h2 className="font-bold p-2">{t('emergency.observation')} ({observationPatients.length})</h2>
              <div className="flex-grow overflow-y-auto">
                  {observationPatients.map(p => <PatientCard key={p.id} patient={p} />)}
              </div>
          </div>
      </main>
    </div>
  )
}
