'use client';

import { useState, useMemo } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Patient, FinancialRecord } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calculator, User, Search, FileText, PlusCircle, MinusCircle, DollarSign } from 'lucide-react';

const calculateBalance = (records: FinancialRecord[] = []) => {
    return records.reduce((acc, record) => acc + record.amount, 0);
};

export default function AccountsPage() {
    const { t } = useLanguage();
    const { patients, addFinancialRecord } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const filteredPatients = useMemo(() => {
        return patients
            .map(p => ({ ...p, balance: calculateBalance(p.financialRecords) }))
            .filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.balance - a.balance); // Sort by highest balance first
    }, [patients, searchTerm]);

    const handleAddPayment = (patientId: string, amount: number) => {
        if (amount <= 0) return;
        addFinancialRecord(patientId, {
            type: 'payment',
            description: t('accounts.paymentReceived'),
            amount: -amount, // Payments are negative
            date: new Date().toISOString(),
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
                <div className="flex items-center gap-4">
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

function PatientInvoiceDialog({ patient, onOpenChange, onAddPayment }: { patient: Patient | null; onOpenChange: () => void; onAddPayment: (patientId: string, amount: number) => void; }) {
    const { t, lang } = useLanguage();
    const [paymentAmount, setPaymentAmount] = useState('');
    
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
                <CardFooter className="flex-col items-start gap-4 border-t pt-4">
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
                </CardFooter>
            </DialogContent>
        </Dialog>
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
    }
});
