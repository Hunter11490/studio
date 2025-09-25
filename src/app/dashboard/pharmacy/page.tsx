
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pill, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type Drug = {
    id: string;
    name: string;
    quantity: number;
    price: number;
};

const formSchema = z.object({
  name: z.string().min(1, 'Drug name is required'),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
});

const initialDrugs: Drug[] = [
  { id: '1', name: 'Amoxicillin 500mg', quantity: 120, price: 5000 },
  { id: '2', name: 'Paracetamol 500mg', quantity: 300, price: 1000 },
  { id: '3', name: 'Ibuprofen 400mg', quantity: 250, price: 1500 },
  { id: '4', name: 'Lisinopril 10mg', quantity: 80, price: 7000 },
  { id: '5', name: 'Metformin 500mg', quantity: 150, price: 4000 },
  { id: '6', name: 'Atorvastatin 20mg', quantity: 95, price: 12000 },
  { id: '7', name: 'Amlodipine 5mg', quantity: 110, price: 6000 },
];

function DrugForm({ onSave, drugToEdit }: { onSave: (data: z.infer<typeof formSchema>) => void, drugToEdit?: Drug | null }) {
    const { t } = useLanguage();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            quantity: 0,
            price: 0,
        },
    });

    useEffect(() => {
        if (drugToEdit) {
            form.reset(drugToEdit);
        } else {
            form.reset({ name: '', quantity: 0, price: 0 });
        }
    }, [drugToEdit, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('pharmacy.drugName')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('pharmacy.quantity')}</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('pharmacy.price')}</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <DialogFooter>
                    <Button type="submit">{t('common.save')}</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function PharmacyPage() {
    const { t } = useLanguage();
    const [drugs, setDrugs] = useLocalStorage<Drug[]>('pharmacy_drugs', initialDrugs);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setFormOpen] = useState(false);
    const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);

    const filteredDrugs = useMemo(() => {
        return drugs.filter(drug => drug.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [drugs, searchTerm]);

    const handleSaveDrug = (data: z.infer<typeof formSchema>) => {
        if (drugToEdit) {
            // Edit
            setDrugs(prev => prev.map(d => d.id === drugToEdit.id ? { ...d, ...data } : d));
        } else {
            // Add
            const newDrug: Drug = { id: new Date().toISOString(), ...data };
            setDrugs(prev => [newDrug, ...prev]);
        }
        setFormOpen(false);
        setDrugToEdit(null);
    };
    
    const handleAddClick = () => {
        setDrugToEdit(null);
        setFormOpen(true);
    };

    const handleEditClick = (drug: Drug) => {
        setDrugToEdit(drug);
        setFormOpen(true);
    };

    const handleDeleteClick = (drugId: string) => {
        setDrugs(prev => prev.filter(d => d.id !== drugId));
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.pharmacy')}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <UserMenu />
                </div>
            </header>

            <main className="flex-grow p-4 md:p-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('pharmacy.inventory')}</CardTitle>
                        <Button onClick={handleAddClick}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('pharmacy.addDrug')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder={t('pharmacy.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-4"
                        />
                        <ScrollArea className="h-[calc(100vh-280px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('pharmacy.drugName')}</TableHead>
                                        <TableHead>{t('pharmacy.quantity')}</TableHead>
                                        <TableHead>{t('pharmacy.price')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDrugs.map((drug) => (
                                        <TableRow key={drug.id} className={drug.quantity < 10 ? 'bg-destructive/10' : ''}>
                                            <TableCell className="font-medium">{drug.name}</TableCell>
                                            <TableCell>{drug.quantity}</TableCell>
                                            <TableCell dir="ltr">{drug.price.toLocaleString()} {t('pharmacy.iqd')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(drug)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(drug.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
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

            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{drugToEdit ? t('pharmacy.editDrug') : t('pharmacy.addDrug')}</DialogTitle>
                    </DialogHeader>
                    <DrugForm onSave={handleSaveDrug} drugToEdit={drugToEdit} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

