'use client';

import { useState } from 'react';
import {
  Star,
  Plus,
  Minus,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  BadgePercent,
  ClipboardList,
  MoreVertical,
  Map as MapIcon,
} from 'lucide-react';
import { Doctor } from '@/types';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { DoctorFormDialog } from './doctor-form-dialog';
import { ReferralNotesDialog } from './referral-notes-dialog';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { updateDoctor, deleteDoctor } = useDoctors();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setEditing] = useState(false);
  const [isReferralSheetOpen, setReferralSheetOpen] = useState(false);

  const referralCount = doctor.referralCount || 0;
  const commission = referralCount * 100;
  
  const handlePartnerToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    updateDoctor(doctor.id, { isPartner: !doctor.isPartner });
    e.currentTarget.blur();
  };

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
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };
  
  const handleReferralChange = (amount: number) => {
    const newCount = Math.max(0, referralCount + amount);
    const newNotes = [...(doctor.referralNotes || [])];
    
    while (newNotes.length < newCount) {
        newNotes.push({ patientName: '', referralDate: '', testType: '', patientAge: '', chronicDiseases: '' });
    }
    if (newNotes.length > newCount) {
        newNotes.length = newCount;
    }

    updateDoctor(doctor.id, { referralCount: newCount, referralNotes: newNotes });
  };
  
  const handleDeleteDoctor = () => {
      deleteDoctor(doctor.id);
  }

  return (
    <>
      <Card className={cn(
          "flex flex-col overflow-hidden transition-all duration-300",
          doctor.isPartner && "border-primary/50 shadow-lg shadow-primary/10"
        )}>
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-grow">
                <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handlePartnerToggle} className="h-7 w-7 rounded-full">
                        <Star className={cn(
                          "h-5 w-5 transition-colors",
                          doctor.isPartner ? "text-warning fill-current" : "text-muted-foreground hover:text-warning/80"
                        )} />
                    </Button>
                    <span>{doctor.name}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{doctor.specialty}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSetLocation}>
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>{t('doctorCard.setMyLocation')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(doctor.mapLocation, '_blank')} disabled={!doctor.mapLocation}>
                  <MapIcon className="mr-2 h-4 w-4" />
                  <span>{t('doctorCard.map')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-grow space-y-4 text-sm">
          <div className="space-y-2 rounded-lg border p-3 bg-secondary/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BadgePercent className="h-4 w-4" />
                <span>{t('doctorCard.referrals')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => handleReferralChange(-1)} disabled={referralCount <= 0}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold w-4 text-center text-base">{referralCount}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => handleReferralChange(1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator/>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('doctorCard.commission')}</span>
              <span className="font-semibold text-accent">{commission.toLocaleString()} {t('doctorCard.usd')}</span>
            </div>
          </div>
          
           <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                  <Phone className="h-3 w-3 shrink-0 text-muted-foreground" /> 
                  <a href={`tel:${doctor.phoneNumber}`} className="hover:underline" dir="ltr">{doctor.phoneNumber}</a>
              </div>
              <div className="flex items-center gap-3">
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span>{doctor.clinicAddress}</span>
              </div>
           </div>
        </CardContent>

        <CardFooter className="p-2 border-t bg-background/50 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> {t('doctorCard.edit')}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setReferralSheetOpen(true)}>
                <ClipboardList className="mr-2 h-4 w-4" /> {t('doctorCard.viewCases')}
            </Button>
            <ConfirmationDialog
                trigger={<Button variant="destructive" size="icon" className="flex-shrink-0"><Trash2 className="h-4 w-4" /></Button>}
                title={t('dialogs.deleteDoctorTitle')}
                description={`${t('dialogs.deleteDoctorDesc')} (${doctor.name})`}
                onConfirm={handleDeleteDoctor}
            />
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
