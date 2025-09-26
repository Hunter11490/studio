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
import { Scissors, PlusCircle, ChevronLeft, ChevronRight, Clock, Maximize, Minimize, SprayCan, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationsButton } from '@/components/notifications-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { requestSterilization } from '@/ai/flows/sterilization-flow';
import { useToast } from '@/hooks/use-toast';
import { InstrumentSet, Patient } from '@/types';
import { usePatients } from '@/hooks/use-patients';


type SurgeryBooking = {
    id: string;
    patientId: string;
    patientName: string; // Keep patientName for display purposes
    surgeryType: string;
    surgeonName: string;
    date: Date;
    duration: number; // Duration in minutes
    cost: number; // Cost of the surgery
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

const initialBookings: SurgeryBooking[] = [
    { id: '1', patientId: 'mock_patient_1', patientName: 'علي حسن', surgeryType: 'استئصال الزائدة', surgeonName: 'د. أحمد الجميلي', date: setMinutes(setHours(new Date(), 9), 0), duration: 60, cost: 500000, status: 'scheduled' },
    { id: '2', patientId: 'mock_patient_2', patientName: 'نور محمد', surgeryType: 'جراحة القلب المفتوح', surgeonName: 'د. علي الساعدي', date: setMinutes(setHours(addDays(new Date(), 1), 11), 30), duration: 180, cost: 7500000, status: 'scheduled' },
    { id: '3', patientId: 'mock_patient_3', patientName: 'سارة كريم', surgeryType: 'إزالة المرارة', surgeonName: 'د. خالد العامري', date: setMinutes(setHours(new Date(), 14), 0), duration: 90, cost: 1200000, status: 'completed' },
];

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

export default function SurgeryPage() {
    const { t, lang } = useLanguage();
    const [bookings, setBookings] = useLocalStorage<SurgeryBooking[]>('surgery_bookings_v4', initialBookings);
    const { patients, addFinancialRecord } = usePatients();
    const [isFormOpen, setFormOpen] = useState(false);
    const [isSterilizationRequestOpen, setSterilizationRequestOpen] = useState(false);
    const [bookingToEdit, setBookingToEdit] = useState<SurgeryBooking | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
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

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 }); // Saturday
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`); // 8 AM to 7 PM

    const handleSaveBooking = (data: z.infer<typeof formSchema>) => {
        const patient = patients.find(p => p.id === data.patientId);
        if (!patient) return;

        const bookingData = { ...data, patientName: patient.patientName };
        
        if (bookingToEdit && bookingToEdit.patientId) {
            setBookings(prev => prev.map(b => b.id === bookingToEdit.id ? { ...b, ...bookingData } : b));
        } else {
            const newBooking: SurgeryBooking = { id: new Date().toISOString(), ...bookingData };
            setBookings(prev => [newBooking, ...prev]);
            addFinancialRecord(data.patientId, {
                type: 'surgery',
                description: `${t('surgery.surgeryType')}: ${data.surgeryType}`,
                amount: data.cost
            });
        }
        setFormOpen(false);
        setBookingToEdit(null);
    };
    
    const handleAddClick = (date: Date, hour: number) => {
        setBookingToEdit(null); // Clear any existing edit data
        const newDate = setMinutes(setHours(date, hour), 0);
        // This is a way to set default values for the form when adding.
        const defaultBookingData: Partial<SurgeryBooking> = { date: newDate, duration: 60, cost: 1000000, status: 'scheduled' };
        // We open the form, but let the user select the patient.
        setFormOpen(true);
    };

    const changeWeek = (direction: 'next' | 'prev') => {
        setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };
    
    const getBookingStyle = (booking: SurgeryBooking) => {
        const startHour = getHours(new Date(booking.date));
        const startMinute = getMinutes(new Date(booking.date));
        const top = ((startHour - 8) * 60 + startMinute); // 60px per hour, starting from 8 AM
        const height = booking.duration;
        
        const statusClasses = {
          scheduled: 'bg-blue-500/80 border-blue-700',
          completed: 'bg-green-500/80 border-green-700',
          canceled: 'bg-red-500/80 border-red-700',
        };

        return {
            top: `${top}px`,
            height: `${height}px`,
            className: cn(
                "absolute left-1 right-1 p-2 rounded-lg text-white text-xs overflow-hidden border-l-4",
                "cursor-pointer hover:opacity-90 transition-opacity",
                statusClasses[booking.status]
            ),
        };
    };

    return (
        <div className="flex flex-col h-screen bg-secondary/50">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.surgicalOperations')}</h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => changeWeek('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm font-semibold text-center w-40 md:w-auto tabular-nums whitespace-nowrap">
                            {format(weekStart, 'dd MMM yyyy', {locale: lang === 'ar' ? ar : undefined})}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => changeWeek('next')}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
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

            <div className="flex-grow flex p-2 md:p-4 overflow-hidden">
                {/* Time Gutter */}
                <div className="w-16 text-center text-sm text-muted-foreground flex-shrink-0">
                    <div className="h-10"></div> {/* Header space */}
                    {timeSlots.map(time => <div key={time} className="h-[60px] relative"><span className="absolute -top-2 rtl:right-0 ltr:left-0 w-full text-center">{time}</span></div>)}
                </div>

                {/* Schedule Grid */}
                <ScrollArea className="flex-grow overflow-x-auto whitespace-nowrap">
                    <div className="grid grid-cols-7 min-w-[900px] gap-px bg-border rounded-lg border overflow-hidden h-full">
                        {weekDays.map(day => (
                            <div key={day.toString()} className="bg-background relative">
                                <div className="p-2 border-b text-center font-semibold text-sm h-10 sticky top-0 bg-background z-10">
                                    {format(day, 'EEE dd', {locale: lang === 'ar' ? ar : undefined})}
                                </div>
                                <div className="relative">
                                    {/* Hour lines */}
                                    {timeSlots.map((time, i) => (
                                      <div 
                                        key={i} 
                                        className="h-[60px] border-t border-dashed hover:bg-primary/10 cursor-pointer"
                                        onClick={() => handleAddClick(day, 8 + i)}
                                      ></div>
                                    ))}
                                    
                                    {/* Bookings */}
                                    {bookings
                                        .filter(b => isSameDay(new Date(b.date), day))
                                        .map(booking => {
                                            const { top, height, className } = getBookingStyle(booking);
                                            return (
                                                <div 
                                                    key={booking.id}
                                                    style={{ top, height }}
                                                    className={className}
                                                    onClick={() => { setBookingToEdit(booking); setFormOpen(true) }}
                                                >
                                                    <p className="font-bold truncate">{booking.patientName}</p>
                                                    <p className="truncate text-white/80">{booking.surgeryType}</p>
                                                    <div className="flex items-center gap-1 opacity-80 mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{booking.duration} min</span>
                                                    </div>
                                                </div>
                                            );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            
             <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button onClick={() => handleAddClick(new Date(), 9)} className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full shadow-lg animate-pulse-glow" size="icon">
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
                        <DialogTitle>{bookingToEdit && bookingToEdit.patientId ? t('surgery.editBooking') : t('surgery.newBooking')}</DialogTitle>
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

function BookingForm({ onSave, bookingToEdit }: { onSave: (data: z.infer<typeof formSchema>) => void; bookingToEdit?: Partial<SurgeryBooking> | null }) {
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
                patientId: bookingToEdit.patientId || '',
                date: bookingToEdit.date ? new Date(bookingToEdit.date) : new Date(), // Make sure it's a Date object
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
                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!bookingToEdit?.patientId}>
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
                    <FormItem><FormLabel>{t('surgery.status.title')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
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
