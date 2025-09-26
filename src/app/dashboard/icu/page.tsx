'use client';

import { useState, useMemo } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Maximize, Minimize, Bed, User, Stethoscope, HeartPulse } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationsButton } from '@/components/notifications-button';
import { Patient } from '@/types';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line, Tooltip as ChartTooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TOTAL_ICU_BEDS = 12;

const generateEcgData = () => {
    return Array.from({ length: 50 }, (_, i) => ({
        name: i,
        uv: 100 + Math.random() * 20 + (i % 10 === 5 ? Math.random() * 50 : 0) - (i % 10 === 7 ? Math.random() * 30 : 0)
    }));
};


function BedCard({ bedNumber, patient }: { bedNumber: number; patient: Patient | null }) {
    const { t } = useLanguage();
    const [isMonitorOpen, setMonitorOpen] = useState(false);
    const isOccupied = !!patient;

    return (
        <>
            <Card 
                className={cn(
                    "flex flex-col items-center justify-center p-4 transition-all",
                    isOccupied ? "bg-red-500/10 border-red-500/30 cursor-pointer hover:shadow-lg" : "bg-green-500/10 border-green-500/30"
                )}
                onClick={() => isOccupied && setMonitorOpen(true)}
            >
                <div className="flex flex-col items-center gap-2">
                    <Bed className={cn("h-8 w-8", isOccupied ? "text-red-500" : "text-green-500")} />
                    <span className="font-bold text-lg">{t('icu.bed')} {bedNumber}</span>
                    <span className="text-sm text-muted-foreground">{isOccupied ? patient.patientName : t('icu.vacant')}</span>
                </div>
            </Card>
            {isOccupied && (
                 <Dialog open={isMonitorOpen} onOpenChange={setMonitorOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{t('icu.monitorFor')} {patient.patientName} - {t('icu.bed')} {bedNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> {patient.patientName}</div>
                                <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground"/> Dr. {patient.doctorId ? 'Assigned' : 'N/A'}</div>
                            </div>
                            <div className="h-48 w-full">
                                <ResponsiveContainer>
                                    <LineChart data={generateEcgData()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <ChartTooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Line type="monotone" dataKey="uv" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground">{t('emergency.vitals.heartRate')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns?.heartRate}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground">{t('emergency.vitals.bloodPressure')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns?.bloodPressure}</p>
                                </div>
                                 <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground">{t('emergency.vitals.spo2')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns?.spo2}%</p>
                                </div>
                                 <div className="p-2 rounded-lg bg-secondary">
                                    <p className="text-xs text-muted-foreground">{t('emergency.vitals.temperature')}</p>
                                    <p className="font-bold text-lg">{patient.vitalSigns?.temperature}°C</p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                 </Dialog>
            )}
        </>
    );
}


export default function ICUPage() {
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

    const icuPatients = useMemo(() => {
        return patients.filter(p => p.department === 'icu');
    }, [patients]);
    
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
                  {Array.from({ length: TOTAL_ICU_BEDS }).map((_, index) => (
                      <BedCard key={index} bedNumber={index + 1} patient={icuPatients[index] || null} />
                  ))}
              </div>
          </main>
        </div>
    )
}
