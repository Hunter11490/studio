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
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Star, ClipboardList, Plus, Minus } from 'lucide-react';
import { DoctorFormDialog } from './doctor-form-dialog';
import { ConfirmationDialog } from '../confirmation-dialog';
import { ReferralNotesDialog } from './referral-notes-dialog';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

function DoctorRow({ doctor }: { doctor: Doctor }) {
  const { t } = useLanguage();
  const { deleteDoctor, updateDoctor } = useDoctors();
  const [isEditing, setEditing] = useState(false);
  const [isReferralSheetOpen, setReferralSheetOpen] = useState(false);
  
  const referralCount = doctor.referralCount || 0;
  const commission = referralCount * 100;

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


  return (
    <>
      <TableRow className="align-top">
        <TableCell className="py-2">
          <div className="flex items-center gap-2">
            {doctor.isPartner && <Star className="h-4 w-4 text-primary flex-shrink-0" />}
            <div className="font-medium">{doctor.name}</div>
          </div>
          <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
        </TableCell>
        
        <TableCell className="hidden sm:table-cell py-2">
           <div className="flex flex-col gap-2 w-48">
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
        </TableCell>
        
        <TableCell className="py-2">
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReferralSheetOpen(true)}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>{t('doctorCard.viewCases')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>{t('doctorCard.edit')}</span>
                </DropdownMenuItem>
                <ConfirmationDialog
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()} // prevent menu from closing
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
                    <TableHead className="hidden sm:table-cell">{t('doctorCard.referrals')}</TableHead>
                    <TableHead>
                    <span className="sr-only">{t('doctorList.actions')}</span>
                    </TableHead>
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
