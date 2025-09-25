
'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Beaker, PlusCircle, Trash2, Calculator, X, User } from 'lucide-react';
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

type LabTest = {
    id: string;
    name: string;
    price: number;
};

const initialLabTests: LabTest[] = [
  { id: '1', name: 'Complete Blood Count (CBC)', price: 15000 },
  { id: '2', name: 'Lipid Profile', price: 25000 },
  { id: '3', name: 'Liver Function Tests (LFT)', price: 30000 },
  { id: '4', name: 'Kidney Function Tests (KFT)', price: 20000 },
  { id: '5', name: 'Thyroid Stimulating Hormone (TSH)', price: 18000 },
  { id: '6', name: 'Blood Sugar (Fasting & PP)', price: 10000 },
  { id: '7', name: 'Urine Analysis', price: 5000 },
  { id: '8', name: 'Vitamin D', price: 40000 },
  { id: '9', name: 'HbA1c', price: 20000 },
  { id: '10', name: 'Serum Ferritin', price: 25000 },
];

export default function LaboratoriesPage() {
    const { t } = useLanguage();
    const [tests, setTests] = useLocalStorage<LabTest[]>('lab_tests_list', initialLabTests);
    const { patients, addFinancialRecord } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const { toast } = useToast();

    const filteredTests = useMemo(() => {
        return tests.filter(test => test.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tests, searchTerm]);

    const totalCost = useMemo(() => {
        return selectedTests.reduce((total, test) => total + test.price, 0);
    }, [selectedTests]);

    const handleSelectTest = (test: LabTest) => {
        setSelectedTests(prev => [...prev, test]);
    };

    const handleRemoveSelectedTest = (testId: string) => {
        setSelectedTests(prev => prev.filter(t => t.id !== testId));
    };

    const handleConfirmOrder = () => {
        if (!selectedPatientId) {
            toast({ title: t('lab.selectPatientError'), variant: 'destructive'});
            return;
        }
        if (selectedTests.length === 0) {
            toast({ title: t('lab.noTestsSelectedError'), variant: 'destructive'});
            return;
        }

        selectedTests.forEach(test => {
            addFinancialRecord(selectedPatientId, {
                type: 'lab',
                description: `${t('lab.test')}: ${test.name}`,
                amount: test.price,
                date: new Date().toISOString(),
            });
        });
        
        toast({ title: t('lab.orderConfirmed')});
        setSelectedTests([]);
        setSelectedPatientId(null);
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.laboratories')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationsButton />
                    <UserMenu />
                </div>
            </header>

            <main className="flex-grow grid md:grid-cols-3 gap-4 p-4 md:p-8">
                <Card className="md:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('lab.testList')}</CardTitle>
                        <Input
                            placeholder={t('lab.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('lab.testName')}</TableHead>
                                        <TableHead className="text-right">{t('lab.price')}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTests.map((test) => (
                                        <TableRow key={test.id}>
                                            <TableCell>{test.name}</TableCell>
                                            <TableCell className="text-right" dir="ltr">{test.price.toLocaleString()} {t('lab.iqd')}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" onClick={() => handleSelectTest(test)}>
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
                            {t('lab.costCalculator')}
                        </CardTitle>
                         <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('lab.selectPatient')} />
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
                            {selectedTests.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">{t('lab.noTestsSelected')}</div>
                            ) : (
                                <div className="divide-y">
                                    {selectedTests.map((test, index) => (
                                        <div key={`${test.id}-${index}`} className="flex justify-between items-center p-3">
                                            <span className="text-sm">{test.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono">{test.price.toLocaleString()}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveSelectedTest(test.id)}>
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
                            <span>{t('lab.totalCost')}:</span>
                            <span dir="ltr">{totalCost.toLocaleString()} {t('lab.iqd')}</span>
                        </div>
                        <Button className="w-full" onClick={handleConfirmOrder} disabled={!selectedPatientId || selectedTests.length === 0}>
                            {t('lab.confirmOrder')}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
