'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Send, UploadCloud, HeartPulse, Activity, Wind, Thermometer } from 'lucide-react';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { IRAQI_GOVERNORATES } from '@/lib/constants';
import { differenceInYears, isValid, parse } from 'date-fns';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import { Patient, FinancialRecord, TriageLevel, VitalSigns } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

const departments = [
  'reception', 'emergency', 'icu', 'wards', 'surgicalOperations', 'pharmacy', 'laboratories', 'radiology', 'nursing', 'internalMedicine', 'generalSurgery', 'obGyn', 'pediatrics', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'cardiology', 'neurology', 'oncology', 'nephrology', 'bloodBank', 'accounts', 'medicalRecords', 'sterilization', 'services', 'representatives', 'admin'
];

const medicalDepartments = [
  'internalMedicine', 'generalSurgery', 'obGyn', 'pediatrics', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'cardiology', 'neurology', 'oncology', 'nephrology'
];

const triageLevels: TriageLevel[] = ['minor', 'stable', 'urgent', 'critical'];

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
  serviceId: z.string().optional(),
  examiningDoctorId: z.string().optional(),
  consultationFee: z.coerce.number().optional(),
  floor: z.number().optional(),
  room: z.number().optional(),
  // Emergency fields
  triageLevel: z.custom<TriageLevel>().optional(),
  vitalSigns: z.object({
      heartRate: z.coerce.number().optional(),
      bloodPressure: z.string().optional(),
      spo2: z.coerce.number().optional(),
      temperature: z.coerce.number().optional()
  }).optional(),
});

type LabTest = { id: string; name: string; price: number; };
type Drug = { id: string; name: string; quantity: number; price: number; };

type PatientRegistrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientToEdit?: Patient;
  prefilledRoom?: { floor: number; room: number } | null;
};

export function PatientRegistrationDialog({ open, onOpenChange, patientToEdit, prefilledRoom }: PatientRegistrationDialogProps) {
  const { t, dir } = useLanguage();
  const { doctors } = useDoctors();
  const { addPatient, updatePatient } = usePatients();
  const { toast } = useToast();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);

  const [labTests] = useLocalStorage<LabTest[]>('lab_tests_list', []);
  const [drugs] = useLocalStorage<Drug[]>('pharmacy_drugs', []);

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
      serviceId: '',
      examiningDoctorId: '',
      consultationFee: 25000,
      floor: undefined,
      room: undefined,
      triageLevel: 'stable',
      vitalSigns: { heartRate: 80, bloodPressure: '120/80', spo2: 98, temperature: 37.0 }
    },
  });
  
  const department = form.watch('department');
  const serviceId = form.watch('serviceId');

  const servicesForDepartment = useMemo(() => {
    if (department === 'laboratories') return labTests;
    if (department === 'pharmacy') return drugs;
    return [];
  }, [department, labTests, drugs]);
  
  const isMedicalDepartment = medicalDepartments.includes(department);

  const doctorsForDepartment = useMemo(() => {
    if (!department) return [];
    return doctors.filter(d => d.specialty.toLowerCase().replace(/ /g, '') === department.toLowerCase());
  }, [department, doctors]);

  useEffect(() => {
    if (open) {
        if (patientToEdit) {
            const dobParts = patientToEdit.dob || { day: '', month: '', year: '' };
            form.reset({
                ...patientToEdit,
                dob: dobParts,
                vitalSigns: patientToEdit.vitalSigns || { heartRate: 80, bloodPressure: '120/80', spo2: 98, temperature: 37.0 }
            });
            setIdFrontPreview(patientToEdit.idFront || null);
            setIdBackPreview(patientToEdit.idBack || null);
        } else if (prefilledRoom) {
             form.reset({
                patientName: '',
                dob: { day: '', month: '', year: '' },
                receptionDate: getTodayDateString(),
                address: { governorate: 'بغداد', region: '', mahalla: '', zuqaq: '', dar: '' },
                idFront: '',
                idBack: '',
                department: 'wards',
                doctorId: '',
                floor: prefilledRoom.floor,
                room: prefilledRoom.room,
            });
            setIdFrontPreview(null);
            setIdBackPreview(null);
        }
        else {
            form.reset({
                patientName: '',
                dob: { day: '', month: '', year: '' },
                receptionDate: getTodayDateString(),
                address: { governorate: '', region: '', mahalla: '', zuqaq: '', dar: '' },
                idFront: '',
                idBack: '',
                department: '',
                doctorId: '',
                serviceId: '',
                examiningDoctorId: '',
                consultationFee: 25000,
                triageLevel: 'stable',
                vitalSigns: { heartRate: 80, bloodPressure: '120/80', spo2: 98, temperature: 37.0 }
            });
            setIdFrontPreview(null);
            setIdBackPreview(null);
        }
    }
  }, [patientToEdit, prefilledRoom, open, form]);


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
      setIdFrontPreview(null);
      setIdBackPreview(null);
    }
  }, [open, form]);

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
    let initialRecord: Omit<FinancialRecord, 'id' | 'date'> | undefined = undefined;
    
    if (values.serviceId && servicesForDepartment.length > 0) {
        const service = servicesForDepartment.find(s => s.id === values.serviceId);
        if(service) {
            initialRecord = {
                type: department as any,
                description: service.name,
                amount: service.price
            }
        }
    } else if (isMedicalDepartment) {
        const examiningDoctor = doctors.find(d => d.id === values.examiningDoctorId);
        if (examiningDoctor && values.consultationFee) {
            initialRecord = {
                type: 'consultation',
                description: `${t('reception.consultationFee')} - ${examiningDoctor.name}`,
                amount: values.consultationFee
            }
        }
    } else if (values.department === 'wards' || prefilledRoom) {
         initialRecord = {
            type: 'inpatient',
            description: t('wards.admissionFee'),
            amount: 150000
        }
    }

    const patientData = { ...values, status: values.department === 'emergency' ? 'Waiting' : undefined };
    delete (patientData as any).serviceId;
    delete (patientData as any).examiningDoctorId;
    delete (patientData as any).consultationFee;

    if (patientToEdit) {
      updatePatient(patientToEdit.id, patientData);
      toast({
        title: t('reception.updateSuccessTitle'),
        description: t('reception.updateSuccessDesc', {patientName: values.patientName}),
      });
    } else {
      addPatient(patientData, initialRecord);
      toast({
        title: t('reception.submitSuccessTitle'),
        description: t('reception.submitSuccessDesc', {patientName: values.patientName, department: t(`departments.${values.department}`)}),
      });
    }
    onOpenChange(false);
  };

  const isEditing = !!patientToEdit;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl h-full sm:h-auto flex flex-col" dir={dir}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t('reception.editTitle') : t('reception.title')}</DialogTitle>
            <DialogDescription>{isEditing ? t('reception.editDescription') : t('reception.description')}</DialogDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir={dir} disabled={!!prefilledRoom}>
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
                
                 {(department === 'emergency' || patientToEdit?.department === 'emergency' || patientToEdit?.department === 'icu') && (
                    <div className="p-4 border rounded-lg space-y-4">
                        {department === 'emergency' &&
                            <FormField
                                control={form.control}
                                name="triageLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('emergency.triage.title')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir={dir}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {triageLevels.map(level => (
                                                    <SelectItem key={level} value={level}>{t(`emergency.triage.${level}`)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                            )}/>
                        }
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="vitalSigns.heartRate" render={({ field }) => (<FormItem><FormLabel className="text-xs flex items-center gap-1"><HeartPulse className="h-3 w-3"/>{t('emergency.vitals.heartRate')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="vitalSigns.bloodPressure" render={({ field }) => (<FormItem><FormLabel className="text-xs flex items-center gap-1"><Activity className="h-3 w-3"/>{t('emergency.vitals.bloodPressure')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="vitalSigns.spo2" render={({ field }) => (<FormItem><FormLabel className="text-xs flex items-center gap-1"><Wind className="h-3 w-3"/>{t('emergency.vitals.spo2')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="vitalSigns.temperature" render={({ field }) => (<FormItem><FormLabel className="text-xs flex items-center gap-1"><Thermometer className="h-3 w-3"/>{t('emergency.vitals.temperature')}</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>
                 )}

                {isMedicalDepartment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name="examiningDoctorId"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('reception.examiningDoctor')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir={dir} disabled={doctorsForDepartment.length === 0}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('reception.examiningDoctorPlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {doctorsForDepartment.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="consultationFee"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('reception.consultationFee')}</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {servicesForDepartment.length > 0 && (
                     <FormField
                        control={form.control}
                        name="serviceId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('reception.serviceRequired')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir={dir}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('reception.selectServicePlaceholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {servicesForDepartment.map((service) => (
                                    <SelectItem key={service.id} value={service.id}>
                                        {service.name} - {service.price.toLocaleString()} {t('lab.iqd')}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reception.referredBy')}</FormLabel>
                      <div className="flex gap-2">
                          <Select onValueChange={field.onChange} value={field.value} disabled={doctors.length === 0} dir={dir}>
                              <FormControl>
                                  <SelectTrigger>
                                  <SelectValue placeholder={t('reception.referredByPlaceholder')} />
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
              </div>
             </ScrollArea>
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('doctorForm.cancel')}
                </Button>
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  {isEditing ? t('reception.updatePatient') : t('reception.submitPatient')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
    </>
  );
}
