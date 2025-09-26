'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { Patient, FinancialRecord } from '@/types';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter as DialogFooterComponent } from '@/components/ui/dialog';
import { Maximize, Minimize, Search, User, FileClock, FileDown, CalendarDays, Calendar, X } from 'lucide-react';
import { format, differenceInYears, parseISO, isValid, isSameDay, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { ar } from 'date-fns/locale';
import { NotificationsButton } from '@/components/notifications-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { translations } from '@/lib/localization';


const calculateBalance = (records: FinancialRecord[] = []) => {
    return records.reduce((acc, record) => acc + record.amount, 0);
};

export default function MedicalRecordsPage() {
    const { t, lang } = useLanguage();
    const { patients } = usePatients();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const { toast } = useToast();

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
            (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [patients, searchTerm]);
    
    const formatDataForExport = (data: Patient[]) => {
      if (data.length === 0) {
        toast({ title: t('medicalRecords.noDataToExport'), variant: 'destructive'});
        return null;
      }

      return data.map(p => {
        const balance = calculateBalance(p.financialRecords);
        let age: number | string = 'N/A';
        if (p.dob?.year && p.dob?.month && p.dob?.day) {
            const dobString = `${p.dob.year}-${p.dob.month}-${p.dob.day}`;
            const dobDate = parseISO(dobString);
            if (isValid(dobDate)) {
                const calculatedAge = differenceInYears(new Date(), dobDate);
                if (!isNaN(calculatedAge)) {
                    age = calculatedAge;
                }
            }
        }
        return {
          [t('reception.patientName')]: p.patientName,
          [t('reception.age')]: age,
          [t('reception.assignDepartment')]: t(`departments.${p.department}`),
          [t('reception.receptionDate')]: format(new Date(p.createdAt), 'yyyy-MM-dd'),
          [t('accounts.balance')]: balance
        };
      });
    };

    const handleExport = (data: Patient[], filename: string) => {
        const formattedData = formatDataForExport(data);
        if(formattedData) {
            exportToExcel(formattedData, filename);
            toast({ title: t('toasts.exportSuccess') });
        }
    }

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
                                        if (patient.dob?.year && patient.dob?.month && patient.dob?.day) {
                                            const dobString = `${patient.dob.year}-${patient.dob.month}-${patient.dob.day}`;
                                            const dobDate = parseISO(dobString);
                                            if (isValid(dobDate)) {
                                                const calculatedAge = differenceInYears(new Date(), dobDate);
                                                if (!isNaN(calculatedAge)) {
                                                    age = calculatedAge;
                                                }
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
                                                    <Button size="sm" variant="outline" onClick={() => setSelectedPatient(patient)}>
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

            <ExportReportsPopover allPatients={patients} onExport={handleExport} />
            
            <PatientHistoryDialog 
                patient={selectedPatient}
                onOpenChange={() => setSelectedPatient(null)}
            />
        </div>
    );
}


function PatientHistoryDialog({ patient, onOpenChange }: { patient: Patient | null; onOpenChange: (open: boolean) => void; }) {
    const { t, lang } = useLanguage();
    if (!patient) return null;

    const balance = calculateBalance(patient.financialRecords);

    return (
        <Dialog open={!!patient} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('medicalRecords.patientHistoryFor')} {patient.patientName}</DialogTitle>
                    <DialogDescription>{t('accounts.invoiceDesc')}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] my-4 pr-4">
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
                <DialogFooterComponent className="flex-col items-start gap-2 border-t pt-4">
                    <div className="w-full flex justify-between font-bold text-lg">
                        <span>{t('accounts.totalBalance')}:</span>
                        <span className="font-mono" dir="ltr">{balance.toLocaleString()} {t('lab.iqd')}</span>
                    </div>
                     <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        {t('common.close')}
                    </Button>
                </DialogFooterComponent>
            </DialogContent>
        </Dialog>
    );
}

function ExportReportsPopover({ allPatients, onExport }: { allPatients: Patient[], onExport: (data: Patient[], filename: string) => void }) {
    const { t } = useLanguage();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
    const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();

    const years = useMemo(() => Array.from(new Set(allPatients.map(p => getYear(new Date(p.createdAt))))).sort((a,b) => b-a), [allPatients]);
    const months = Array.from({length: 12}, (_, i) => i);
    
    const handleDailyExport = () => {
        if (!selectedDate) return;
        const dailyData = allPatients.filter(p => isSameDay(new Date(p.createdAt), selectedDate));
        onExport(dailyData, `Daily_Report_${format(selectedDate, 'yyyy-MM-dd')}.xlsx`);
    }

    const handleMonthlyExport = () => {
        const monthlyData = allPatients.filter(p => {
            const d = new Date(p.createdAt);
            return getYear(d) === selectedYear && getMonth(d) === selectedMonth;
        });
        onExport(monthlyData, `Monthly_Report_${selectedYear}_${String(selectedMonth+1).padStart(2,'0')}.xlsx`);
    }

    const handlePatientExport = () => {
        if (!selectedPatientId) return;
        const patientData = allPatients.filter(p => p.id === selectedPatientId);
        onExport(patientData, `Patient_Report_${patientData[0]?.patientName || 'ID'}.xlsx`);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg">
                    <FileDown className="h-6 w-6" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{t('medicalRecords.exportReports')}</h4>
                        <p className="text-sm text-muted-foreground">{t('medicalRecords.exportDesc')}</p>
                    </div>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>{t('medicalRecords.exportDaily')}</Label>
                            <div className="flex gap-2">
                                <CalendarPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                                <Button onClick={handleDailyExport} className="h-auto"><FileDown className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('medicalRecords.exportMonthly')}</Label>
                            <div className="flex gap-2">
                                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => <SelectItem key={m} value={String(m)}>{format(setMonth(new Date(), m), 'MMMM')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleMonthlyExport} className="h-auto"><FileDown className="h-4 w-4" /></Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>{t('medicalRecords.exportPatient')}</Label>
                            <div className="flex gap-2">
                                <Select onValueChange={setSelectedPatientId}>
                                    <SelectTrigger><SelectValue placeholder={t('medicalRecords.selectPatientPlaceholder')} /></SelectTrigger>
                                    <SelectContent>
                                        {allPatients.map(p => <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handlePatientExport} disabled={!selectedPatientId} className="h-auto"><FileDown className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Add new translations
Object.assign(translations.en.medicalRecords, {
    title: "Medical Records",
    description: "Search and manage the central patient archive.",
    searchPlaceholder: "Search by patient name, ID, or phone number...",
    fullName: "Full Name",
    age: "Age",
    sex: "Sex",
    firstAdmission: "First Admission",
    lastVisit: "Last Visit",
    noRecords: "No patient records found.",
    viewHistory: "View History",
    patientHistoryFor: "Patient History for",
    exportReports: "Export Reports",
    exportDesc: "Export patient data to Excel.",
    exportDaily: "Export Daily Report",
    exportMonthly: "Export Monthly Report",
    exportPatient: "Export Patient Report",
    selectPatientPlaceholder: "Select a patient to export",
    noDataToExport: "No data found for the selected criteria."
});

Object.assign(translations.ar.medicalRecords, {
    title: "السجلات الطبية",
    description: "ابحث وأدر الأرشيف المركزي للمرضى.",
    searchPlaceholder: "ابحث بالاسم، الرقم التعريفي، أو رقم الهاتف...",
    fullName: "الاسم الكامل",
    age: "العمر",
    sex: "الجنس",
    firstAdmission: "أول دخول",
    lastVisit: "آخر زيارة",
    noRecords: "لا توجد سجلات مرضى.",
    viewHistory: "عرض السجل",
    patientHistoryFor: "السجل المرضي للمريض",
    exportReports: "تصدير التقارير",
    exportDesc: "تصدير بيانات المرضى إلى ملف إكسل.",
    exportDaily: "تصدير تقرير يومي",
    exportMonthly: "تصدير تقرير شهري",
    exportPatient: "تصدير تقرير مريض",
    selectPatientPlaceholder: "اختر مريضاً للتصدير",
    noDataToExport: "لا توجد بيانات للمعايير المحددة."
});
