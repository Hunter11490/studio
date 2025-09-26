'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Patient, FinancialRecord } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calculator, User, Search, FileText, PlusCircle, MinusCircle, DollarSign, Maximize, Minimize, Loader2, Printer, FileDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { translations } from '@/lib/localization';
import { NotificationsButton } from '@/components/notifications-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReactToPrint } from 'react-to-print';

const calculateBalance = (records: FinancialRecord[] = []) => {
    return records.reduce((acc, record) => acc + record.amount, 0);
};

export default function AccountsPage() {
    const { t } = useLanguage();
    const { patients, addFinancialRecord } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (selectedPatient) {
            const updatedPatient = patients.find(p => p.id === selectedPatient.id);
            if (updatedPatient) {
                setSelectedPatient(updatedPatient);
            }
        }
    }, [patients, selectedPatient]);


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
        return patients
            .map(p => ({ ...p, balance: calculateBalance(p.financialRecords) }))
            .filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.balance - a.balance);
    }, [patients, searchTerm]);

    const handleAddPayment = (patientId: string, amount: number) => {
        if (amount <= 0) return;
        addFinancialRecord(patientId, {
            type: 'payment',
            description: t('accounts.paymentReceived'),
            amount: -amount,
        });
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.accounts')}</h1>
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

            <main className="flex-grow p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('accounts.patientBalances')}</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('accounts.searchPatient')}
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
                                        <TableHead>{t('reception.patientName')}</TableHead>
                                        <TableHead className="text-right">{t('accounts.balance')}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.map((patient) => (
                                        <TableRow key={patient.id} className={patient.balance > 0 ? 'bg-destructive/5' : ''}>
                                            <TableCell className="font-medium">{patient.patientName}</TableCell>
                                            <TableCell className="text-right font-mono" dir="ltr">
                                                {patient.balance.toLocaleString()} {t('lab.iqd')}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" onClick={() => setSelectedPatient(patient)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    {t('accounts.viewDetails')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>

            <PatientInvoiceDialog 
                patient={selectedPatient} 
                onOpenChange={() => setSelectedPatient(null)}
                onAddPayment={handleAddPayment}
            />
        </div>
    );
}

const PrintableInvoice = React.forwardRef<HTMLDivElement, { patient: Patient; labels: Record<string, string> }>(({ patient, labels }, ref) => {
    const totalCharges = (patient.financialRecords || []).filter(r => r.amount > 0).reduce((acc, r) => acc + r.amount, 0);
    const totalPayments = (patient.financialRecords || []).filter(r => r.amount < 0).reduce((acc, r) => acc + Math.abs(r.amount), 0);
    const balanceDue = totalCharges - totalPayments;

    return (
        <div ref={ref} className="p-8 font-sans text-sm text-black bg-white">
            <div className="flex justify-between items-start pb-4 border-b">
                <div className="flex items-center gap-4">
                     <Logo className="h-16 w-16 text-black" />
                    <div>
                        <h1 className="text-2xl font-bold">{labels.hospitalName}</h1>
                        <p className="text-gray-500">{labels.appSubtitle}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase">{labels.invoiceTitle}</h2>
                    <p className="text-gray-500">{labels.invoiceDate}: {format(new Date(), 'PPP')}</p>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <div>
                    <p className="font-bold">{labels.patientName}</p>
                    <p>{patient.patientName}</p>
                    <p>{patient.address?.governorate}, {patient.address?.region}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold">{labels.patientId}</p>
                    <p>{patient.id.slice(-10)}</p>
                </div>
            </div>
            
            <div className="mt-8">
                <table className="w-full text-left">
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
            </div>

            <div className="flex justify-end mt-8">
                <div className="w-1/2">
                    <div className="flex justify-between p-2 bg-gray-100">
                        <span className="font-bold">{labels.totalCharges}</span>
                        <span className="font-mono">{totalCharges.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2">
                        <span className="font-bold">{labels.totalPayments}</span>
                        <span className="font-mono">{totalPayments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-200 font-bold text-lg">
                        <span>{labels.balanceDue}</span>
                        <span className="font-mono">{balanceDue.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-16 pt-4 border-t text-center text-xs text-gray-500">
                <p>{labels.footerNotes}</p>
            </div>
        </div>
    );
});
PrintableInvoice.displayName = 'PrintableInvoice';


function PatientInvoiceDialog({ patient, onOpenChange, onAddPayment }: { patient: Patient | null; onOpenChange: (open:boolean) => void; onAddPayment: (patientId: string, amount: number) => void; }) {
    const { t, lang } = useLanguage();
    const [paymentAmount, setPaymentAmount] = useState('');
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = useReactToPrint({
        content: () => invoiceRef.current,
        documentTitle: `Invoice-${patient?.patientName}-${new Date().toISOString().split('T')[0]}`,
        onAfterPrint: () => setIsPrinting(false),
    });
    
    const triggerPrint = () => {
      setIsPrinting(true);
      handlePrint();
    }


    const labels = {
        invoiceTitle: t('accounts.invoiceTitle'),
        patientName: t('reception.patientName'),
        patientId: t('accounts.patientId'),
        invoiceDate: t('accounts.invoiceDate'),
        totalCharges: t('accounts.totalCharges'),
        totalPayments: t('accounts.totalPayments'),
        balanceDue: t('accounts.balanceDue'),
        itemDescription: t('accounts.itemDescription'),
        date: t('accounts.date'),
        amount: t('accounts.amount'),
        iqd: t('lab.iqd'),
        summary: t('accounts.summary'),
        footerNotes: t('accounts.footerNotes'),
        hospitalName: t('appName'),
        appSubtitle: t('appSubtitle'),
    };
    
    if (!patient) return null;

    const balance = calculateBalance(patient.financialRecords);

    const handlePaymentSubmit = () => {
        const amount = parseFloat(paymentAmount);
        if (!isNaN(amount) && amount > 0) {
            onAddPayment(patient.id, amount);
            setPaymentAmount('');
        }
    };

    return (
        <>
            <Dialog open={!!patient} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('accounts.invoiceFor')} {patient.patientName}</DialogTitle>
                        <DialogDescription>{t('accounts.invoiceDesc')}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[50vh] my-4 pr-4">
                        <div className="space-y-2">
                            {(patient.financialRecords || []).map(record => (
                                <div key={record.id} className="flex justify-between items-center p-2 rounded-md bg-secondary/50">
                                    <div>
                                        <p className="font-medium">{record.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(record.date), 'PPP', { locale: lang === 'ar' ? ar : undefined })}
                                        </p>
                                    </div>
                                    <Badge variant={record.amount > 0 ? 'destructive' : 'success'} className="font-mono">
                                        {record.amount.toLocaleString()} {t('lab.iqd')}
                                    </Badge>
                                </div>
                            ))}
                            {(!patient.financialRecords || patient.financialRecords.length === 0) && (
                                <p className="text-center text-muted-foreground py-8">{t('accounts.noRecords')}</p>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="flex-col items-start gap-4 border-t pt-4">
                        <div className="w-full flex justify-between font-bold text-lg">
                            <span>{t('accounts.totalBalance')}:</span>
                            <span className="font-mono" dir="ltr">{balance.toLocaleString()} {t('lab.iqd')}</span>
                        </div>
                        <div className="w-full space-y-2">
                            <Label htmlFor="payment">{t('accounts.addPayment')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="payment"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder={t('accounts.paymentAmount')}
                                />
                                <Button onClick={handlePaymentSubmit} disabled={!paymentAmount}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    {t('accounts.addPayment')}
                                </Button>
                            </div>
                        </div>
                        <Button onClick={triggerPrint} disabled={isPrinting} className="w-full" variant="outline">
                            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                            {t('accounts.exportPdf')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden printable component */}
             <div className="hidden">
                {patient && <PrintableInvoice ref={invoiceRef} patient={patient} labels={labels} />}
            </div>
        </>
    );
}

// Add new translations
Object.assign(translations.en, {
    accounts: {
        patientBalances: "Patient Balances",
        searchPatient: "Search for a patient...",
        balance: "Balance",
        viewDetails: "Details",
        invoiceFor: "Invoice for",
        invoiceDesc: "A detailed list of all financial transactions for this patient.",
        noRecords: "No financial records for this patient yet.",
        totalBalance: "Total Balance",
        addPayment: "Add Payment",
        paymentAmount: "Payment Amount",
        paymentReceived: "Payment Received",
        exportPdf: "Export as PDF",
        generatingInvoice: "Generating the invoice...",
        invoiceTitle: "Patient Invoice",
        patientId: "Patient ID",
        invoiceDate: "Invoice Date",
        totalCharges: "Total Charges",
        totalPayments: "Total Payments",
        balanceDue: "Balance Due",
        itemDescription: "Item/Service Description",
        date: "Date",
        amount: "Amount",
        summary: "Account Summary",
        footerNotes: "Thank you for choosing our hospital. Please settle the balance at your earliest convenience."
    }
});

Object.assign(translations.ar, {
    accounts: {
        patientBalances: "أرصدة المرضى",
        searchPatient: "ابحث عن مريض...",
        balance: "الرصيد",
        viewDetails: "تفاصيل",
        invoiceFor: "فاتورة المريض",
        invoiceDesc: "قائمة مفصلة بجميع المعاملات المالية لهذا المريض.",
        noRecords: "لا توجد سجلات مالية لهذا المريض بعد.",
        totalBalance: "الرصيد الإجمالي",
        addPayment: "إضافة دفعة",
        paymentAmount: "مبلغ الدفعة",
        paymentReceived: "دفعة مستلمة",
        exportPdf: "تصدير كملف PDF",
        generatingInvoice: "جاري إعداد الفاتورة...",
        invoiceTitle: "فاتورة مريض",
        patientId: "رقم المريض",
        invoiceDate: "تاريخ الفاتورة",
        totalCharges: "إجمالي المطلوبات",
        totalPayments: "إجمالي المدفوعات",
        balanceDue: "الرصيد المستحق",
        itemDescription: "وصف الخدمة/المنتج",
        date: "التاريخ",
        amount: "المبلغ",
        summary: "ملخص الحساب",
        footerNotes: "شكراً لاختياركم مستشفانا. يرجى تسوية المبلغ المستحق في أقرب وقت ممكن."
    }
});
