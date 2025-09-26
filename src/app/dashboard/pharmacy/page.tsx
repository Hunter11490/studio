'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';

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

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const initialDrugs: Drug[] = [
    // Analgesics & Anti-inflammatory
    { id: 'drug-1', name: 'Paracetamol 500mg (Panadol)', quantity: 450, price: 1000 },
    { id: 'drug-2', name: 'Ibuprofen 400mg (Brufen)', quantity: 380, price: 1500 },
    { id: 'drug-3', name: 'Diclofenac Sodium 50mg (Voltaren)', quantity: 250, price: 2000 },
    { id: 'drug-4', name: 'Aspirin 100mg', quantity: 300, price: 1000 },
    { id: 'drug-5', name: 'Mefenamic Acid 500mg (Ponstan Forte)', quantity: 180, price: 2500 },
    { id: 'drug-6', name: 'Naproxen 250mg', quantity: 150, price: 3000 },
    { id: 'drug-7', name: 'Celecoxib 200mg (Celebrex)', quantity: 100, price: 10000 },
    { id: 'drug-8', name: 'Tramadol 50mg', quantity: 80, price: 4000 },
    { id: 'drug-9', name: 'Paracetamol + Caffeine (Panadol Extra)', quantity: 200, price: 1500 },
    { id: 'drug-10', name: 'Diclofenac Potassium 50mg (Cataflam)', quantity: 220, price: 2500 },

    // Antibiotics
    { id: 'drug-11', name: 'Amoxicillin 500mg', quantity: 300, price: 5000 },
    { id: 'drug-12', name: 'Amoxicillin/Clavulanic Acid 625mg (Augmentin)', quantity: 180, price: 12000 },
    { id: 'drug-13', name: 'Azithromycin 500mg (Zithromax)', quantity: 150, price: 10000 },
    { id: 'drug-14', name: 'Ciprofloxacin 500mg', quantity: 120, price: 6000 },
    { id: 'drug-15', name: 'Doxycycline 100mg', quantity: 200, price: 4000 },
    { id: 'drug-16', name: 'Cephalexin 500mg', quantity: 140, price: 7000 },
    { id: 'drug-17', name: 'Metronidazole 500mg (Flagyl)', quantity: 250, price: 3000 },
    { id: 'drug-18', name: 'Clarithromycin 500mg', quantity: 90, price: 15000 },
    { id: 'drug-19', name: 'Levofloxacin 500mg', quantity: 100, price: 9000 },
    { id: 'drug-20', name: 'Cefixime 400mg (Suprax)', quantity: 80, price: 18000 },

    // Cardiovascular
    { id: 'drug-21', name: 'Lisinopril 10mg', quantity: 150, price: 7000 },
    { id: 'drug-22', name: 'Amlodipine 5mg', quantity: 200, price: 6000 },
    { id: 'drug-23', name: 'Atorvastatin 20mg (Lipitor)', quantity: 180, price: 12000 },
    { id: 'drug-24', name: 'Metoprolol 50mg', quantity: 130, price: 8000 },
    { id: 'drug-25', name: 'Furosemide 40mg (Lasix)', quantity: 220, price: 2000 },
    { id: 'drug-26', name: 'Clopidogrel 75mg (Plavix)', quantity: 100, price: 15000 },
    { id: 'drug-27', name: 'Warfarin 5mg', quantity: 70, price: 5000 },
    { id: 'drug-28', name: 'Losartan 50mg', quantity: 160, price: 9000 },
    { id: 'drug-29', name: 'Hydrochlorothiazide 25mg', quantity: 180, price: 2500 },
    { id: 'drug-30', name: 'Bisoprolol 5mg (Concor)', quantity: 140, price: 10000 },

    // Diabetes
    { id: 'drug-31', name: 'Metformin 500mg (Glucophage)', quantity: 400, price: 4000 },
    { id: 'drug-32', name: 'Glibenclamide 5mg', quantity: 200, price: 3000 },
    { id: 'drug-33', name: 'Gliclazide 80mg (Diamicron)', quantity: 150, price: 7000 },
    { id: 'drug-34', name: 'Sitagliptin 100mg (Januvia)', quantity: 80, price: 35000 },
    { id: 'drug-35', name: 'Insulin Glargine (Lantus) SoloStar Pen', quantity: 50, price: 30000 },
    { id: 'drug-36', name: 'Insulin Aspart (NovoRapid) FlexPen', quantity: 60, price: 28000 },
    { id: 'drug-37', name: 'Pioglitazone 30mg', quantity: 90, price: 11000 },
    { id: 'drug-38', name: 'Empagliflozin 25mg (Jardiance)', quantity: 40, price: 45000 },
    { id: 'drug-39', name: 'Liraglutide (Victoza) Pen', quantity: 20, price: 150000 },
    { id: 'drug-40', name: 'Metformin 850mg', quantity: 350, price: 5000 },

    // Respiratory
    { id: 'drug-41', name: 'Salbutamol Inhaler (Ventolin)', quantity: 150, price: 5000 },
    { id: 'drug-42', name: 'Loratadine 10mg (Claritin)', quantity: 250, price: 3000 },
    { id: 'drug-43', name: 'Cetirizine 10mg (Zyrtec)', quantity: 300, price: 2500 },
    { id: 'drug-44', name: 'Montelukast 10mg (Singulair)', quantity: 120, price: 15000 },
    { id: 'drug-45', name: 'Fluticasone/Salmeterol Inhaler (Seretide)', quantity: 80, price: 25000 },
    { id: 'drug-46', name: 'Budesonide/Formoterol Inhaler (Symbicort)', quantity: 70, price: 30000 },
    { id: 'drug-47', name: 'Ambroxol Syrup 100ml', quantity: 180, price: 4000 },
    { id: 'drug-48', name: 'Dextromethorphan Syrup 100ml', quantity: 200, price: 3500 },
    { id: 'drug-49', name: 'Prednisolone 5mg', quantity: 280, price: 2000 },
    { id: 'drug-50', name: 'Theophylline 100mg', quantity: 100, price: 5000 },

    // Gastrointestinal
    { id: 'drug-51', name: 'Omeprazole 20mg (Losec)', quantity: 250, price: 8000 },
    { id: 'drug-52', name: 'Ranitidine 150mg (Zantac)', quantity: 180, price: 4000 },
    { id: 'drug-53', name: 'Domperidone 10mg (Motilium)', quantity: 200, price: 3500 },
    { id: 'drug-54', name: 'Loperamide 2mg (Imodium)', quantity: 150, price: 2500 },
    { id: 'drug-55', name: 'Hyoscine Butylbromide 10mg (Buscopan)', quantity: 220, price: 4500 },
    { id: 'drug-56', name: 'Lactulose Syrup 200ml', quantity: 130, price: 7000 },
    { id: 'drug-57', name: 'Esomeprazole 40mg (Nexium)', quantity: 110, price: 18000 },
    { id: 'drug-58', name: 'Simethicone 40mg', quantity: 190, price: 2000 },
    { id: 'drug-59', name: 'Mebeverine 135mg (Duspatalin)', quantity: 100, price: 9000 },
    { id: 'drug-60', name: 'Oral Rehydration Salts (ORS) Sachet', quantity: 500, price: 500 },

    // Vitamins & Supplements
    { id: 'drug-61', name: 'Vitamin C 500mg', quantity: 400, price: 3000 },
    { id: 'drug-62', name: 'Vitamin D3 5000 IU', quantity: 250, price: 8000 },
    { id: 'drug-63', name: 'Folic Acid 5mg', quantity: 300, price: 1500 },
    { id: 'drug-64', name: 'Ferrous Sulphate (Iron) 200mg', quantity: 350, price: 2000 },
    { id: 'drug-65', name: 'Calcium Carbonate 500mg + Vitamin D', quantity: 280, price: 5000 },
    { id: 'drug-66', name: 'Multivitamin Tablets (e.g., Centrum)', quantity: 150, price: 15000 },
    { id: 'drug-67', name: 'Vitamin B-Complex', quantity: 320, price: 4000 },
    { id: 'drug-68', name: 'Omega-3 Fish Oil 1000mg', quantity: 120, price: 12000 },
    { id: 'drug-69', name: 'Glucosamine/Chondroitin', quantity: 90, price: 20000 },
    { id: 'drug-70', name: 'Ginkgo Biloba 60mg', quantity: 80, price: 10000 },
    
    // Hormonal
    { id: 'drug-71', name: 'Levothyroxine 50mcg (Eltroxin)', quantity: 150, price: 4000 },
    { id: 'drug-72', name: 'Combined Oral Contraceptive (e.g., Yasmin)', quantity: 100, price: 9000 },
    { id: 'drug-73', name: 'Testosterone Gel', quantity: 30, price: 40000 },
    { id: 'drug-74', name: 'Medroxyprogesterone Acetate Injection (Depo-Provera)', quantity: 50, price: 15000 },
    
    // Neurological & Psychiatric
    { id: 'drug-75', name: 'Sertraline 50mg (Lustral)', quantity: 100, price: 12000 },
    { id: 'drug-76', name: 'Escitalopram 10mg (Cipralex)', quantity: 90, price: 18000 },
    { id: 'drug-77', name: 'Alprazolam 0.5mg (Xanax)', quantity: 70, price: 5000 },
    { id: 'drug-78', name: 'Pregabalin 75mg (Lyrica)', quantity: 120, price: 20000 },
    { id: 'drug-79', name: 'Carbamazepine 200mg (Tegretol)', quantity: 110, price: 6000 },
    { id: 'drug-80', name: 'Olanzapine 5mg', quantity: 60, price: 25000 },

    // Topical Preparations
    { id: 'drug-81', name: 'Hydrocortisone Cream 1%', quantity: 150, price: 2500 },
    { id: 'drug-82', name: 'Miconazole Cream 2% (Daktarin)', quantity: 120, price: 4000 },
    { id: 'drug-83', name: 'Fusidic Acid Cream (Fucidin)', quantity: 100, price: 7000 },
    { id: 'drug-84', name: 'Diclofenac Gel (Voltarol)', quantity: 180, price: 5000 },
    { id: 'drug-85', name: 'Povidone-Iodine Ointment (Betadine)', quantity: 200, price: 3000 },

    // Eye/Ear Drops
    { id: 'drug-86', name: 'Hypromellose Eye Drops (Artificial Tears)', quantity: 130, price: 3500 },
    { id: 'drug-87', name: 'Chloramphenicol Eye Ointment', quantity: 90, price: 4000 },
    { id: 'drug-88', name: 'Ciprofloxacin Eye/Ear Drops', quantity: 100, price: 5000 },
    { id: 'drug-89', name: 'Timolol Eye Drops 0.5%', quantity: 70, price: 8000 },
    { id: 'drug-90', name: 'Olive Oil Ear Drops', quantity: 150, price: 2000 },
    
    // Auto-generated bulk drugs
    ...Array.from({ length: 4910 }, (_, i) => {
        const drugTypes = ['Tablets', 'Capsules', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops'];
        const strengths = ['10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1g'];
        const basePrice = (Math.floor(Math.random() * 20) + 1) * 1000;
        const quantity = Math.floor(Math.random() * 500);
        return {
            id: `drug-${i + 91}`,
            name: `Generic Drug ${String.fromCharCode(65 + (i % 26))}${i} ${getRandomElement(strengths)} ${getRandomElement(drugTypes)}`,
            quantity: quantity,
            price: basePrice
        };
    })
];


export default function PharmacyPage() {
    const { t } = useLanguage();
    const [drugs, setDrugs] = useLocalStorage<Drug[]>('pharmacy_drugs_v2', initialDrugs);
    const { patients, addFinancialRecord } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const { toast } = useToast();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isFormOpen, setFormOpen] = useState(false);
    const [drugToEdit, setDrugToEdit] = useState<Drug | null>(null);


    const filteredDrugs = useMemo(() => {
        return drugs.filter(drug => drug.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [drugs, searchTerm]);


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

    const handleSaveDrug = (data: z.infer<typeof formSchema>, drugToEdit: Drug | null) => {
        if (drugToEdit) {
            setDrugs(prev => prev.map(d => d.id === drugToEdit.id ? { ...d, ...data } : d));
        } else {
            const newDrug: Drug = { id: new Date().toISOString(), ...data };
            setDrugs(prev => [newDrug, ...prev]);
        }
        setFormOpen(false);
    };

    const handleDeleteClick = (drugId: string) => {
        setDrugs(prev => prev.filter(d => d.id !== drugId));
    };

    const handleAddClick = () => {
        setDrugToEdit(null);
        setFormOpen(true);
    };

    const handleEditClick = (drug: Drug) => {
        setDrugToEdit(drug);
        setFormOpen(true);
    };

    const addToCart = (drug: Drug, quantity: number = 1) => {
        const existingItem = cart.find(item => item.id === drug.id);
        if (existingItem) {
            const newQuantity = existingItem.orderQuantity + quantity;
            if (newQuantity <= drug.quantity) {
                 setCart(cart.map(item => item.id === drug.id ? { ...item, orderQuantity: newQuantity } : item));
            } else {
                toast({ title: t('pharmacy.notEnoughStock'), variant: 'destructive'});
            }
        } else {
            if (quantity <= drug.quantity) {
                setCart([...cart, { ...drug, orderQuantity: quantity }]);
            } else {
                 toast({ title: t('pharmacy.notEnoughStock'), variant: 'destructive'});
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
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
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

            <main className="flex-grow flex flex-col md:flex-row gap-4 p-4 md:p-6 overflow-hidden">
                {/* Inventory Panel */}
                <Card className="flex flex-col md:w-2/3">
                    <CardHeader className="p-4">
                        <CardTitle className="flex justify-between items-center text-base">
                            {t('pharmacy.inventory')}
                            <Button onClick={handleAddClick} size="xs">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('pharmacy.addDrug')}
                            </Button>
                        </CardTitle>
                        <Input
                            placeholder={t('pharmacy.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9"
                        />
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="py-2 text-xs">{t('pharmacy.drugName')}</TableHead>
                                        <TableHead className="py-2 text-xs">{t('pharmacy.quantity')}</TableHead>
                                        <TableHead className="text-right py-2 text-xs">{t('pharmacy.price')}</TableHead>
                                        <TableHead className="w-[80px] py-2"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDrugs.map((drug) => (
                                       <TableRow key={drug.id} className={drug.quantity < 10 ? 'bg-destructive/10' : ''}>
                                            <TableCell className="font-medium text-xs py-2">{drug.name}</TableCell>
                                            <TableCell className="text-xs py-2">{drug.quantity}</TableCell>
                                            <TableCell className="text-right text-xs py-2" dir="ltr">{drug.price.toLocaleString()} {t('pharmacy.iqd')}</TableCell>
                                            <TableCell className="text-right space-x-1 py-2">
                                                <Button size="xs" variant="outline" onClick={() => addToCart(drug)}>
                                                    <PlusCircle className="mr-1 h-3 w-3" />
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

                 {/* Sales Cart Panel */}
                 <div className="flex flex-col gap-4 flex-grow md:w-1/3">
                    <div className="space-y-2">
                        <Label>{t('pharmacy.selectPatient')}</Label>
                        <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder={t('pharmacy.selectPatient')} />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Card className="flex flex-col flex-grow">
                        <CardHeader className="p-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ShoppingCart className="h-5 w-5" />
                                {t('pharmacy.salesCart')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow p-0 overflow-hidden">
                            <ScrollArea className="h-full">
                                {cart.length === 0 ? (
                                    <div className="flex items-center justify-center h-full p-6 text-center text-sm text-muted-foreground">{t('pharmacy.cartEmpty')}</div>
                                ) : (
                                    <div className="divide-y">
                                        {cart.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center p-2">
                                                <div>
                                                <span className="text-xs">{item.name}</span>
                                                <p className="text-xs text-muted-foreground">x {item.orderQuantity}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-mono">{(item.price * item.orderQuantity).toLocaleString()}</span>
                                                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => removeFromCart(item.id)}>
                                                        <X className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex-col items-start border-t pt-4 gap-4 p-4">
                            <div className="w-full flex justify-between font-bold text-base">
                                <span>{t('pharmacy.total')}:</span>
                                <span dir="ltr">{totalCost.toLocaleString()} {t('pharmacy.iqd')}</span>
                            </div>
                            <Button className="w-full" size="sm" onClick={handleConfirmSale} disabled={!selectedPatientId || cart.length === 0}>
                                {t('pharmacy.confirmSale')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
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
