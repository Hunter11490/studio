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
import { MoreHorizontal, Pencil, Trash2, Star, ClipboardList } from 'lucide-react';
import { Badge } from '../ui/badge';
import { DoctorFormDialog } from './doctor-form-dialog';
import { ConfirmationDialog } from '../confirmation-dialog';
import { ReferralNotesDialog } from './referral-notes-dialog';

function DoctorRow({ doctor }: { doctor: Doctor }) {
  const { t } = useLanguage();
  const { deleteDoctor } = useDoctors();
  const [isEditing, setEditing] = useState(false);
  const [isReferralSheetOpen, setReferralSheetOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            {doctor.isPartner && <Star className="h-4 w-4 text-primary" />}
            <div className="font-medium">{doctor.name}</div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">{doctor.specialty}</TableCell>
        <TableCell className="hidden sm:table-cell">
          <Badge variant="secondary">{doctor.referralCount}</Badge>
        </TableCell>
        <TableCell>
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
        <div className="border rounded-lg w-full">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{t('doctorList.name')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('doctorList.specialty')}</TableHead>
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
