'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Star,
  Plus,
  Minus,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  BadgePercent,
  CalendarDays,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Doctor } from '@/types';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { DoctorFormDialog } from './doctor-form-dialog';
import { cn } from '@/lib/utils';
import { StethoscopeLogo } from '../stethoscope-logo';


const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { updateDoctor, deleteDoctor } = useDoctors();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setEditing] = useState(false);

  const referralCount = doctor.referralCount;
  const commission = referralCount * 100;

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: t('toasts.locationError'), description: 'Geolocation is not supported by your browser.', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        updateDoctor(doctor.id, { mapLocation: mapUrl });
        toast({ title: 'Location set successfully!' });
      },
      () => {
        toast({ title: t('toasts.locationError'), description: 'Please enable location permissions.', variant: 'destructive' });
      }
    );
  };
  
  const handleAvailabilityToggle = (day: string) => {
    const newDays = doctor.availableDays.includes(day)
      ? doctor.availableDays.filter(d => d !== day)
      : [...doctor.availableDays, day];
    updateDoctor(doctor.id, { availableDays: newDays });
  };

  const handlePartnerToggle = () => {
    updateDoctor(doctor.id, { isPartner: !doctor.isPartner });
  };

  const handleReferralChange = (amount: number) => {
    const newCount = Math.max(0, referralCount + amount);
    updateDoctor(doctor.id, { referralCount: newCount });
  };
  
  const handleDeleteDoctor = () => {
      deleteDoctor(doctor.id);
  }

  return (
    <>
      <Card className={cn("flex flex-col relative overflow-hidden", doctor.isPartner && "border-primary shadow-lg")}>
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-5">
            <StethoscopeLogo className="h-48 w-48 text-muted-foreground" />
        </div>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            {doctor.isPartner ? (
              <Badge className="w-fit bg-primary">
                <Star className="mr-1 h-3 w-3" />
                {t('doctorCard.partner')}
              </Badge>
            ) : <div />}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handlePartnerToggle}>
                {doctor.isPartner ? <ToggleRight className="text-primary" /> : <ToggleLeft />}
            </Button>
          </div>
          
            <>
                <CardTitle className="font-headline text-xl">{doctor.name}</CardTitle>
                <CardDescription>{doctor.specialty}</CardDescription>
            </>
          
        </CardHeader>

        <CardContent className="p-4 flex-grow space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BadgePercent className="h-4 w-4" />
              <span>{t('doctorCard.referrals')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleReferralChange(-1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-4 text-center">{referralCount}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleReferralChange(1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
                <span>{t('doctorCard.commission')}</span>
            </div>
            <span className="font-semibold text-accent">{commission.toLocaleString()} {t('doctorCard.usd')}</span>
          </div>

          <Separator />
          
          <div className="space-y-2">
            <p className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" /> 
                <a href={`tel:${doctor.phoneNumber}`} className="hover:underline" dir="ltr">{doctor.phoneNumber}</a>
            </p>
            <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{doctor.clinicAddress}</span>
            </p>
          </div>
          
           <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <CalendarDays className="h-4 w-4" />
              <span>{t('doctorCard.availability')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WEEK_DAYS.map(day => (
                <Button
                  key={day}
                  size="sm"
                  variant={doctor.availableDays.includes(day) ? 'default' : 'outline'}
                  onClick={() => handleAvailabilityToggle(day)}
                  className="h-7 px-2.5"
                >
                  {t(`doctorCard.days.${day}` as any)}
                </Button>
              ))}
            </div>
          </div>

        </CardContent>

        <CardFooter className="p-4 flex-col gap-2 items-stretch">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(doctor.mapLocation, '_blank')} disabled={!doctor.mapLocation}>
              <MapPin className="mr-1 h-4 w-4" /> {t('doctorCard.map')}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleSetLocation}>
              {t('doctorCard.setMyLocation')}
            </Button>
          </div>
          <div className="flex gap-2">
             <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-4 w-4" /> {t('doctorCard.edit')}
            </Button>
            <ConfirmationDialog
                trigger={<Button variant="destructive" size="sm" className="flex-1"><Trash2 className="mr-1 h-4 w-4" /> {t('doctorCard.delete')}</Button>}
                title={t('dialogs.deleteDoctorTitle')}
                description={`${t('dialogs.deleteDoctorDesc')} (${doctor.name})`}
                onConfirm={handleDeleteDoctor}
            />
          </div>
        </CardFooter>
      </Card>
      
      <DoctorFormDialog open={isEditing} onOpenChange={setEditing} doctorToEdit={doctor} />
    </>
  );
}
