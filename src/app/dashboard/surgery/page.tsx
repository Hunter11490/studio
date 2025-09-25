
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Scissors, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

type SurgeryBooking = {
    id: string;
    patientName: string;
    surgeryType: string;
    surgeonName: string;
    date: Date;
    status: 'scheduled' | 'completed' | 'canceled';
};

const formSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  surgeryType: z.string().min(1, 'Surgery type is required'),
  surgeonName: z.string().min(1, 'Surgeon name is required'),
  date: z.date(),
  status: z.enum(['scheduled', 'completed', 'canceled']),
});

const initialBookings: SurgeryBooking[] = [
    { id: '1', patientName: 'علي حسن', surgeryType: 'استئصال الزائدة', surgeonName: 'د. أحمد الجميلي', date: new Date(), status: 'scheduled' },
    { id: '2', patientName: 'نور محمد', surgeryType: 'جراحة القلب المفتوح', surgeonName: 'د. علي الساعدي', date: addDays(new Date(), 1), status: 'scheduled' },
];

export default function SurgeryPage() {
    const { t, lang } = useLanguage();
    const [bookings, setBookings] = useLocalStorage<SurgeryBooking[]>('surgery_bookings', initialBookings);
    const [isFormOpen, setFormOpen] = useState(false);
    const [bookingToEdit, setBookingToEdit] = useState<SurgeryBooking | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 }); // Saturday
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    const handleSaveBooking = (data: z.infer<typeof formSchema>) => {
        if (bookingToEdit) {
            setBookings(prev => prev.map(b => b.id === bookingToEdit.id ? { ...b, ...data } : b));
        } else {
            const newBooking: SurgeryBooking = { id: new Date().toISOString(), ...data };
            setBookings(prev => [...prev, newBooking]);
        }
        setFormOpen(false);
        setBookingToEdit(null);
    };

    const handleAddClick = (date: Date) => {
        setBookingToEdit(null);
        const form = document.querySelector('form');
        if (form) {
            // How to reset a form with a date?
        }
        setFormOpen(true);
    };
    
    const changeWeek = (direction: 'next' | 'prev') => {
        setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };

    const StatusBadge = ({ status }: { status: SurgeryBooking['status'] }) => {
        const variants = {
            scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            canceled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${variants[status]}`}>{t(`surgery.status.${status}`)}</span>
    }

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                     <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.surgicalOperations')}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <UserMenu />
                </div>
            </header>

            <main className="flex-grow flex flex-col p-4 md:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeWeek('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                        <h2 className="text-lg font-semibold text-center w-48">
                           {format(weekStart, 'dd MMM yyyy', {locale: lang === 'ar' ? ar : undefined})}
                        </h2>
                        <Button variant="outline" size="icon" onClick={() => changeWeek('next')}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    <Button onClick={() => handleAddClick(new Date())}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('surgery.newBooking')}
                    </Button>
                </div>
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
                    {weekDays.map(day => {
                        const dayBookings = bookings.filter(b => isSameDay(new Date(b.date), day));
                        return (
                            <div key={day.toString()} className="bg-secondary/50 rounded-lg flex flex-col">
                                <div className="p-2 border-b text-center font-semibold">
                                    {format(day, 'EEE dd', {locale: lang === 'ar' ? ar : undefined})}
                                </div>
                                <div className="p-2 space-y-2 flex-grow overflow-y-auto">
                                    {dayBookings.map(booking => (
                                        <Card key={booking.id} className="cursor-pointer hover:shadow-md" onClick={() => { setBookingToEdit(booking); setFormOpen(true) }}>
                                            <CardContent className="p-2 text-xs">
                                                <p className="font-bold truncate">{booking.patientName}</p>
                                                <p className="text-muted-foreground truncate">{booking.surgeryType}</p>
                                                <p className="text-muted-foreground truncate">{booking.surgeonName}</p>
                                                <div className="mt-1">
                                                   <StatusBadge status={booking.status} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {dayBookings.length === 0 && <div className="text-center text-xs text-muted-foreground py-4">{t('surgery.noBookings')}</div>}
                                </div>
                                <Button variant="ghost" size="sm" className="m-1" onClick={() => handleAddClick(day)}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </main>

             <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{bookingToEdit ? t('surgery.editBooking') : t('surgery.newBooking')}</DialogTitle>
                    </DialogHeader>
                    <BookingForm onSave={handleSaveBooking} bookingToEdit={bookingToEdit} />
                </DialogContent>
            </Dialog>
        </div>
    );
}


function BookingForm({ onSave, bookingToEdit }: { onSave: (data: z.infer<typeof formSchema>) => void; bookingToEdit?: SurgeryBooking | null }) {
    const { t } = useLanguage();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            patientName: '',
            surgeryType: '',
            surgeonName: '',
            date: new Date(),
            status: 'scheduled',
        },
    });

     useEffect(() => {
        if (bookingToEdit) {
            form.reset({
                ...bookingToEdit,
                date: new Date(bookingToEdit.date), // Make sure it's a Date object
            });
        } else {
            form.reset({
                patientName: '',
                surgeryType: '',
                surgeonName: '',
                date: new Date(),
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
                 <FormField control={form.control} name="patientName" render={({ field }) => (
                    <FormItem><FormLabel>{t('surgery.patientName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
