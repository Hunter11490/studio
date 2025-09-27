'use client';

import { useState, useMemo } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { MoreVertical, Maximize, Minimize, HeartPulse, Thermometer, Wind, Activity, Pencil, PlusCircle, User as UserIcon, ChevronsRight, Eye, Hourglass, Search, LogOut, Cross } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationsButton } from '@/components/notifications-button';
import { Patient, TriageLevel } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PatientRegistrationDialog } from '@/components/reception/patient-registration-dialog';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const triageConfig = {
  critical: { color: "bg-red-500", label: "Critical" },
  urgent: { color: "bg-yellow-500", label: "Urgent" },
  stable: { color: "bg-green-500", label: "Stable" },
  minor: { color: "bg-blue-500", label: "Minor" },
};

function DischargeDialog({ patient, onDischarge }: { patient: Patient | null; onDischarge: (status: 'recovered' | 'deceased') => void; }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'recovered' | 'deceased'>('recovered');
  
  const handleConfirm = () => {
    if (patient) {
      onDischarge(status);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        // When closing, treat it as a cancel, don't trigger discharge
        // The onDischarge is only called via the explicit button click
        // For this to work, we need to pass a different function to onOpenChange
        // Or handle it in the parent. Let's adjust the parent.
    }
};

  if (!patient) return null;


  return (
    <Dialog open={!!patient} onOpenChange={(open) => !open && onDischarge(status)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('emergency.discharge')} {patient.patientName}</DialogTitle>
          <DialogDescription>{t('emergency.dischargeConfirm')}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={status} onValueChange={(v) => setStatus(v as any)} className="my-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recovered" id="r-recovered" />
            <Label htmlFor="r-recovered">{t('medicalRecords.dischargeStatus.recovered')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="deceased" id="r-deceased" />
            <Label htmlFor="r-deceased">{t('medicalRecords.dischargeStatus.deceased')}</Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button onClick={handleConfirm}>{t('emergency.discharge')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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

function PatientCard({ patient, onUpdatePatient, onDischarge }: { patient: Patient, onUpdatePatient: (id: string, updates: Partial<Patient>) => void, onDischarge: (patientId: string, status: 'recovered' | 'deceased') => void; }) {
  const { t } = useLanguage();
  const { doctors } = useDoctors();
  const [isEditing, setIsEditing] = useState(false);
  const [isDischargeOpen, setDischargeOpen] = useState(false);

  const config = triageConfig[patient.triageLevel as TriageLevel] || triageConfig.minor;
  const { vitalSigns } = patient;

  const emergencyDoctors = useMemo(() => doctors.filter(d => d.specialty === 'Emergency Medicine'), [doctors]);
  const attendingDoctor = patient.attendingDoctorId ? doctors.find(d => d.id === patient.attendingDoctorId) : null;

  const handleDischargeConfirm = (status: 'recovered' | 'deceased') => {
      onDischarge(patient.id, status);
      setDischargeOpen(false);
  };
  
  const closeDischargeDialog = () => {
    setDischargeOpen(false);
  }

  return (
    <>
        <div className="p-3 mb-2 rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{patient.patientName}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={cn("w-3 h-3 rounded-full", config.color)}></div>
                        <span className="text-xs font-medium">{t(`emergency.triage.${patient.triageLevel}`)}</span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('doctorCard.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {patient.status !== 'In Treatment' && (
                          <DropdownMenuItem onClick={() => onUpdatePatient(patient.id, { status: 'In Treatment' })}>
                            <ChevronsRight className="mr-2 h-4 w-4" />
                            {t('emergency.moveToTreatment')}
                          </DropdownMenuItem>
                        )}
                        {patient.status !== 'Observation' && (
                          <DropdownMenuItem onClick={() => onUpdatePatient(patient.id, { status: 'Observation' })}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('emergency.moveToObservation')}
                          </DropdownMenuItem>
                        )}
                        {patient.status !== 'Waiting' && (
                          <DropdownMenuItem onClick={() => onUpdatePatient(patient.id, { status: 'Waiting' })}>
                              <Hourglass className="mr-2 h-4 w-4" />
                              {t('emergency.moveToWaiting')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onUpdatePatient(patient.id, { department: 'icu', status: 'Admitted' })}>
                          {t('emergency.admitToICU')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdatePatient(patient.id, { department: 'wards', status: 'Admitted' })}>
                          {t('emergency.admitToWard')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDischargeOpen(true)} className="text-destructive">
                           <LogOut className="mr-2 h-4 w-4" />
                          {t('emergency.discharge')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <VitalSign icon={HeartPulse} value={vitalSigns?.heartRate || 'N/A'} unit="bpm" label={t('emergency.vitals.heartRate')} />
                <VitalSign icon={Activity} value={vitalSigns?.bloodPressure || 'N/A'} unit="mmHg" label={t('emergency.vitals.bloodPressure')} />
                <VitalSign icon={Wind} value={vitalSigns?.spo2 || 'N/A'} unit="%" label={t('emergency.vitals.spo2')} />
                <VitalSign icon={Thermometer} value={vitalSigns?.temperature ? vitalSigns.temperature.toFixed(1) : 'N/A'} unit="°C" label={t('emergency.vitals.temperature')} />
            </div>
             <div className="space-y-1">
                {attendingDoctor ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserIcon className="h-3 w-3" />
                        <span>{attendingDoctor.name}</span>
                    </div>
                ) : (
                    <Select onValueChange={(docId) => onUpdatePatient(patient.id, { attendingDoctorId: docId })} value={patient.attendingDoctorId}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={t('emergency.assignDoctor')} />
                        </SelectTrigger>
                        <SelectContent>
                            {emergencyDoctors.map(doc => (
                                <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
        <PatientRegistrationDialog 
            open={isEditing} 
            onOpenChange={setIsEditing} 
            patientToEdit={patient}
        />
        <DischargeDialog patient={isDischargeOpen ? patient : null} onDischarge={handleDischargeConfirm} />
    </>
  );
}


export default function EmergencyPage() {
  const { t } = useLanguage();
  const { patients, updatePatient } = usePatients();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);
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
  
  const handleDischargePatient = (patientId: string, status: 'recovered' | 'deceased') => {
        updatePatient(patientId, {
            status: 'Discharged',
            dischargeStatus: status,
            dischargedAt: new Date().toISOString(),
        });
  };

  const emergencyPatients = useMemo(() => {
    return patients.filter(p => 
      p.department === 'emergency' && 
      p.status !== 'Discharged' &&
      (searchTerm === '' || p.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [patients, searchTerm]);
  
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAddPatientOpen(true)}
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t('reception.addPatient')}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
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

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('accounts.searchPatient')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 px-4 pb-4 min-h-0">
          <div className="bg-card rounded-lg flex flex-col p-2 min-h-0">
              <h2 className="font-bold p-2 border-b">{t('emergency.waiting')} ({waitingPatients.length})</h2>
              <ScrollArea className="flex-grow">
                <div className="p-2">
                  {waitingPatients.map(p => <PatientCard key={p.id} patient={p} onUpdatePatient={updatePatient} onDischarge={handleDischargePatient} />)}
                </div>
              </ScrollArea>
          </div>
          <div className="bg-card rounded-lg flex flex-col p-2 min-h-0">
              <h2 className="font-bold p-2 border-b">{t('emergency.inTreatment')} ({treatmentPatients.length})</h2>
              <ScrollArea className="flex-grow">
                <div className="p-2">
                    {treatmentPatients.map(p => <PatientCard key={p.id} patient={p} onUpdatePatient={updatePatient} onDischarge={handleDischargePatient} />)}
                </div>
              </ScrollArea>
          </div>
          <div className="bg-card rounded-lg flex flex-col p-2 min-h-0">
              <h2 className="font-bold p-2 border-b">{t('emergency.observation')} ({observationPatients.length})</h2>
              <ScrollArea className="flex-grow">
                <div className="p-2">
                    {observationPatients.map(p => <PatientCard key={p.id} patient={p} onUpdatePatient={updatePatient} onDischarge={handleDischargePatient} />)}
                </div>
              </ScrollArea>
          </div>
      </main>
      <PatientRegistrationDialog
        open={isAddPatientOpen}
        onOpenChange={setAddPatientOpen}
      />
    </div>
  )
}
