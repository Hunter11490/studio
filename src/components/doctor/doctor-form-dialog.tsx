'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Doctor } from '@/types';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  specialty: z.string().min(1, 'Specialty is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  clinicAddress: z.string().min(1, 'Address is required'),
  clinicCardImageUrl: z.string().optional(),
  isPartner: z.boolean().default(false),
});

type DoctorFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorToEdit?: Doctor;
};

export function DoctorFormDialog({ open, onOpenChange, doctorToEdit }: DoctorFormDialogProps) {
  const { addDoctor, updateDoctor } = useDoctors();
  const { t, dir } = useLanguage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      specialty: '',
      phoneNumber: '',
      clinicAddress: '',
      clinicCardImageUrl: '',
      isPartner: false,
    },
  });
  
  useEffect(() => {
    if (open) {
      window.history.pushState({ dialog: 'doctorForm' }, '');
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.dialog === 'doctorForm') {
          onOpenChange(false);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && window.history.state?.dialog === 'doctorForm') {
      window.history.back();
    }
    onOpenChange(isOpen);
  };

  useEffect(() => {
    if (doctorToEdit) {
      form.reset({
        name: doctorToEdit.name,
        specialty: doctorToEdit.specialty,
        phoneNumber: doctorToEdit.phoneNumber,
        clinicAddress: doctorToEdit.clinicAddress,
        clinicCardImageUrl: doctorToEdit.clinicCardImageUrl,
        isPartner: doctorToEdit.isPartner,
      });
      setImagePreview(doctorToEdit.clinicCardImageUrl);
    } else {
      form.reset({
        name: '',
        specialty: '',
        phoneNumber: '',
        clinicAddress: '',
        clinicCardImageUrl: '',
        isPartner: false,
      });
      setImagePreview(null);
    }
  }, [doctorToEdit, open, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue('clinicCardImageUrl', dataUrl);
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const doctorData = {
      ...values,
      referralCount: doctorToEdit?.referralCount || 0,
      referralNotes: doctorToEdit?.referralNotes || [],
      mapLocation: doctorToEdit?.mapLocation || '',
      availableDays: doctorToEdit?.availableDays || [],
    };

    if (doctorToEdit) {
      updateDoctor(doctorToEdit.id, doctorData);
    } else {
      addDoctor(doctorData);
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col h-full sm:h-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="font-headline">
            {doctorToEdit ? t('doctorForm.editTitle') : t('doctorForm.addTitle')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
            <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('doctorForm.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('doctorForm.specialty')}</FormLabel>
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
                      <FormLabel>{t('doctorForm.phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clinicAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('doctorForm.clinicAddress')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clinicCardImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('doctorForm.clinicCardImage')}</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center gap-2">
                            {imagePreview && <Image src={imagePreview} alt="Preview" width={200} height={100} className="rounded-md object-cover" />}
                            <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">{t('doctorForm.imageUploadTip')}</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="absolute top-0 left-0 w-full h-full opacity-0" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPartner"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 rtl:space-x-reverse">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('doctorForm.isPartner')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t('doctorForm.cancel')}
              </Button>
              <Button type="submit">{t('doctorForm.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
