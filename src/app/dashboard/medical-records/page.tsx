'use client';

import { useState, useMemo, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { Patient, FinancialRecord } from '@/types';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter as DialogFooterComponent } from '@/components/ui/dialog';
import { Maximize, Minimize, Search, FileClock, FileDown, CalendarDays, Calendar, X, Heart, Rib, Activity, Wind, Thermometer, User, Stethoscope } from 'lucide-react';
import { format, differenceInYears, parseISO, isValid, isSameDay, getMonth, getYear, setMonth } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useDoctors } from '@/hooks/use-doctors';
import { StethoscopeLogo } from '@/components/stethoscope-logo';


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
    const [statusFilter, setStatusFilter] = useState<'admitted' | 'discharged'>('admitted');

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
        return patients.filter(p => {
          const searchMatch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()));
          
          if (!searchMatch) return false;

          if (statusFilter === 'admitted') {
            return p.status !== 'Discharged';
          }
          if (statusFilter === 'discharged') {
            return p.status === 'Discharged';
          }
          return false;
        }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [patients, searchTerm, statusFilter]);
    
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
                age = differenceInYears(new Date(), dobDate);
            }
        }
        return {
          [t('reception.patientName')]: p.patientName,
          [t('reception.age')]: age,
          [t('reception.assignDepartment')]: t(`departments.${p.department}`),
          [t('reception.receptionDate')]: format(new Date(p.createdAt), 'yyyy-MM-dd'),
          [t('accounts.balance')]: balance,
          [t('medicalRecords.dischargeDate')]: p.dischargedAt ? format(new Date(p.dischargedAt), 'yyyy-MM-dd') : 'N/A',
          [t('medicalRecords.dischargeStatus.title')]: p.dischargeStatus ? t(`medicalRecords.dischargeStatus.${p.dischargeStatus}`) : 'N/A'
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
                        <div className="mt-2 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('medicalRecords.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)} className="w-full sm:w-auto">
                              <TabsList>
                                <TabsTrigger value="admitted">{t('medicalRecords.status.admitted')}</TabsTrigger>
                                <TabsTrigger value="discharged">{t('medicalRecords.status.discharged')}</TabsTrigger>
                              </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-280px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('medicalRecords.fullName')}</TableHead>
                                        <TableHead>{t('medicalRecords.age')}</TableHead>
                                        <TableHead>{statusFilter === 'admitted' ? t('medicalRecords.lastVisit') : t('medicalRecords.dischargeDate')}</TableHead>
                                        <TableHead>{t('medicalRecords.status.title')}</TableHead>
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
                                                age = differenceInYears(new Date(), dobDate);
                                            }
                                        }

                                        return (
                                            <TableRow key={patient.id}>
                                                <TableCell className="font-medium">{patient.patientName}</TableCell>
                                                <TableCell>{age}</TableCell>
                                                <TableCell>
                                                    {statusFilter === 'admitted' 
                                                      ? format(new Date(patient.createdAt), 'PPP', { locale: lang === 'ar' ? ar : undefined })
                                                      : patient.dischargedAt ? format(new Date(patient.dischargedAt), 'PPP', { locale: lang === 'ar' ? ar : undefined }) : 'N/A'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                  <Badge variant={patient.dischargeStatus === 'deceased' ? 'destructive' : 'secondary'}>
                                                    {statusFilter === 'admitted' ? t(`departments.${patient.department}`) : (patient.dischargeStatus ? t(`medicalRecords.dischargeStatus.${patient.dischargeStatus}`) : 'N/A')}
                                                  </Badge>
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
                                            <TableCell colSpan={5} className="h-24 text-center">
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

const PrintableReport = React.forwardRef<HTMLDivElement, { patient: Patient, labels: Record<string, string>, doctors: any[] }>(({ patient, labels, doctors }, ref) => {
    const { lang } = useLanguage();
    const balance = calculateBalance(patient.financialRecords);

    let age: number | string = 'N/A';
    if (patient.dob?.year && patient.dob?.month && patient.dob?.day) {
        const dobString = `${patient.dob.year}-${patient.dob.month}-${patient.dob.day}`;
        const dobDate = parseISO(dobString);
        if (isValid(dobDate)) {
            age = differenceInYears(new Date(), dobDate);
        }
    }
    
    const attendingDoctor = doctors.find(d => d.id === patient.attendingDoctorId);

    return (
        <div ref={ref} className="p-8 font-sans text-sm text-black bg-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
             <div className="flex justify-between items-start pb-4 border-b">
                <div className="flex items-center gap-4">
                     <Logo className="h-16 w-16 text-black" />
                    <div>
                        <h1 className="text-2xl font-bold">{labels.hospitalName}</h1>
                        <p className="text-gray-500">{labels.appSubtitle}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase">{labels.patientReport}</h2>
                    <p className="text-gray-500">{labels.reportDate}: {format(new Date(), 'PPP')}</p>
                </div>
            </div>
            
            <div className="mt-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{labels.patientInfo}</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">{labels.patientName}:</span><span className="font-medium">{patient.patientName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">{labels.patientId}:</span><span className="font-medium">{patient.id.slice(-10)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">{labels.age}:</span><span className="font-medium">{age}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">{labels.address}:</span><span className="font-medium">{patient.address?.governorate}, {patient.address?.region}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">{labels.admissionDate}:</span><span className="font-medium">{format(new Date(patient.createdAt), 'PPP p')}</span></div>
                    {patient.dischargedAt && (
                      <>
                        <div className="flex justify-between"><span className="text-gray-600">{labels.dischargeDate}:</span><span className="font-medium">{format(new Date(patient.dischargedAt), 'PPP p')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">{labels.dischargeStatus}:</span><span className="font-medium">{patient.dischargeStatus === 'deceased' ? labels.deceased : labels.recovered}</span></div>
                      </>
                    )}
                    {attendingDoctor && <div className="flex justify-between"><span className="text-gray-600">{labels.attendingPhysician}:</span><span className="font-medium">{attendingDoctor.name}</span></div>}
                </div>
            </div>

            {patient.vitalSigns && 
              <div className="mt-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{labels.vitals}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-gray-100">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Heart className="h-3 w-3"/> {labels.hr}</p>
                        <p className="font-bold text-lg">{patient.vitalSigns.heartRate}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-100">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Activity className="h-3 w-3"/> {labels.bp}</p>
                        <p className="font-bold text-lg">{patient.vitalSigns.bloodPressure}</p>
                    </div>
                     <div className="p-2 rounded-lg bg-gray-100">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Wind className="h-3 w-3"/> {labels.spo2}</p>
                        <p className="font-bold text-lg">{patient.vitalSigns.spo2}%</p>
                     </div>
                     <div className="p-2 rounded-lg bg-gray-100">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Thermometer className="h-3 w-3"/> {labels.temp}</p>
                        <p className="font-bold text-lg">{patient.vitalSigns.temperature.toFixed(1)}°C</p>
                     </div>
                </div>
              </div>
            }
            
            <div className="mt-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{labels.financialSummary}</h3>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2">{labels.date}</th>
                            <th className="p-2">{labels.itemDescription}</th>
                            <th className="p-2 text-right">{labels.amount} ({labels.iqd})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(patient.financialRecords || []).map(record => (
                            <tr key={record.id} className="border-b">
                                <td className="p-2">{format(new Date(record.date), 'yyyy-MM-dd')}</td>
                                <td className="p-2">{record.description}</td>
                                <td className="p-2 text-right font-mono">{record.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-end mt-4">
                  <div className="w-1/2">
                    <div className="flex justify-between p-2 font-bold text-base bg-gray-200">
                        <span>{labels.balanceDue}</span>
                        <span className="font-mono">{balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    );
});
PrintableReport.displayName = 'PrintableReport';


function PatientHistoryDialog({ patient, onOpenChange }: { patient: Patient | null; onOpenChange: (open: boolean) => void; }) {
    const { t, lang } = useLanguage();
    const { doctors } = useDoctors();
    const [isPrinting, setIsPrinting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    if (!patient) return null;

    const balance = calculateBalance(patient.financialRecords);

    const labels = {
        patientReport: t('medicalRecords.patientReport'),
        reportDate: t('medicalRecords.reportDate'),
        patientInfo: t('medicalRecords.patientInfo'),
        patientName: t('reception.patientName'),
        patientId: t('accounts.patientId'),
        age: t('reception.age'),
        address: t('reception.address'),
        admissionDate: t('medicalRecords.admissionDate'),
        dischargeDate: t('medicalRecords.dischargeDate'),
        dischargeStatus: t('medicalRecords.dischargeStatus.title'),
        recovered: t('medicalRecords.dischargeStatus.recovered'),
        deceased: t('medicalRecords.dischargeStatus.deceased'),
        attendingPhysician: t('wards.attendingPhysician'),
        vitals: t('medicalRecords.vitals'),
        hr: t('emergency.vitals.heartRate'),
        bp: t('emergency.vitals.bloodPressure'),
        spo2: t('emergency.vitals.spo2'),
        temp: t('emergency.vitals.temperature'),
        financialSummary: t('medicalRecords.financialSummary'),
        date: t('accounts.date'),
        itemDescription: t('accounts.itemDescription'),
        amount: t('accounts.amount'),
        balanceDue: t('accounts.balanceDue'),
        iqd: t('lab.iqd'),
        hospitalName: t('appName'),
        appSubtitle: t('appSubtitle'),
    };
    
    const handleExportPdf = async () => {
        if (!reportRef.current || !patient) return;
        setIsPrinting(true);
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', x, 0, imgWidth, imgHeight);
        pdf.save(`Report-${patient.patientName}-${new Date().toISOString().split('T')[0]}.pdf`);
        setIsPrinting(false);
    };

    return (
      <>
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
                    <div className="w-full flex gap-2">
                        <Button onClick={() => onOpenChange(false)} variant="secondary" className="flex-1">
                            <X className="mr-2 h-4 w-4" />
                            {t('common.close')}
                        </Button>
                        <Button onClick={handleExportPdf} disabled={isPrinting} className="flex-1" variant="outline">
                            {isPrinting ? <FileDown className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                            {t('accounts.exportPdf')}
                        </Button>
                    </div>
                </DialogFooterComponent>
            </DialogContent>
        </Dialog>
         <div className="fixed -left-[9999px] top-0">
            {patient && <PrintableReport ref={reportRef} patient={patient} labels={labels} doctors={doctors} />}
        </div>
      </>
    );
}

function ExportReportsPopover({ allPatients, onExport }: { allPatients: Patient[], onExport: (data: Patient[], filename: string) => void }) {
    const { t } = useLanguage();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

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
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg">
                                <FileDown className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('medicalRecords.exportReports')}</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
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
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Add new translations
Object.assign(translations.en, {
    medicalRecords: {
        title: "Medical Records",
        description: "Search and manage the central patient archive.",
        searchPlaceholder: "Search by patient name or ID...",
        fullName: "Full Name",
        age: "Age",
        sex: "Sex",
        firstAdmission: "First Admission",
        admissionDate: "Admission Date",
        lastVisit: "Last Visit",
        dischargeDate: "Discharge Date",
        noRecords: "No patient records found.",
        viewHistory: "View History",
        patientHistoryFor: "Patient History for",
        exportReports: "Export Reports",
        exportDesc: "Export patient data to Excel.",
        exportDaily: "Export Daily Report",
        exportMonthly: "Export Monthly Report",
        exportPatient: "Export Patient Report",
        selectPatientPlaceholder: "Select a patient to export",
        noDataToExport: "No data found for the selected criteria.",
        status: {
          title: "Status",
          all: "All",
          admitted: "Admitted",
          discharged: "Discharged"
        },
        dischargeStatus: {
          title: "Discharge Status",
          recovered: "Recovered",
          deceased: "Deceased"
        },
        patientReport: "Patient Medical Report",
        reportDate: "Report Date",
        patientInfo: "Patient Information",
        vitals: "Vital Signs",
        financialSummary: "Financial Summary",
    }
});

Object.assign(translations.ar, {
    medicalRecords: {
        title: "السجلات الطبية",
        description: "ابحث وأدر الأرشيف المركزي للمرضى.",
        searchPlaceholder: "ابحث بالاسم أو الرقم التعريفي...",
        fullName: "الاسم الكامل",
        age: "العمر",
        sex: "الجنس",
        firstAdmission: "تاريخ الدخول",
        admissionDate: "تاريخ الدخول",
        lastVisit: "آخر زيارة",
        dischargeDate: "تاريخ الخروج",
        noRecords: "لا توجد سجلات مرضى.",
        viewHistory: "عرض السجل",
        patientHistoryFor: "السجل المرضي للمريض",
        exportReports: "تصدير التقارير",
        exportDesc: "تصدير بيانات المرضى إلى ملف إكسل.",
        exportDaily: "تصدير تقرير يومي",
        exportMonthly: "تصدير تقرير شهري",
        exportPatient: "تصدير تقرير مريض",
        selectPatientPlaceholder: "اختر مريضاً للتصدير",
        noDataToExport: "لا توجد بيانات للمعايير المحددة.",
        status: {
          title: "الحالة",
          all: "الكل",
          admitted: "راقد",
          discharged: "مُخرَّج"
        },
        dischargeStatus: {
          title: "حالة الخروج",
          recovered: "معافى",
          deceased: "متوفى"
        },
        patientReport: "تقرير طبي للمريض",
        reportDate: "تاريخ التقرير",
        patientInfo: "معلومات المريض",
        vitals: "العلامات الحيوية",
        financialSummary: "الملخص المالي",
    }
});
