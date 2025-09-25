'use client';

import { useState, useEffect } from 'react';
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
import { UserPlus, Send, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { IRAQI_GOVERNORATES } from '@/lib/constants';
import { differenceInYears, isValid, parse } from 'date-fns';
import Image from 'next/image';

const departments = [
  'emergency', 'icu', 'surgicalOperations', 'pharmacy', 'laboratories', 'radiology', 'nursing', 'internalMedicine', 'generalSurgery', 'obGyn', 'pediatrics', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'cardiology', 'neurology', 'oncology', 'nephrology', 'bloodBank', 'accounts', 'medicalRecords', 'sterilization', 'services'
];

const formSchema = z.object({
  patientName: z.string().min(1, { message: 'reception.validation.patientNameRequired' }),
  dob: z.object({
    day: z.string().min(1, { message: 'reception.validation.dayRequired' }),
    month: z.string().min(1, { message: 'reception.validation.monthRequired' }),
    year: z.string().min(1, { message: 'reception.validation.yearRequired' }),
  }),
  receptionDate: z.string().min(1, { message: 'reception.validation.receptionDateRequired' }),
  address: z.object({
    governorate: z.string().min(1, { message: 'reception.validation.governorateRequired' }),
    region: z.string().min(1, { message: 'reception.validation.regionRequired' }),
    mahalla: z.string().min(1, { message: 'reception.validation.mahallaRequired' }),
    zuqaq: z.string().min(1, { message: 'reception.validation.zuqaqRequired' }),
    dar: z.string().min(1, { message: 'reception.validation.darRequired' }),
  }),
  idFront: z.string().optional(),
  idBack: z.string().optional(),
  department: z.string().min(1, { message: 'reception.validation.departmentRequired' }),
  doctorId: z.string().optional(),
});

export default function ReceptionPage() {
  const { t, dir } = useLanguage();
  const { doctors } = useDoctors();
  const { toast } = useToast();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  
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
      receptionDate: getTodayDateString(),
      address: { governorate: '', region: '', mahalla: '', zuqaq: '', dar: '' },
      idFront: '',
      idBack: '',
      department: '',
      doctorId: '',
    },
  });

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'idFront' | 'idBack', setPreview: (url: string | null) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue(fieldName, dataUrl);
        setPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Patient Registered:', {...values, age: calculatedAge});
    toast({
      title: t('reception.submitSuccessTitle'),
      description: t('reception.submitSuccessDesc', {patientName: values.patientName, department: t(`departments.${values.department}`)}),
    });
    form.reset();
    setCalculatedAge(null);
    setIdFrontPreview(null);
    setIdBackPreview(null);
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
    <div className="flex justify-center items-start p-4 md:p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>{t('reception.title')}</CardTitle>
          <CardDescription>{t('reception.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              
               <FormField
                control={form.control}
                name="receptionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reception.receptionDate')}</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage>{t(form.formState.errors.receptionDate?.message || '')}</FormMessage>
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>{t('reception.address')}</FormLabel>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name="address.governorate"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('reception.governorate')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir={dir}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder={t('reception.governoratePlaceholder')} /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Object.keys(IRAQI_GOVERNORATES).map((gov) => (
                                <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                           <FormMessage>{t(form.formState.errors.address?.governorate?.message || '')}</FormMessage>
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="address.region"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('reception.region')}</FormLabel>
                                <FormControl><Input placeholder={t('reception.regionPlaceholder')} {...field} /></FormControl>
                                <FormMessage>{t(form.formState.errors.address?.region?.message || '')}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.mahalla"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('reception.mahalla')}</FormLabel>
                                <FormControl><Input placeholder="e.g. 123" {...field} /></FormControl>
                                <FormMessage>{t(form.formState.errors.address?.mahalla?.message || '')}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.zuqaq"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('reception.zuqaq')}</FormLabel>
                                <FormControl><Input placeholder="e.g. 45" {...field} /></FormControl>
                                <FormMessage>{t(form.formState.errors.address?.zuqaq?.message || '')}</FormMessage>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="address.dar"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('reception.dar')}</FormLabel>
                                <FormControl><Input placeholder="e.g. 6" {...field} /></FormControl>
                                <FormMessage>{t(form.formState.errors.address?.dar?.message || '')}</FormMessage>
                            </FormItem>
                        )}
                    />
                </div>
              </div>
              
              <div className="space-y-2">
                <FormLabel>{t('reception.idUpload')}</FormLabel>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="idFront"
                        render={() => (
                           <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">{t('reception.idFront')}</FormLabel>
                              <FormControl>
                                 <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                                    {idFrontPreview ? (
                                        <Image src={idFrontPreview} alt="ID Front Preview" fill className="object-contain rounded-lg p-1" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">{t('doctorForm.imageUploadTip')}</p>
                                        </div>
                                    )}
                                    <Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0" onChange={(e) => handleFileChange(e, 'idFront', setIdFrontPreview)} accept="image/*" />
                                 </label>
                              </FormControl>
                           </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="idBack"
                        render={() => (
                           <FormItem>
                               <FormLabel className="text-sm text-muted-foreground">{t('reception.idBack')}</FormLabel>
                              <FormControl>
                                 <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                                    {idBackPreview ? (
                                        <Image src={idBackPreview} alt="ID Back Preview" fill className="object-contain rounded-lg p-1" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">{t('doctorForm.imageUploadTip')}</p>
                                        </div>
                                    )}
                                    <Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0" onChange={(e) => handleFileChange(e, 'idBack', setIdBackPreview)} accept="image/*" />
                                 </label>
                              </FormControl>
                           </FormItem>
                        )}
                    />
                 </div>
              </div>


              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reception.assignDepartment')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir={dir}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('reception.assignDepartmentPlaceholder')} />
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
                    <FormMessage>{t(form.formState.errors.department?.message || '')}</FormMessage>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={doctors.length === 0} dir={dir}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder={t('reception.assignDoctorPlaceholder')} />
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
