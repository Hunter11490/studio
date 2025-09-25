'use client';

import { useMemo, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Frown, UserSearch, Scissors, Pencil, Trash2 } from 'lucide-react';
import { Doctor } from '@/types';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { Header } from '@/components/layout/header';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function DoctorRow({ doctor }: { doctor: Doctor }) {
    const { t } = useLanguage();
    const { deleteDoctor } = useDoctors();
    const [isEditing, setEditing] = useState(false);

    return (
        <>
            <TableRow>
                <TableCell>
                    <div className="flex items-center gap-4">
                        <Avatar>
                            {doctor.clinicCardImageUrl && <AvatarImage src={doctor.clinicCardImageUrl} alt={doctor.name} />}
                            <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{doctor.name}</div>
                            <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{doctor.clinicAddress}</TableCell>
                <TableCell className="hidden sm:table-cell font-mono" dir="ltr">{doctor.phoneNumber}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditing(true)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                         <ConfirmationDialog
                            trigger={
                                <Button variant="destructive" size="icon" className="h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            }
                            title={t('dialogs.deleteDoctorTitle')}
                            description={`${t('dialogs.deleteDoctorDesc')} (${doctor.name})`}
                            onConfirm={() => deleteDoctor(doctor.id)}
                        />
                    </div>
                </TableCell>
            </TableRow>
            <DoctorFormDialog open={isEditing} onOpenChange={setEditing} doctorToEdit={doctor} />
        </>
    );
}

export default function SurgeryPage() {
    const { doctors, searchTerm, filterPartners } = useDoctors();
    const { t } = useLanguage();
    const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);

    const filteredDoctors = useMemo(() => {
        return doctors
            .filter(doctor => !searchTerm || doctor.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(doctor => !filterPartners || doctor.isPartner);
    }, [doctors, searchTerm, filterPartners]);

    const renderContent = () => {
        if (doctors.length === 0) {
            return (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <UserSearch className="h-16 w-16 text-muted-foreground" />
                        <h3 className="text-2xl font-bold tracking-tight">{t('common.noResults')}</h3>
                        <p className="text-sm text-muted-foreground">{t('header.addDoctor')} لبدء استخدام التطبيق.</p>
                        <Button onClick={() => setAddDoctorOpen(true)} className="mt-4">{t('header.addDoctor')}</Button>
                    </div>
                </div>
            );
        }

        if (filteredDoctors.length === 0) {
            return (
                <div className="flex flex-1 items-center justify-center mt-8">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <Frown className="h-12 w-12" />
                        <p className="text-lg">{t('common.noResults')}</p>
                    </div>
                </div>
            );
        }

        return (
             <div className="border rounded-lg w-full bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('doctorList.name')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('doctorForm.clinicAddress')}</TableHead>
                            <TableHead className="hidden sm:table-cell">{t('doctorForm.phoneNumber')}</TableHead>
                            <TableHead>{t('doctorList.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDoctors.map(doctor => <DoctorRow key={doctor.id} doctor={doctor} />)}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <>
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {renderContent()}
            </main>
            <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
        </>
    );
}
