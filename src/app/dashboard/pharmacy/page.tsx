
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pill, PlusCircle, Pencil, Trash2, ShoppingCart, User, X, Maximize, Minimize } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

type Drug = {
    id: string;
    name: string;
    quantity: number;
    price: number;
};

type CartItem = Drug & { orderQuantity: number };

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
  // Adding a massive amount of drugs as requested
  ...Array.from({ length: 5000 }, (_, i) => ({
    id: `drug-${i + 8}`,
    name: `Generic Drug #${i + 1} - ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + (Math.floor(i/26) % 26))}`,
    quantity: Math.floor(Math.random() * 500),
    price: 500 + Math.floor(Math.random() * 50000)
  }))
];

export default function PharmacyPage() {
    const { t } = useLanguage();
    const [drugs, setDrugs] = useLocalStorage<Drug[]>('pharmacy_drugs_v2', initialDrugs);
    const { patients, addFinancialRecord } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setFormOpen] = useState(false);
    const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
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


    const filteredDrugs = useMemo(() => {
        return drugs.filter(drug => drug.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [drugs, searchTerm]);

    const handleSaveDrug = (data: z.infer<typeof formSchema>) => {
        if (drugToEdit) {
            setDrugs(prev => prev.map(d => d.id === drugToEdit.id ? { ...d, ...data } : d));
        } else {
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

    const addToCart = (drug: Drug) => {
        const existingItem = cart.find(item => item.id === drug.id);
        if (existingItem) {
            if (existingItem.orderQuantity < drug.quantity) {
                setCart(cart.map(item => item.id === drug.id ? { ...item, orderQuantity: item.orderQuantity + 1 } : item));
            }
        } else {
            if (drug.quantity > 0) {
                setCart([...cart, { ...drug, orderQuantity: 1 }]);
            }
        }
    };
    
    const removeFromCart = (drugId: string) => {
        setCart(cart.filter(item => item.id !== drugId));
    };

    const totalCost = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.orderQuantity), 0);
    }, [cart]);

    const handleConfirmSale = () => {
        if (!selectedPatientId) {
            toast({ title: t('pharmacy.selectPatientError'), variant: 'destructive'});
            return;
        }
        if (cart.length === 0) {
            toast({ title: t('pharmacy.cartEmptyError'), variant: 'destructive'});
            return;
        }

        // Update inventory
        const updatedDrugs = [...drugs];
        cart.forEach(cartItem => {
            const drugIndex = updatedDrugs.findIndex(d => d.id === cartItem.id);
            if (drugIndex !== -1) {
                updatedDrugs[drugIndex].quantity -= cartItem.orderQuantity;
            }
            // Add financial record
            addFinancialRecord(selectedPatientId, {
                type: 'pharmacy',
                description: `${cartItem.name} (x${cartItem.orderQuantity})`,
                amount: cartItem.price * cartItem.orderQuantity,
                date: new Date().toISOString()
            });
        });

        setDrugs(updatedDrugs);
        toast({ title: t('pharmacy.saleConfirmed')});
        setCart([]);
        setSelectedPatientId(null);
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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('pharmacy.inventory')}</CardTitle>
                        <Button onClick={handleAddClick} size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('pharmacy.addDrug')}
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col p-0">
                        <div className="px-6 pb-4">
                            <Input
                                placeholder={t('pharmacy.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-full min-h-0">
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
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(drug)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(drug.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => addToCart(drug)} disabled={drug.quantity === 0}><PlusCircle className="h-4 w-4 text-primary" /></Button>
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
                            <ShoppingCart className="h-5 w-5" />
                            {t('pharmacy.salesCart')}
                        </CardTitle>
                         <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('pharmacy.selectPatient')} />
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
                            {cart.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">{t('pharmacy.cartEmpty')}</div>
                            ) : (
                                <div className="divide-y">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3">
                                            <div>
                                              <span className="text-sm">{item.name}</span>
                                              <p className="text-xs text-muted-foreground">x {item.orderQuantity}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono">{(item.price * item.orderQuantity).toLocaleString()}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
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
                            <span>{t('pharmacy.total')}:</span>
                            <span dir="ltr">{totalCost.toLocaleString()} {t('pharmacy.iqd')}</span>
                        </div>
                        <Button className="w-full" onClick={handleConfirmSale} disabled={!selectedPatientId || cart.length === 0}>
                            {t('pharmacy.confirmSale')}
                        </Button>
                    </CardFooter>
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

function DrugForm({ onSave, drugToEdit }: { onSave: (data: z.infer<typeof formSchema>) => void, drugToEdit?: Drug | null }) {
    const { t } = useLanguage();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', quantity: 0, price: 0 },
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
                    <FormItem><FormLabel>{t('pharmacy.drugName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>{t('pharmacy.quantity')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>{t('pharmacy.price')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <Button type="submit">{t('common.save')}</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
