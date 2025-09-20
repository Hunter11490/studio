'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { Doctor, Patient } from '@/types';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';


const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().optional(),
  referralDate: z.string().min(1, 'Referral date is required'),
  visitDate: z.string().optional(),
  status: z.enum(['Pending', 'Visited', 'Canceled']),
  notes: z.string().optional(),
});

type PatientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor;
  patientToEdit?: Patient;
};

export function PatientFormDialog({ open, onOpenChange, doctor, patientToEdit }: PatientFormDialogProps) {
  const { addPatient, updatePatient } = usePatients();
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      referralDate: format(new Date(), 'yyyy-MM-dd'),
      visitDate: '',
      status: 'Pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (patientToEdit) {
        form.reset({
          name: patientToEdit.name,
          phoneNumber: patientToEdit.phoneNumber,
          referralDate: format(parseISO(patientToEdit.referralDate), 'yyyy-MM-dd'),
          visitDate: patientToEdit.visitDate ? format(parseISO(patientToEdit.visitDate), 'yyyy-MM-dd') : '',
          status: patientToEdit.status,
          notes: patientToEdit.notes,
        });
      } else {
        form.reset({
            name: '',
            phoneNumber: '',
            referralDate: format(new Date(), 'yyyy-MM-dd'),
            visitDate: '',
            status: 'Pending',
            notes: '',
        });
      }
    }
  }, [patientToEdit, open, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const patientData = {
        ...values,
        visitDate: values.visitDate ? new Date(values.visitDate).toISOString() : null,
        referralDate: new Date(values.referralDate).toISOString(),
    };

    if (patientToEdit) {
      updatePatient(patientToEdit.id, patientData);
      toast({ title: t('patient.patientUpdated') });
    } else {
      addPatient({ ...patientData, referringDoctorId: doctor.id });
      toast({ title: t('patient.patientAdded') });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {patientToEdit ? t('patient.editPatientTitle') : t('patient.addPatientTitle')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('patient.patientName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('patient.phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('patient.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Pending">{t('patient.statusOptions.Pending')}</SelectItem>
                        <SelectItem value="Visited">{t('patient.statusOptions.Visited')}</SelectItem>
                        <SelectItem value="Canceled">{t('patient.statusOptions.Canceled')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="referralDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('patient.referralDate')}</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('patient.visitDate')}</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('patient.notes')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('doctorForm.cancel')}
              </Button>
              <Button type="submit">{t('patient.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
