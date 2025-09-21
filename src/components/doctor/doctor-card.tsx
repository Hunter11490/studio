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
  ClipboardList,
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
import { ReferralNotesDialog } from './referral-notes-dialog';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


const WEEK_DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { updateDoctor, deleteDoctor } = useDoctors();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setEditing] = useState(false);
  const [isReferralSheetOpen, setReferralSheetOpen] = useState(false);

  const referralCount = doctor.referralCount || 0;
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
    const currentDays = doctor.availableDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateDoctor(doctor.id, { availableDays: newDays });
  };

  const handlePartnerToggle = () => {
    updateDoctor(doctor.id, { isPartner: !doctor.isPartner });
  };

  const handleReferralChange = (amount: number) => {
    const newCount = Math.max(0, referralCount + amount);
    const newNotes = [...(doctor.referralNotes || [])];
    
    if (newCount > newNotes.length) {
        for (let i = newNotes.length; i < newCount; i++) {
            newNotes.push({ patientName: '', referralDate: '', testType: '', patientAge: '', chronicDiseases: '' });
        }
    } else {
        newNotes.length = newCount;
    }

    updateDoctor(doctor.id, { referralCount: newCount, referralNotes: newNotes });
};
  
  const handleDeleteDoctor = () => {
      deleteDoctor(doctor.id);
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="p-4 relative">
          {doctor.isPartner && (
            <div className="absolute top-2 right-2">
              <Badge>
                <Star className="mr-1 h-3 w-3" />
                {t('doctorCard.partner')}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={doctor.clinicCardImageUrl || ''} alt={doctor.name} />
              <AvatarFallback>
                {doctor.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <CardTitle className="font-headline text-xl">
                 {doctor.isLoading ? <Skeleton className="h-7 w-48" /> : doctor.name}
              </CardTitle>
              {doctor.isLoading ? (
                <Skeleton className="h-5 w-32 mt-1" />
              ) : (
                <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
              )}
            </div>
             <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => setReferralSheetOpen(true)}>
                        <ClipboardList className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('doctorCard.viewCases')}</p>
                    </TooltipContent>
                  </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-grow space-y-4 text-sm">
          {/* Referrals Section */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BadgePercent className="h-4 w-4" />
                <span>{t('doctorCard.referrals')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => handleReferralChange(-1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold w-4 text-center text-base">{referralCount}</span>
                <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => handleReferralChange(1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator/>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('doctorCard.commission')}</span>
              <span className="font-semibold text-accent">{commission.toLocaleString()} {t('doctorCard.usd')}</span>
            </div>
          </div>
          
          {/* Contact & Availability */}
          <div className="space-y-4">
             <div className="space-y-2">
                {doctor.isLoading ? (
                    <Skeleton className="h-5 w-3/4" />
                ) : (
                    <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" /> 
                        <a href={`tel:${doctor.phoneNumber}`} className="hover:underline" dir="ltr">{doctor.phoneNumber}</a>
                    </div>
                )}
                {doctor.isLoading ? (
                    <Skeleton className="h-5 w-full" />
                ) : (
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <p>{doctor.clinicAddress}</p>
                    </div>
                )}
             </div>
            <Separator/>
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase">
                <CalendarDays className="h-4 w-4" />
                <span>{t('doctorCard.availability')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WEEK_DAYS.map(day => (
                  <Button
                    key={day}
                    size="sm"
                    variant={(doctor.availableDays || []).includes(day) ? 'secondary' : 'outline'}
                    onClick={() => handleAvailabilityToggle(day)}
                    className="h-7 px-2.5"
                  >
                    {t(`doctorCard.days.${day}` as any)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-2 border-t flex flex-col gap-2">
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(doctor.mapLocation, '_blank')} disabled={!doctor.mapLocation}>
              <MapPin className="mr-2 h-4 w-4" /> {t('doctorCard.map')}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleSetLocation}>
              {t('doctorCard.setMyLocation')}
            </Button>
          </div>
          <div className="flex w-full gap-2">
             <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> {t('doctorCard.edit')}
            </Button>
            <ConfirmationDialog
                trigger={<Button variant="destructive" size="sm" className="flex-1"><Trash2 className="mr-2 h-4 w-4" /> {t('doctorCard.delete')}</Button>}
                title={t('dialogs.deleteDoctorTitle')}
                description={`${t('dialogs.deleteDoctorDesc')} (${doctor.name})`}
                onConfirm={handleDeleteDoctor}
            />
          </div>
        </CardFooter>
      </Card>
      
      <DoctorFormDialog open={isEditing} onOpenChange={setEditing} doctorToEdit={doctor} />
      <ReferralNotesDialog 
        open={isReferralSheetOpen}
        onOpenChange={setReferralSheetOpen}
        doctor={doctor}
      />
    </>
  );
}

    