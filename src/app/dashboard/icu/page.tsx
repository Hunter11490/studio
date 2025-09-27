'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize, Bed, User, Stethoscope, HeartPulse, Activity, Wind, Thermometer, Pencil, PlusCircle, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationsButton } from '@/components/notifications-button';
import { Patient, FinancialRecord } from '@/types';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PatientRegistrationDialog } from '@/components/reception/patient-registration-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { translations } from '@/lib/localization';

const TOTAL_ICU_BEDS = 12;

const generateEcgData = () => {
    return Array.from({ length: 50 }, (_, i) => ({
        name: i,
        uv: 100 + Math.random() * 20 + (i % 10 === 5 ? Math.random() * 50 : 0) - (i % 10 === 7 ? Math.random() * 30 : 0)
    }));
};

function DischargeDialog({ patient, onDischarge, onOpenChange }: { patient: Patient | null; onDischarge: (status: 'recovered' | 'deceased') => void; onOpenChange: (open: boolean) => void; }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'recovered' | 'deceased'>('recovered');
  
  const handleConfirm = () => {
    if (patient) {
      onDischarge(status);
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={!!patient} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('emergency.discharge')} {patient.patientName}</DialogTitle>
          <DialogDescription>{t('emergency.dischargeConfirm')}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={status} onValueChange={(v) => setStatus(v as any)} className="my-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recovered" id="r-icu-recovered" />
            <Label htmlFor="r-icu-recovered">{t('medicalRecords.dischargeStatus.recovered')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="deceased" id="r-icu-deceased" />
            <Label htmlFor="r-icu-deceased">{t('medicalRecords.dischargeStatus.deceased')}</Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button onClick={handleConfirm}>{t('emergency.discharge')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function BedCard({ bedNumber, patient, onAddPatient, onDischarge }: { bedNumber: number; patient: Patient | null; onAddPatient: (bedNumber: number) => void; onDischarge: (patientId: string, status: 'recovered' | 'deceased') => void; }) {
    const { t } = useLanguage();
    const { doctors } = useDoctors();
    const { updatePatient } = usePatients();
    const [isMonitorOpen, setMonitorOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDischargeOpen, setDischargeOpen] = useState(false);
    const [ecgData, setEcgData] = useState(generateEcgData());
    const isOccupied = !!patient;

    const icuDoctors = useMemo(() => doctors.filter(d => d.specialty === 'Intensive Care Medicine'), [doctors]);
    const attendingDoctor = patient?.attendingDoctorId ? doctors.find(d => d.id === patient.attendingDoctorId) : null;

    useEffect(() => {
        if (isMonitorOpen) {
            const interval = setInterval(() => {
                setEcgData(generateEcgData());
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isMonitorOpen]);
    
    const handleCardClick = () => {
        if(isOccupied) {
            setMonitorOpen(true);
        } else {
            onAddPatient(bedNumber);
        }
    }

    const handleDischargeConfirm = (status: 'recovered' | 'deceased') => {
        if (patient) {
            onDischarge(patient.id, status);
        }
        setDischargeOpen(false);
        setMonitorOpen(false);
    };

    return (
        <>
            <div 
                className={cn(
                    "flex flex-col items-center justify-center p-4 transition-all rounded-lg border",
                    isOccupied ? "bg-red-500/10 border-red-500/30 cursor-pointer hover:shadow-lg" : "bg-green-500/10 border-green-500/30 cursor-pointer hover:bg-green-500/20"
                )}
                onClick={handleCardClick}
            >
                <div className="flex flex-col items-center gap-2 text-center">
                    <Bed className={cn("h-8 w-8", isOccupied ? "text-red-500" : "text-green-500")} />
                    <span className="font-bold text-lg">{t('icu.bed')} {bedNumber}</span>
                    <span className="text-sm text-muted-foreground truncate">{isOccupied ? patient.patientName : t('icu.vacant')}</span>
                </div>
            </div>
            {isOccupied && patient.vitalSigns && (
                 <Dialog open={isMonitorOpen} onOpenChange={setMonitorOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{t('icu.monitorFor')} {patient.patientName} - {t('icu.bed')} {bedNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> {patient.patientName}</div>
                                {attendingDoctor ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Stethoscope className="h-4 w-4"/> {attendingDoctor.name}</div>
                                ) : (
                                    <Select onValueChange={(docId) => updatePatient(patient.id, { attendingDoctorId: docId })} value={patient.attendingDoctorId}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder={t('icu.assignDoctor')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {icuDoctors.map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="h-48 w-full bg-black rounded-lg p-2">
                                <ResponsiveContainer>
                                    <LineChart data={ecgData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                        <Line type="monotone" dataKey="uv" stroke="#34D399" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center">
                                <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><HeartPulse className="h-3 w-3"/> {t('emergency.vitals.heartRate')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns.heartRate}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Activity className="h-3 w-3"/> {t('emergency.vitals.bloodPressure')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns.bloodPressure}</p>
                                 </div>
                                 <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Wind className="h-3 w-3"/> {t('emergency.vitals.spo2')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns.spo2}%</p>
                                 </div>
                                 <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Thermometer className="h-3 w-3"/> {t('emergency.vitals.temperature')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns.temperature.toFixed(1)}°C</p>
                                 </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t('doctorCard.edit')} {t('reception.patientName')}
                            </Button>
                            <Button variant="destructive" onClick={() => setDischargeOpen(true)}>
                                <LogOut className="mr-2 h-4 w-4" />
                                {t('emergency.discharge')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
            )}
            {patient && (
                <PatientRegistrationDialog
                    open={isEditing}
                    onOpenChange={setIsEditing}
                    patientToEdit={patient}
                />
            )}
            <DischargeDialog 
                patient={isDischargeOpen ? patient : null} 
                onDischarge={handleDischargeConfirm}
                onOpenChange={setDischargeOpen}
            />
        </>
    );
}

function AdmitToICUDialog({ open, onOpenChange, bedNumber, onAdmit }: { open: boolean, onOpenChange: (open: boolean) => void, bedNumber: number | null, onAdmit: (patientId: string, bedNumber: number) => void }) {
    const { t } = useLanguage();
    const { patients } = usePatients();
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');

    const availablePatients = useMemo(() => {
        return patients.filter(p => p.department !== 'icu' && p.status !== 'Discharged');
    }, [patients]);
    
    const handleConfirm = () => {
        if (selectedPatientId && bedNumber) {
            onAdmit(selectedPatientId, bedNumber);
            onOpenChange(false);
            setSelectedPatientId('');
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('icu.admitToBed')} {bedNumber}</DialogTitle>
                </DialogHeader>
                 <div className="py-4">
                    <Label>{t('reception.patientName')}</Label>
                    <Select onValueChange={setSelectedPatientId} value={selectedPatientId}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('wards.selectPatientPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {availablePatients.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('doctorForm.cancel')}</Button>
                    <Button onClick={handleConfirm} disabled={!selectedPatientId}>{t('wards.admitPatient')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ICUPage() {
    const { t } = useLanguage();
    const { patients, updatePatient, addFinancialRecord } = usePatients();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [isAdmitDialogOpen, setAdmitDialogOpen] = useState(false);
    const [selectedBed, setSelectedBed] = useState<number | null>(null);

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

    const icuPatients = useMemo(() => {
        return patients.filter(p => p.department === 'icu' && p.status !== 'Discharged');
    }, [patients]);

    const handleAdmitToBed = (bedNumber: number) => {
        setSelectedBed(bedNumber);
        setAdmitDialogOpen(true);
    };

    const confirmAdmitPatient = (patientId: string, bedNumber: number) => {
        const icuDoctors = usePatients().patients.filter(d => d.department === 'Intensive Care Medicine');
        const attendingDoctorId = icuDoctors.length > 0 ? getRandomElement(icuDoctors).id : undefined;

        updatePatient(patientId, { department: 'icu', status: 'Admitted', attendingDoctorId, floor: undefined, room: undefined, bedNumber });
        addFinancialRecord(patientId, {
            type: 'inpatient',
            description: 'ICU Admission Fee',
            amount: 500000
        });
    };
    
    const handleDischargePatient = (patientId: string, status: 'recovered' | 'deceased') => {
        updatePatient(patientId, {
            status: 'Discharged',
            dischargeStatus: status,
            dischargedAt: new Date().toISOString(),
            department: 'medicalRecords', // Move to medical records archive
            bedNumber: undefined,
        });
    };
    
    const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    
    return (
        <div className="flex flex-col h-screen">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
              <div className="flex items-center gap-2">
                  <Logo className="h-8 w-8 text-primary" />
              </div>
              <div className="flex flex-col items-center">
                  <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.icu')}</h1>
              </div>
              <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setIsAddPatientOpen(true)}>
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
          <main className="flex-grow p-4 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {Array.from({ length: TOTAL_ICU_BEDS }).map((_, index) => {
                      const bedNumber = index + 1;
                      const patientInBed = icuPatients.find(p => p.bedNumber === bedNumber);
                      return (
                         <BedCard 
                            key={index} 
                            bedNumber={bedNumber} 
                            patient={patientInBed || null} 
                            onAddPatient={handleAdmitToBed}
                            onDischarge={handleDischargePatient}
                          />
                      );
                  })}
              </div>
          </main>
          <PatientRegistrationDialog
            open={isAddPatientOpen}
            onOpenChange={setIsAddPatientOpen}
          />
          <AdmitToICUDialog
             open={isAdmitDialogOpen}
             onOpenChange={setAdmitDialogOpen}
             bedNumber={selectedBed}
             onAdmit={confirmAdmitPatient}
          />
        </div>
    )
}

// Add new translations if they don't exist
if (translations.en.icu) {
    Object.assign(translations.en.icu, {
        admitToBed: "Admit Patient to Bed",
    });
}
if (translations.ar.icu) {
    Object.assign(translations.ar.icu, {
        admitToBed: "إدخال مريض إلى السرير",
    });
}
if (translations.en.wards) {
    Object.assign(translations.en.wards, {
        admitPatient: "Admit Patient",
    });
}
if (translations.ar.wards) {
    Object.assign(translations.ar.wards, {
        admitPatient: "إدخال المريض",
    });
}
    