'use client';

import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bloodtype, Droplet, Plus, Minus, User, X, ShoppingCart, History, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/types';
import { translations } from '@/lib/localization';
import { NotificationsButton } from '@/components/notifications-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

type BloodUnit = {
  group: BloodGroup;
  units: number;
  price: number; // Price per unit
};

type CartItem = {
  group: BloodGroup;
  units: number;
  price: number;
};

type Transaction = {
  id: string;
  patientName: string;
  group: BloodGroup;
  units: number;
  totalCost: number;
  date: string;
};

const initialBloodStock: BloodUnit[] = [
  { group: 'A+', units: 25, price: 150000 },
  { group: 'A-', units: 10, price: 200000 },
  { group: 'B+', units: 20, price: 150000 },
  { group: 'B-', units: 8, price: 200000 },
  { group: 'AB+', units: 5, price: 250000 },
  { group: 'AB-', units: 3, price: 300000 },
  { group: 'O+', units: 40, price: 125000 },
  { group: 'O-', units: 15, price: 225000 },
];

export default function BloodBankPage() {
  const { t } = useLanguage();
  const [stock, setStock] = useLocalStorage<BloodUnit[]>('blood_bank_stock_v1', initialBloodStock);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('blood_bank_transactions_v1', []);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { patients, addFinancialRecord } = usePatients();
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
  
  const updateStock = (group: BloodGroup, change: number) => {
    setStock(prev => prev.map(item =>
      item.group === group ? { ...item, units: Math.max(0, item.units + change) } : item
    ));
  };
  
  const addToCart = (item: BloodUnit) => {
    if (item.units <= 0) {
      toast({ title: t('bloodBank.outOfStock'), variant: 'destructive' });
      return;
    }
    const existingItem = cart.find(cartItem => cartItem.group === item.group);
    if (existingItem) {
      if (existingItem.units < item.units) {
        setCart(cart.map(cartItem => cartItem.group === item.group ? { ...cartItem, units: cartItem.units + 1 } : cartItem));
      }
    } else {
      setCart([...cart, { group: item.group, units: 1, price: item.price }]);
    }
  };

  const updateCartQuantity = (group: BloodGroup, newQuantity: number) => {
     const stockItem = stock.find(item => item.group === group);
     if (stockItem && newQuantity > stockItem.units) {
       toast({ title: t('bloodBank.notEnoughStock'), description: t('bloodBank.available', { count: stockItem.units }), variant: 'destructive' });
       return;
     }
     if (newQuantity <= 0) {
       setCart(cart.filter(item => item.group !== group));
     } else {
       setCart(cart.map(item => item.group === group ? { ...item, units: newQuantity } : item));
     }
  };

  const totalCost = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.units), 0);
  }, [cart]);

  const handleConfirmDispense = () => {
    if (!selectedPatientId) {
        toast({ title: t('bloodBank.selectPatientError'), variant: 'destructive'});
        return;
    }
    if (cart.length === 0) {
        toast({ title: t('bloodBank.cartEmptyError'), variant: 'destructive'});
        return;
    }
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;
    
    // Process transactions
    const newTransactions: Transaction[] = [];
    cart.forEach(cartItem => {
        // Update stock
        updateStock(cartItem.group, -cartItem.units);
        // Add to financial record
        addFinancialRecord(selectedPatientId, {
            type: 'pharmacy', // Using 'pharmacy' as a generic type for billable items
            description: `${t('bloodBank.bloodUnit')} (${cartItem.group}) x${cartItem.units}`,
            amount: cartItem.price * cartItem.units,
            date: new Date().toISOString()
        });
        newTransactions.push({
          id: `${Date.now()}-${cartItem.group}`,
          patientName: patient.patientName,
          group: cartItem.group,
          units: cartItem.units,
          totalCost: cartItem.price * cartItem.units,
          date: new Date().toISOString()
        });
    });

    setTransactions(prev => [...newTransactions, ...prev].slice(0, 100)); // Keep last 100 transactions
    toast({ title: t('bloodBank.dispenseConfirmed')});
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
             <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.bloodBank')}</h1>
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

      <main className="flex-grow grid lg:grid-cols-3 gap-4 p-4 md:p-8">
        <div className="lg:col-span-2 space-y-4">
            <Card>
                <CardHeader><CardTitle>{t('bloodBank.inventory')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {stock.map(item => (
                        <Card key={item.group} className={cn("text-center", item.units < 5 && "border-destructive")}>
                            <CardHeader className="p-4">
                                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                                    <Droplet className={cn("h-6 w-6", item.units < 5 ? "text-destructive" : "text-primary")} />
                                    {item.group}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-3xl font-bold">{item.units}</p>
                                <p className="text-sm text-muted-foreground">{t('bloodBank.units')}</p>
                            </CardContent>
                            <CardFooter className="p-2">
                                <Button className="w-full" size="sm" onClick={() => addToCart(item)} disabled={item.units <= 0}>
                                    <Plus className="mr-2 h-4 w-4" /> {t('common.add')}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </CardContent>
            </Card>
            <Card>
               <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/>{t('bloodBank.recentTransactions')}</CardTitle></CardHeader>
               <CardContent>
                 <ScrollArea className="h-64">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('reception.patientName')}</TableHead>
                                <TableHead>{t('bloodBank.group')}</TableHead>
                                <TableHead className="text-center">{t('bloodBank.units')}</TableHead>
                                <TableHead className="text-right">{t('bloodBank.cost')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.patientName}</TableCell>
                                    <TableCell><Badge>{tx.group}</Badge></TableCell>
                                    <TableCell className="text-center">{tx.units}</TableCell>
                                    <TableCell className="text-right font-mono" dir="ltr">{tx.totalCost.toLocaleString()} {t('lab.iqd')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </ScrollArea>
               </CardContent>
            </Card>
        </div>

        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {t('bloodBank.dispenseCart')}
                </CardTitle>
                 <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('bloodBank.selectPatient')} />
                    </SelectTrigger>
                    <SelectContent>
                        {patients.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                 <ScrollArea className="h-full min-h-0">
                    {cart.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground h-full flex items-center justify-center">{t('bloodBank.cartEmpty')}</div>
                    ) : (
                        <div className="divide-y">
                            {cart.map((item) => (
                                <div key={item.group} className="flex justify-between items-center p-3">
                                    <div className="flex-grow">
                                        <span className="text-sm font-bold">{item.group}</span>
                                        <p className="text-xs text-muted-foreground" dir="ltr">
                                            {item.price.toLocaleString()} {t('lab.iqd')} / {t('bloodBank.unit')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                           type="number" 
                                           value={item.units}
                                           onChange={(e) => updateCartQuantity(item.group, parseInt(e.target.value))}
                                           className="w-16 h-8 text-center"
                                           min="1"
                                        />
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(item.group, 0)}>
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
                    <span dir="ltr">{totalCost.toLocaleString()} {t('lab.iqd')}</span>
                </div>
                <Button className="w-full" onClick={handleConfirmDispense} disabled={!selectedPatientId || cart.length === 0}>
                    {t('bloodBank.confirmDispense')}
                </Button>
            </CardFooter>
        </Card>
      </main>
    </div>
  );
}

Object.assign(translations.en, {
    bloodBank: {
        inventory: "Blood Stock Inventory",
        units: "Units",
        unit: "Unit",
        group: "Group",
        cost: "Cost",
        dispenseCart: "Dispense Cart",
        selectPatient: "Select a patient",
        cartEmpty: "Cart is empty. Add blood units from the inventory.",
        confirmDispense: "Confirm Dispense",
        outOfStock: "Out of stock",
        notEnoughStock: "Not enough units in stock.",
        available: "Available: {count} units",
        selectPatientError: 'Please select a patient first.',
        cartEmptyError: 'The dispense cart is empty.',
        dispenseConfirmed: 'Blood dispensed and added to patient records.',
        recentTransactions: 'Recent Transactions',
        bloodUnit: 'Blood Unit'
    }
});
Object.assign(translations.ar, {
    bloodBank: {
        inventory: "مخزون الدم",
        units: "وحدات",
        unit: "وحدة",
        group: "الفصيلة",
        cost: "التكلفة",
        dispenseCart: "سلة الصرف",
        selectPatient: "اختر مريضاً",
        cartEmpty: "السلة فارغة. أضف وحدات دم من المخزون.",
        confirmDispense: "تأكيد الصرف",
        outOfStock: "نفذت الكمية",
        notEnoughStock: "لا توجد وحدات كافية في المخزون.",
        available: "المتوفر: {count} وحدات",
        selectPatientError: 'يرجى اختيار مريض أولاً.',
        cartEmptyError: 'سلة الصرف فارغة.',
        dispenseConfirmed: 'تم صرف الدم وإضافته لسجلات المريض.',
        recentTransactions: 'آخر المعاملات',
        bloodUnit: 'وحدة دم'
    }
});