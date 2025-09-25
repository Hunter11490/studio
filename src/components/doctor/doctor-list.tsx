'use client';

import { useState } from 'react';
import { Doctor } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Star, Plus, Minus, ClipboardList, Map as MapIcon, MapPin } from 'lucide-react';
import { DoctorFormDialog } from './doctor-form-dialog';
import { ConfirmationDialog } from '../confirmation-dialog';
import { ReferralNotesDialog } from './referral-notes-dialog';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';


// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

function DoctorRow({ doctor }: { doctor: Doctor }) {
  const { t } = useLanguage();
  const { deleteDoctor, updateDoctor } = useDoctors();
  const { toast } = useToast();
  const [isEditing, setEditing] = useState(false);
  const [isReferralSheetOpen, setReferralSheetOpen] = useState(false);
  
  const referralCount = doctor.referralCount || 0;
  const commission = referralCount * 100;

  const handleReferralChange = (amount: number) => {
    const newCount = Math.max(0, referralCount + amount);
    const newNotes = [...(doctor.referralNotes || [])];
    
    while (newNotes.length < newCount) {
        newNotes.push({ patientName: '', referralDate: '', testDate: getTodayDateString(), testType: '', patientAge: '', chronicDiseases: '' });
    }
    if (newNotes.length > newCount) {
        newNotes.length = newCount;
    }

    updateDoctor(doctor.id, { referralCount: newCount, referralNotes: newNotes });
  };

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

  return (
    <>
      <TableRow className="align-top">
        <TableCell className="py-3">
          <div className="flex justify-between items-start w-full gap-4">
              <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handlePartnerToggle} className="h-7 w-7 rounded-full flex-shrink-0">
                        <Star className={cn(
                            "h-5 w-5 transition-colors",
                            doctor.isPartner ? "text-warning fill-current" : "text-muted-foreground hover:text-warning/80"
                        )} />
                    </Button>
                    <div>
                        <div className={cn("font-medium", doctor.isPartner && "animate-glow font-bold")}>{doctor.name}</div>
                        <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-48 mt-2 ml-10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('doctorCard.referrals')}</span>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-5 w-5 rounded-full" onClick={() => handleReferralChange(-1)} disabled={referralCount <= 0}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-bold w-4 text-center text-sm">{referralCount}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5 rounded-full" onClick={() => handleReferralChange(1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{t('doctorCard.commission')}</span>
                        <span className="text-xs font-semibold text-accent">{commission.toLocaleString()} {t('doctorCard.usd')}</span>
                    </div>
                  </div>
              </div>
            
              <div className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>{t('doctorCard.edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setReferralSheetOpen(true)}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>{t('doctorCard.viewCases')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSetLocation}>
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{t('doctorCard.setMyLocation')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(doctor.mapLocation, '_blank')} disabled={!doctor.mapLocation}>
                      <MapIcon className="mr-2 h-4 w-4" />
                      <span>{t('doctorCard.map')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <ConfirmationDialog
                      trigger={
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t('doctorCard.delete')}</span>
                        </DropdownMenuItem>
                      }
                      title={t('dialogs.deleteDoctorTitle')}
                      description={`${t('dialogs.deleteDoctorDesc')} (${doctor.name})`}
                      onConfirm={() => deleteDoctor(doctor.id)}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </div>
        </TableCell>
      </TableRow>
      <DoctorFormDialog open={isEditing} onOpenChange={setEditing} doctorToEdit={doctor} />
      <ReferralNotesDialog 
        open={isReferralSheetOpen}
        onOpenChange={setReferralSheetOpen}
        doctor={doctor}
      />
    </>
  );
}


export function DoctorList({ doctors }: { doctors: Doctor[] }) {
    const { t } = useLanguage();

    return (
        <div className="border rounded-lg w-full bg-card">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('doctorList.name')}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {doctors.map((doctor) => (
                    <DoctorRow key={doctor.id} doctor={doctor} />
                ))}
                </TableBody>
            </Table>
        </div>
    );
}
