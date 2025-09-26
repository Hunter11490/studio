'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Scissors, PlusCircle, Pencil, Clock, Maximize, Minimize, SprayCan, Loader2, User, Calendar } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationsButton } from '@/components/notifications-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { requestSterilization } from '@/ai/flows/sterilization-flow';
import { useToast } from '@/hooks/use-toast';
import { InstrumentSet, Patient } from '@/types';
import { usePatients } from '@/hooks/use-patients';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type SurgeryBooking = {
    id: string;
    patientId: string;
    patientName: string; 
    surgeryType: string;
    surgeonName: string;
    date: Date;
    duration: number; 
    cost: number; 
    status: 'scheduled' | 'completed' | 'canceled';
};

const formSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  surgeryType: z.string().min(1, 'Surgery type is required'),
  surgeonName: z.string().min(1, 'Surgeon name is required'),
  date: z.date(),
  duration: z.coerce.number().min(30, 'Duration must be at least 30 minutes'),
  cost: z.coerce.number().min(0, 'Cost cannot be negative'),
  status: z.enum(['scheduled', 'completed', 'canceled']),
});

const initialBookings: SurgeryBooking[] = [];

function SterilizationRequestDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [instrumentSets, setInstrumentSets] = useLocalStorage<InstrumentSet[]>('sterilization_sets', []);
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState('');

    const handleRequest = async () => {
        if (!description) return;
        setIsLoading(true);
        try {
            const result = await requestSterilization({
                description: description,
                department: 'surgicalOperations'
            });
            
            setInstrumentSets(prev => [result.newInstrumentSet, ...prev]);

            toast({
                title: t('sterilization.requestSentTitle'),
                description: t('sterilization.requestSentDesc', { name: result.newInstrumentSet.name }),
            });
            onOpenChange(false);
            setDescription('');
        } catch (error) {
            console.error("Sterilization request failed:", error);
            toast({ title: t('common.error'), variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('sterilization.newRequestTitle')}</DialogTitle>
                    <DialogDescription>{t('sterilization.newRequestDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Input 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('sterilization.instrumentPlaceholder')}
                        disabled={isLoading}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        {t('doctorForm.cancel')}
                    </Button>
                    <Button onClick={handleRequest} disabled={isLoading || !description}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('sterilization.sendRequest')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SurgeryCard({ booking, onEdit }: { booking: SurgeryBooking, onEdit: (booking: SurgeryBooking) => void }) {
    const { t, lang } = useLanguage();
    const surgeryIsInThePast = isPast(new Date(booking.date));
    const statusConfig = {
      scheduled: 'bg-blue-500/80 border-blue-700',
      completed: 'bg-green-500/80 border-green-700',
      canceled: 'bg-red-500/80 border-red-700',
    };

    return (
        <Card className={cn("overflow-hidden", surgeryIsInThePast && "opacity-70")}>
             <div className={cn("w-full h-1.5", statusConfig[booking.status])}></div>
             <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{booking.patientName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{booking.surgeryType}</p>
                    </div>
                    {!surgeryIsInThePast && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(booking)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                </div>
             </CardHeader>
             <CardContent className="p-4 pt-0 text-sm space-y-2">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.surgeonName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(booking.date), 'PPP p', { locale: lang === 'ar' ? ar : undefined })}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.duration} {t('surgery.minutes')}</span>
                </div>
             </CardContent>
        </Card>
    );
}

export default function SurgeryPage() {
    const { t, lang } = useLanguage();
    const [bookings, setBookings] = useLocalStorage<SurgeryBooking[]>('surgery_bookings_v5', initialBookings);
    const { patients, addFinancialRecord } = usePatients();
    const [isFormOpen, setFormOpen] = useState(false);
    const [isSterilizationRequestOpen, setSterilizationRequestOpen] = useState(false);
    const [bookingToEdit, setBookingToEdit] = useState<SurgeryBooking | null>(null);
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

    const handleSaveBooking = (data: z.infer<typeof formSchema>) => {
        const patient = patients.find(p => p.id === data.patientId);
        if (!patient) return;

        const bookingData = { ...data, patientName: patient.patientName };
        
        if (bookingToEdit) {
            setBookings(prev => prev.map(b => b.id === bookingToEdit.id ? { ...b, ...bookingData } : b));
        } else {
            const newBooking: SurgeryBooking = { id: new Date().toISOString(), ...bookingData };
            setBookings(prev => [newBooking, ...prev]);
            addFinancialRecord(data.patientId, {
                type: 'surgery',
                description: `${t('surgery.surgeryType')}: ${data.surgeryType}`,
                amount: data.cost,
                date: new Date().toISOString()
            });
        }
        setFormOpen(false);
        setBookingToEdit(null);
    };
    
    const handleAddClick = () => {
        setBookingToEdit(null);
        setFormOpen(true);
    };

    const handleEditClick = (booking: SurgeryBooking) => {
        setBookingToEdit(booking);
        setFormOpen(true);
    };

    const { scheduledBookings, completedBookings } = useMemo(() => {
        const sorted = [...bookings].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return {
            scheduledBookings: sorted.filter(b => !isPast(new Date(b.date)) && b.status === 'scheduled'),
            completedBookings: sorted.filter(b => isPast(new Date(b.date)) || b.status !== 'scheduled'),
        };
    }, [bookings]);

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.surgicalOperations')}</h1>
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

            <main className="flex-grow p-4 md:p-6 overflow-hidden">
                <Tabs defaultValue="scheduled" className="h-full flex flex-col">
                    <div className="flex justify-center">
                        <TabsList>
                            <TabsTrigger value="scheduled">{t('surgery.tabs.scheduled')}</TabsTrigger>
                            <TabsTrigger value="completed">{t('surgery.tabs.completed')}</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="scheduled" className="flex-grow overflow-hidden mt-4">
                        <ScrollArea className="h-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                                {scheduledBookings.length > 0 ? (
                                    scheduledBookings.map(b => <SurgeryCard key={b.id} booking={b} onEdit={handleEditClick} />)
                                ) : (
                                    <div className="col-span-full text-center py-16 text-muted-foreground">{t('surgery.noScheduled')}</div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="completed" className="flex-grow overflow-hidden mt-4">
                        <ScrollArea className="h-full">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                                {completedBookings.length > 0 ? (
                                    completedBookings.map(b => <SurgeryCard key={b.id} booking={b} onEdit={handleEditClick} />)
                                ) : (
                                    <div className="col-span-full text-center py-16 text-muted-foreground">{t('surgery.noCompleted')}</div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </main>
            
             <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button onClick={handleAddClick} className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full shadow-lg" size="icon">
                            <PlusCircle className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>{t('surgery.newBooking')}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={() => setSterilizationRequestOpen(true)} className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg" size="icon">
                            <SprayCan className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>{t('sterilization.newRequestTitle')}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>

             <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{bookingToEdit ? t('surgery.editBooking') : t('surgery.newBooking')}</DialogTitle>
                    </DialogHeader>
                    <BookingForm 
                      onSave={handleSaveBooking} 
                      bookingToEdit={bookingToEdit} 
                    />
                </DialogContent>
            </Dialog>
            <SterilizationRequestDialog open={isSterilizationRequestOpen} onOpenChange={setSterilizationRequestOpen} />
        </div>
    );
}

function BookingForm({ onSave, bookingToEdit }: { onSave: (data: z.infer<typeof formSchema>) => void; bookingToEdit?: SurgeryBooking | null }) {
    const { t } = useLanguage();
    const { patients } = usePatients();

    const availablePatients = useMemo(() => {
        return patients.filter(p => p.status !== 'Discharged');
    }, [patients]);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            patientId: '',
            surgeryType: '',
            surgeonName: '',
            date: new Date(),
            duration: 60,
            cost: 0,
            status: 'scheduled',
        },
    });

     useEffect(() => {
        if (bookingToEdit) {
            form.reset({
                ...bookingToEdit,
                date: new Date(bookingToEdit.date),
            });
        } else {
             form.reset({
                patientId: '',
                surgeryType: '',
                surgeonName: '',
                date: new Date(),
                duration: 60,
                cost: 1000000,
                status: 'scheduled',
            });
        }
    }, [bookingToEdit, form]);

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        onSave(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                 <FormField 
                    control={form.control} 
                    name="patientId"
                    render={({ field }) => (
                     <FormItem>
                         <FormLabel>{t('surgery.patientName')}</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value} disabled={!!bookingToEdit}>
                             <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('wards.selectPatientPlaceholder')} />
                                </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                                 {availablePatients.map(p => (
                                     <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                         <FormMessage />
                     </FormItem>
                 )} />
                 <FormField control={form.control} name="surgeryType" render={({ field }) => (
                    <FormItem><FormLabel>{t('surgery.surgeryType')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="surgeonName" render={({ field }) => (
                    <FormItem><FormLabel>{t('surgery.surgeonName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>{t('surgery.date')}</FormLabel><FormControl><Input type="datetime-local" 
                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                    /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="duration" render={({ field }) => (
                        <FormItem><FormLabel>{t('surgery.duration')}</FormLabel><FormControl><Input type="number" step="15" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="cost" render={({ field }) => (
                        <FormItem><FormLabel>{t('surgery.cost')}</FormLabel><FormControl><Input type="number" step="1000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>{t('surgery.status.title')}</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="scheduled">{t('surgery.status.scheduled')}</SelectItem>
                            <SelectItem value="completed">{t('surgery.status.completed')}</SelectItem>
                            <SelectItem value="canceled">{t('surgery.status.canceled')}</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <Button type="submit">{t('common.save')}</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}
