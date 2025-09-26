'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { useDoctors } from '@/hooks/use-doctors';
import { Patient } from '@/types';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize, Minimize, Bed, BedDouble, User, Stethoscope } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NotificationsButton } from '@/components/notifications-button';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const TOTAL_FLOORS = 20;
const ROOMS_PER_FLOOR = 10;

function RoomCard({ floor, room, patient, onSelectPatient }: { floor: number; room: number; patient: Patient | null; onSelectPatient: (p: Patient) => void; }) {
    const { t } = useLanguage();
    const isOccupied = !!patient;
    const roomNumber = floor * 100 + room;

    return (
        <Card
            className={cn(
                "flex flex-col items-center justify-center p-4 transition-all aspect-square",
                isOccupied ? "bg-blue-500/10 border-blue-500/30 cursor-pointer hover:shadow-lg" : "bg-green-500/10 border-green-500/30"
            )}
            onClick={() => isOccupied && onSelectPatient(patient)}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <BedDouble className={cn("h-8 w-8", isOccupied ? "text-blue-500" : "text-green-500")} />
                <span className="font-bold text-lg">{roomNumber}</span>
                <span className="text-xs text-muted-foreground truncate">{isOccupied ? patient.patientName : t('wards.vacant')}</span>
            </div>
        </Card>
    );
}

function PatientDetailsDialog({ patient, onOpenChange }: { patient: Patient | null; onOpenChange: () => void; }) {
    const { t, lang } = useLanguage();
    const { doctors } = useDoctors();

    if (!patient) return null;

    const attendingDoctor = patient.doctorId ? doctors.find(d => d.id === patient.doctorId) : null;
    const roomNumber = patient.floor && patient.room ? patient.floor * 100 + patient.room : 'N/A';

    return (
        <Dialog open={!!patient} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('wards.patientDetails')} - {t('wards.room')} {roomNumber}</DialogTitle>
                    <DialogDescription>{patient.patientName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {patient.patientName}</div>
                    {attendingDoctor && <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground" /> {attendingDoctor.name}</div>}
                    {patient.admittedAt && (
                        <div className="flex items-center gap-2">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            <span>{t('wards.admitted')}: {formatDistanceToNow(new Date(patient.admittedAt), { addSuffix: true, locale: lang === 'ar' ? ar : undefined })}</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}


export default function WardsPage() {
    const { t } = useLanguage();
    const { patients } = usePatients();
    const [selectedFloor, setSelectedFloor] = useState(1);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
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
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
            <PatientDetailsDialog patient={selectedPatient} onOpenChange={() => setSelectedPatient(null)} />
        </div>
    );
}
