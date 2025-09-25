'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Send } from 'lucide-react';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';

const departments = [
  'emergency', 'icu', 'surgicalOperations', 'pharmacy', 'laboratories', 'radiology', 'nursing', 'internalMedicine', 'generalSurgery', 'obGyn', 'pediatrics', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'cardiology', 'neurology', 'oncology', 'nephrology', 'accounts', 'medicalRecords', 'sterilization', 'services'
];

const formSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientAge: z.string().min(1, 'Patient age is required'),
  department: z.string().min(1, 'Department is required'),
  doctorId: z.string().optional(),
});

export default function ReceptionPage() {
  const { t } = useLanguage();
  const { doctors } = useDoctors();
  const { toast } = useToast();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: '',
      patientAge: '',
      department: '',
      doctorId: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Patient Registered:', values);
    toast({
      title: t('reception.submitSuccessTitle'),
      description: t('reception.submitSuccessDesc', {patientName: values.patientName, department: t(`departments.${values.department}`)}),
    });
    form.reset();
  };

  return (
    <>
     <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col items-center">
             <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.reception')}</h1>
        </div>
        <div className="flex items-center gap-4">
            <UserMenu />
        </div>
      </header>
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t('reception.title')}</CardTitle>
          <CardDescription>{t('reception.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reception.patientName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('reception.patientName')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patientAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reception.patientAge')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('reception.patientAge')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reception.assignDepartment')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reception.assignDepartment')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {t(`departments.${dept}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reception.assignDoctor')}</FormLabel>
                     <div className="flex gap-2">
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={doctors.length === 0}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder={t('reception.assignDoctor')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {doctors.map((doc) => (
                                <SelectItem key={doc.id} value={doc.id}>
                                    {doc.name} - {doc.specialty}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setAddDoctorOpen(true)}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                {t('reception.submitPatient')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
    </div>
    </>
  );
}
