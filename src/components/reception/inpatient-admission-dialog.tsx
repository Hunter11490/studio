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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Send } from 'lucide-react';
import { FinancialRecord, Patient } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  patientId: z.string().min(1, { message: 'reception.validation.patientNameRequired' }),
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
  const { patients, updatePatient, addFinancialRecord } = usePatients();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      floor: 1,
      room: 1,
    },
  });

  const availablePatients = useMemo(() => {
    return patients.filter(p => !p.floor && !p.room && p.status !== 'Discharged');
  }, [patients]);

  useEffect(() => {
    if (open && prefilledRoom) {
      form.reset({
        patientId: '',
        floor: prefilledRoom.floor,
        room: prefilledRoom.room,
      });
    }
  }, [prefilledRoom, open, form]);
  
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { patientId, floor, room } = values;

    // Update patient record with floor and room
    updatePatient(patientId, {
      floor,
      room,
      admittedAt: new Date().toISOString(),
      status: 'Admitted',
      department: 'wards'
    });
    
    // Add admission fee to financial records
    addFinancialRecord(patientId, {
        type: 'inpatient',
        description: t('wards.admissionFee'),
        amount: 150000, // Example admission fee
        date: new Date().toISOString()
    });
    
    const patient = patients.find(p => p.id === patientId);

    toast({
      title: t('wards.admissionSuccessTitle'),
      description: t('wards.admissionSuccessDesc', { patientName: patient?.patientName || 'Patient', floor: values.floor, room: values.floor * 100 + values.room }),
    });
    onOpenChange(false);
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle>{t('wards.directAdmissionTitle')}</DialogTitle>
            <DialogDescription>{t('wards.selectPatientForRoom', { room: prefilledRoom ? (prefilledRoom.floor * 100 + prefilledRoom.room) : '' })}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reception.patientName')}</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('wards.selectPatientPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {availablePatients.length > 0 ? (
                                availablePatients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">{t('wards.noAvailablePatients')}</div>
                            )}
                        </SelectContent>
                      </Select>
                    <FormMessage>{t(form.formState.errors.patientId?.message || '')}</FormMessage>
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('doctorForm.cancel')}
                </Button>
                <Button type="submit" disabled={!form.watch('patientId')}>
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
