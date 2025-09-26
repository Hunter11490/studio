'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize, Minimize, SprayCan, Package, Wind, Archive } from 'lucide-react';
import { NotificationsButton } from '@/components/notifications-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { InstrumentSet } from '@/types';

const departments = ['surgicalOperations', 'icu', 'emergency', 'ent', 'obGyn'];
const instrumentTypes = ['General Surgery Tray', 'Laparoscopy Set', 'Orthopedic Set', 'Dental Kit', 'Cardiac Set'];

const generateInitialSets = (): InstrumentSet[] => {
    return Array.from({ length: 15 }, (_, i) => ({
        id: `set-${i + 1}`,
        name: `${instrumentTypes[i % instrumentTypes.length]} #${Math.floor(i / instrumentTypes.length) + 1}`,
        department: departments[i % departments.length],
        status: ['cleaning', 'packaging', 'sterilizing', 'storage'][i % 4] as any,
        cycleStartTime: Date.now() - Math.random() * 1000 * 60 * 30, // Sometime in the last 30 mins
        cycleDuration: (15 + Math.random() * 15) * 60 // 15-30 minutes cycle
    }));
};

function InstrumentCard({ instrument }: { instrument: InstrumentSet }) {
    const { t } = useLanguage();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (instrument.status !== 'sterilizing') {
            setProgress(0);
            return;
        }

        const interval = setInterval(() => {
            const elapsedTime = (Date.now() - instrument.cycleStartTime) / 1000;
            const calculatedProgress = Math.min(100, (elapsedTime / instrument.cycleDuration) * 100);
            setProgress(calculatedProgress);
        }, 1000);

        return () => clearInterval(interval);

    }, [instrument]);

    return (
        <Card className="mb-2">
            <CardContent className="p-3">
                <p className="font-semibold text-sm">{instrument.name}</p>
                <p className="text-xs text-muted-foreground">{t(`departments.${instrument.department}`)}</p>
                {instrument.status === 'sterilizing' && (
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-mono">{t('sterilization.cycle')}</span>
                            <span className="text-xs font-mono">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function SterilizationPage() {
    const { t } = useLanguage();
    const [sets, setSets] = useLocalStorage<InstrumentSet[]>('sterilization_sets', generateInitialSets());
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
    
    const cleaningSets = useMemo(() => sets.filter(s => s.status === 'cleaning'), [sets]);
    const packagingSets = useMemo(() => sets.filter(s => s.status === 'packaging'), [sets]);
    const sterilizingSets = useMemo(() => sets.filter(s => s.status === 'sterilizing'), [sets]);
    const storageSets = useMemo(() => sets.filter(s => s.status === 'storage'), [sets]);

    return (
        <div className="flex flex-col h-screen bg-secondary/40">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.sterilization')}</h1>
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

            <main className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 overflow-auto">
                <StageColumn icon={SprayCan} title={t('sterilization.stage1')} sets={cleaningSets} />
                <StageColumn icon={Package} title={t('sterilization.stage2')} sets={packagingSets} />
                <StageColumn icon={Wind} title={t('sterilization.stage3')} sets={sterilizingSets} />
                <StageColumn icon={Archive} title={t('sterilization.stage4')} sets={storageSets} />
            </main>
        </div>
    );
}

function StageColumn({ icon: Icon, title, sets }: { icon: React.ElementType, title: string, sets: InstrumentSet[] }) {
    const { t } = useLanguage();
    return (
        <div className="bg-card rounded-lg flex flex-col p-2">
            <h2 className="font-bold p-2 flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {title} ({sets.length})</h2>
            <div className="flex-grow overflow-y-auto">
                {sets.length > 0 ? (
                    sets.map(s => <InstrumentCard key={s.id} instrument={s} />)
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">{t('sterilization.empty')}</div>
                )}
            </div>
        </div>
    );
}
