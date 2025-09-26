'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Send } from 'lucide-react';
import { IRAQI_GOVERNORATES } from '@/lib/constants';
import { differenceInYears, isValid, parse } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FinancialRecord } from '@/types';

const formSchema = z.object({
  patientName: z.string().min(1, { message: 'reception.validation.patientNameRequired' }),
  dob: z.object({
    day: z.string().min(1, { message: 'reception.validation.dayRequired' }),
    month: z.string().min(1, { message: 'reception.validation.monthRequired' }),
    year: z.string().min(1, { message: 'reception.validation.yearRequired' }),
  }),
  address: z.object({
    governorate: z.string().min(1, { message: 'reception.validation.governorateRequired' }),
    region: z.string().min(1, { message: 'reception.validation.regionRequired' }),
    mahalla: z.string().min(1, { message: 'reception.validation.mahallaRequired' }),
    zuqaq: z.string().min(1, { message: 'reception.validation.zuqaqRequired' }),
    dar: z.string().min(1, { message: 'reception.validation.darRequired' }),
  }),
  floor: z.number(),
  room: z.number(),
});

type InpatientAdmissionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledRoom: { floor: number; room: number } | null;
};

export function InpatientAdmissionDialog({ open, onOpenChange, prefilledRoom }: InpatientAdmissionDialogProps) {
  const { t, dir } = useLanguage();
  const { addPatient } = usePatients();
  const { toast } = useToast();
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: '',
      dob: { day: '', month: '', year: '' },
      address: { governorate: '', region: '', mahalla: '', zuqaq: '', dar: '' },
      floor: 1,
      room: 1,
    },
  });

  useEffect(() => {
    if (open && prefilledRoom) {
      form.reset({
        patientName: '',
        dob: { day: '', month: '', year: '' },
        address: { governorate: 'بغداد', region: '', mahalla: '', zuqaq: '', dar: '' },
        floor: prefilledRoom.floor,
        room: prefilledRoom.room,
      });
    }
  }, [prefilledRoom, open, form]);

  const dob = form.watch('dob');
  useEffect(() => {
    const { day, month, year } = dob;
    if (day && month && year && year.length === 4) {
      const date = parse(`${year}-${month}-${day}`, 'yyyy-MM-dd', new Date());
      if (isValid(date)) {
        setCalculatedAge(differenceInYears(new Date(), date));
      } else {
        setCalculatedAge(null);
      }
    } else {
      setCalculatedAge(null);
    }
  }, [dob]);
  
  useEffect(() => {
    if (!open) {
      form.reset();
      setCalculatedAge(null);
    }
  }, [open, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const initialRecord: Omit<FinancialRecord, 'id' | 'date'> = {
        type: 'inpatient',
        description: t('wards.admissionFee'),
        amount: 150000 // Example admission fee
    };

    const patientData = { 
        ...values, 
        receptionDate: getTodayDateString(),
        department: 'wards'
    };

    addPatient(patientData, initialRecord);
    toast({
      title: t('wards.admissionSuccessTitle'),
      description: t('wards.admissionSuccessDesc', { patientName: values.patientName, floor: values.floor, room: values.room }),
    });
    onOpenChange(false);
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg flex flex-col h-full sm:h-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle>{t('wards.directAdmissionTitle')}</DialogTitle>
            <DialogDescription>{t('wards.directAdmissionDesc', { room: prefilledRoom ? (prefilledRoom.floor * 100 + prefilledRoom.room) : '' })}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
             <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-6 py-4">
                <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('reception.patientName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('reception.patientNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage>{t(form.formState.errors.patientName?.message || '')}</FormMessage>
                      </FormItem>
                    )}
                  />

                <div className="space-y-2">
                  <FormLabel>{t('reception.dob')}</FormLabel>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 items-start">
                    <FormField
                      control={form.control}
                      name="dob.day"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder={t('reception.day')} {...field} /></FormControl>
                          <FormMessage>{t(form.formState.errors.dob?.day?.message || '')}</FormMessage>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob.month"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder={t('reception.month')} {...field} /></FormControl>
                          <FormMessage>{t(form.formState.errors.dob?.month?.message || '')}</FormMessage>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob.year"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl><Input placeholder={t('reception.year')} {...field} /></FormControl>
                          <FormMessage>{t(form.formState.errors.dob?.year?.message || '')}</FormMessage>
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                      <span className="text-sm font-medium text-muted-foreground">{t('reception.age')}: {calculatedAge !== null ? `${calculatedAge} ${t('reception.years')}`: '...'}</span>
                    </div>
                  </div>
                </div>
              </div>
             </ScrollArea>
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('doctorForm.cancel')}
                </Button>
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  {t('wards.admitPatient')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}
