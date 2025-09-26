'use client';

import { useState, useMemo } from 'react';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scan, PlusCircle, Trash2, Calculator, X, User, Maximize, Minimize } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePatients } from '@/hooks/use-patients';
import { Patient } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { NotificationsButton } from '@/components/notifications-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type RadiologyService = {
    id: string;
    name: string;
    price: number;
};

const initialRadiologyServices: RadiologyService[] = [
    // X-Ray
    { id: 'xray_chest', name: 'Chest X-Ray (PA/Lateral)', price: 25000 },
    { id: 'xray_abdomen', name: 'Abdominal X-Ray (Supine)', price: 20000 },
    { id: 'xray_spine', name: 'Spinal X-Ray (Cervical/Thoracic/Lumbar)', price: 35000 },
    { id: 'xray_skull', name: 'Skull X-Ray', price: 30000 },
    { id: 'xray_extremity', name: 'Extremity X-Ray (Hand/Foot/etc.)', price: 20000 },
    { id: 'xray_pelvis', name: 'Pelvis X-Ray', price: 25000 },
    { id: 'xray_kub', name: 'KUB X-Ray (Kidneys, Ureters, Bladder)', price: 25000 },

    // Ultrasound
    { id: 'us_abdomen', name: 'Abdominal Ultrasound', price: 40000 },
    { id: 'us_pelvic', name: 'Pelvic Ultrasound', price: 40000 },
    { id: 'us_obstetric', name: 'Obstetric Ultrasound (Pregnancy)', price: 50000 },
    { id: 'us_thyroid', name: 'Thyroid Ultrasound', price: 35000 },
    { id: 'us_renal', name: 'Renal (Kidney) Ultrasound', price: 40000 },
    { id: 'us_doppler', name: 'Doppler Ultrasound (Vascular)', price: 75000 },
    { id: 'us_musculoskeletal', name: 'Musculoskeletal Ultrasound', price: 50000 },
    { id: 'us_breast', name: 'Breast Ultrasound', price: 45000 },
    { id: 'us_cardiac', name: 'Echocardiogram (Cardiac Ultrasound)', price: 100000 },

    // CT Scan
    { id: 'ct_head', name: 'CT Scan - Head/Brain', price: 125000 },
    { id: 'ct_chest', name: 'CT Scan - Chest', price: 150000 },
    { id: 'ct_abdomen_pelvis', name: 'CT Scan - Abdomen & Pelvis', price: 200000 },
    { id: 'ct_angiography', name: 'CT Angiography (CTA)', price: 250000 },
    { id: 'ct_spine', name: 'CT Scan - Spine', price: 175000 },
    { id: 'ct_with_contrast', name: 'CT Scan with IV Contrast', price: 225000 },

    // MRI
    { id: 'mri_brain', name: 'MRI - Brain', price: 250000 },
    { id: 'mri_spine', name: 'MRI - Spine (Cervical/Lumbar)', price: 300000 },
    { id: 'mri_knee', name: 'MRI - Knee', price: 225000 },
    { id: 'mri_abdomen', name: 'MRI - Abdomen', price: 350000 },
    { id: 'mra', name: 'MR Angiography (MRA)', price: 400000 },
    { id: 'mri_with_contrast', name: 'MRI with Contrast (Gadolinium)', price: 450000 },

    // Other Procedures
    { id: 'mammogram', name: 'Mammography', price: 60000 },
    { id: 'bone_densitometry', name: 'Bone Densitometry (DEXA Scan)', price: 70000 },
    { id: 'barium_swallow', name: 'Barium Swallow/Meal', price: 80000 },
    { id: 'ivp', name: 'Intravenous Pyelogram (IVP)', price: 100000 },
];

export default function RadiologyPage() {
    const { t } = useLanguage();
    const [services, setServices] = useLocalStorage<RadiologyService[]>('radiology_services_list_v1', initialRadiologyServices);
    const { patients, addFinancialRecord } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedServices, setSelectedServices] = useState<RadiologyService[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const { toast } = useToast();
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

    const filteredServices = useMemo(() => {
        return services.filter(service => service.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [services, searchTerm]);

    const totalCost = useMemo(() => {
        return selectedServices.reduce((total, service) => total + service.price, 0);
    }, [selectedServices]);

    const handleSelectService = (service: RadiologyService) => {
        setSelectedServices(prev => [...prev, service]);
    };

    const handleRemoveSelectedService = (serviceId: string) => {
        setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
    };

    const handleConfirmOrder = () => {
        if (!selectedPatientId) {
            toast({ title: t('radiology.selectPatientError'), variant: 'destructive'});
            return;
        }
        if (selectedServices.length === 0) {
            toast({ title: t('radiology.noServicesSelectedError'), variant: 'destructive'});
            return;
        }

        selectedServices.forEach(service => {
            addFinancialRecord(selectedPatientId, {
                type: 'lab', // Using 'lab' as a generic type for billable items
                description: `${t('radiology.procedure')}: ${service.name}`,
                amount: service.price,
                date: new Date().toISOString(),
            });
        });
        
        toast({ title: t('radiology.orderConfirmed')});
        setSelectedServices([]);
        setSelectedPatientId(null);
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.radiology')}</h1>
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

            <main className="flex-grow grid md:grid-cols-3 gap-4 p-4 md:p-8">
                <Card className="md:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('radiology.serviceList')}</CardTitle>
                        <Input
                            placeholder={t('radiology.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('radiology.serviceName')}</TableHead>
                                        <TableHead className="text-right">{t('radiology.price')}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell>{service.name}</TableCell>
                                            <TableCell className="text-right" dir="ltr">{service.price.toLocaleString()} {t('radiology.iqd')}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" onClick={() => handleSelectService(service)}>
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    {t('common.add')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            {t('radiology.costCalculator')}
                        </CardTitle>
                         <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('radiology.selectPatient')} />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                         <ScrollArea className="h-[calc(100vh-380px)]">
                            {selectedServices.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">{t('radiology.noServicesSelected')}</div>
                            ) : (
                                <div className="divide-y">
                                    {selectedServices.map((service, index) => (
                                        <div key={`${service.id}-${index}`} className="flex justify-between items-center p-3">
                                            <span className="text-sm">{service.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono">{service.price.toLocaleString()}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveSelectedService(service.id)}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex-col items-start border-t pt-4 gap-4">
                        <div className="w-full flex justify-between font-bold text-lg">
                            <span>{t('radiology.totalCost')}:</span>
                            <span dir="ltr">{totalCost.toLocaleString()} {t('radiology.iqd')}</span>
                        </div>
                        <Button className="w-full" onClick={handleConfirmOrder} disabled={!selectedPatientId || selectedServices.length === 0}>
                            {t('radiology.confirmOrder')}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
