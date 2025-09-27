'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { useDoctors } from '@/hooks/use-doctors';
import { Patient, FinancialRecord } from '@/types';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize, Minimize, BedDouble, X, User, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { NotificationsButton } from '@/components/notifications-button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { InpatientAdmissionDialog } from '@/components/reception/inpatient-admission-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const TOTAL_FLOORS = 20;
const ROOMS_PER_FLOOR = 10;

function RoomCard({ floor, room, patient, onSelectPatient, onAddPatient }: { floor: number; room: number; patient: Patient | null; onSelectPatient: (p: Patient) => void; onAddPatient: (floor: number, room: number) => void; }) {
    const { t } = useLanguage();
    const isOccupied = !!patient;
    const roomNumber = floor * 100 + room;

    const handleClick = () => {
        if (isOccupied) {
            onSelectPatient(patient);
        } else {
            onAddPatient(floor, room);
        }
    };

    return (
        <Card
            className={cn(
                "flex flex-col items-center justify-center p-4 transition-all aspect-square cursor-pointer",
                isOccupied ? "bg-blue-500/10 border-blue-500/30 hover:shadow-lg" : "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            )}
            onClick={handleClick}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <BedDouble className={cn("h-8 w-8", isOccupied ? "text-blue-500" : "text-green-500")} />
                <span className="font-bold text-lg">{roomNumber}</span>
                <span className="text-xs text-muted-foreground truncate">{isOccupied ? patient.patientName : t('wards.vacant')}</span>
            </div>
        </Card>
    );
}


const calculateBalance = (records: FinancialRecord[] = []) => {
    return records.reduce((acc, record) => acc + record.amount, 0);
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
            <RadioGroupItem value="recovered" id="r-ward-recovered" />
            <Label htmlFor="r-ward-recovered">{t('medicalRecords.dischargeStatus.recovered')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="deceased" id="r-ward-deceased" />
            <Label htmlFor="r-ward-deceased">{t('medicalRecords.dischargeStatus.deceased')}</Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button onClick={handleConfirm}>{t('emergency.discharge')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PatientHistoryDialog({ patient, onOpenChange, onDischarge }: { patient: Patient | null; onOpenChange: () => void; onDischarge: (patientId: string, status: 'recovered' | 'deceased') => void; }) {
    const { t, lang } = useLanguage();
    const { doctors } = useDoctors();
    const { updatePatient } = usePatients();
    const [isDischargeOpen, setDischargeOpen] = useState(false);

    const wardDoctors = useMemo(() => doctors.filter(d => d.specialty === 'Internal Medicine'), [doctors]);
    const attendingDoctor = patient?.attendingDoctorId ? doctors.find(d => d.id === patient.attendingDoctorId) : null;
    
    if (!patient) return null;

    const balance = calculateBalance(patient.financialRecords);

    const handleDischargeConfirm = (status: 'recovered' | 'deceased') => {
        onDischarge(patient.id, status);
        setDischargeOpen(false);
        onOpenChange(); // Close the main dialog as well
    };

    return (
        <>
            <Dialog open={!!patient} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('medicalRecords.patientHistoryFor')} {patient.patientName}</DialogTitle>
                        <DialogDescription>{t('accounts.invoiceDesc')}</DialogDescription>
                    </DialogHeader>

                    <div className='p-4 border rounded-md my-4 space-y-2'>
                        <h4 className="text-sm font-medium">{t('wards.attendingPhysician')}</h4>
                         {attendingDoctor ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4"/> {attendingDoctor.name}</div>
                        ) : (
                            <Select onValueChange={(docId) => updatePatient(patient.id, { attendingDoctorId: docId })} value={patient.attendingDoctorId}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder={t('wards.assignDoctor')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {wardDoctors.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-4">
                            {(patient.financialRecords || []).map(record => (
                                <div key={record.id} className="flex justify-between items-center p-2 rounded-md bg-secondary/50">
                                    <div>
                                        <p className="font-medium">{record.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(record.date), 'PPP', { locale: lang === 'ar' ? ar : undefined })}
                                        </p>
                                    </div>
                                    <Badge variant={record.amount >= 0 ? 'destructive' : 'success'} className="font-mono">
                                        {record.amount.toLocaleString()} {t('lab.iqd')}
                                    </Badge>
                                </div>
                            ))}
                             {(!patient.financialRecords || patient.financialRecords.length === 0) && (
                                <p className="text-center text-muted-foreground py-8">{t('accounts.noRecords')}</p>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="flex-col items-start gap-2 border-t pt-4">
                        <div className="w-full flex justify-between font-bold text-lg">
                            <span>{t('accounts.totalBalance')}:</span>
                            <span className="font-mono" dir="ltr">{balance.toLocaleString()} {t('lab.iqd')}</span>
                        </div>
                        <div className="w-full flex gap-2">
                             <Button onClick={() => onOpenChange()} variant="secondary" className="flex-1">
                                <X className="mr-2 h-4 w-4" />
                                {t('common.close')}
                            </Button>
                            <Button onClick={() => setDischargeOpen(true)} variant="destructive" className="flex-1">
                                <LogOut className="mr-2 h-4 w-4" />
                                {t('emergency.discharge')}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <DischargeDialog 
                patient={isDischargeOpen ? patient : null} 
                onDischarge={handleDischargeConfirm}
                onOpenChange={setDischargeOpen}
            />
        </>
    );
}


export default function WardsPage() {
    const { t } = useLanguage();
    const { patients, updatePatient } = usePatients();
    const [selectedFloor, setSelectedFloor] = useState(1);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isFormOpen, setFormOpen] = useState(false);
    const [prefilledRoom, setPrefilledRoom] = useState<{floor: number, room: number} | null>(null);
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
    
    const patientsByRoom = useMemo(() => {
        const map = new Map<string, Patient>();
        patients.forEach(p => {
            if (p.floor && p.room) {
                map.set(`${p.floor}-${p.room}`, p);
            }
        });
        return map;
    }, [patients]);
    
    const handleAddPatientToRoom = (floor: number, room: number) => {
        setPrefilledRoom({ floor, room });
        setFormOpen(true);
    };

    const handleDischargePatient = (patientId: string, status: 'recovered' | 'deceased') => {
        updatePatient(patientId, {
            status: 'Discharged',
            dischargeStatus: status,
            dischargedAt: new Date().toISOString(),
            floor: undefined,
            room: undefined,
            department: 'medicalRecords' // Move to medical records archive
        });
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.wards')}</h1>
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
                        <CardTitle>{t('wards.title')}</CardTitle>
                        <Select onValueChange={(value) => setSelectedFloor(Number(value))} defaultValue={String(selectedFloor)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('wards.selectFloor')} />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: TOTAL_FLOORS }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                        {t('wards.floor')} {i + 1}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Array.from({ length: ROOMS_PER_FLOOR }, (_, i) => (
                                <RoomCard
                                    key={i + 1}
                                    floor={selectedFloor}
                                    room={i + 1}
                                    patient={patientsByRoom.get(`${selectedFloor}-${i + 1}`) || null}
                                    onSelectPatient={setSelectedPatient}
                                    onAddPatient={handleAddPatientToRoom}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
            
            <PatientHistoryDialog 
                patient={selectedPatient} 
                onOpenChange={() => setSelectedPatient(null)} 
                onDischarge={handleDischargePatient}
            />
            
            <InpatientAdmissionDialog
              open={isFormOpen} 
              onOpenChange={setFormOpen} 
              prefilledRoom={prefilledRoom}
            />
        </div>
    );
}
