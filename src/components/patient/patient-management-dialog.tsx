'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/hooks/use-language';
import { usePatients } from '@/hooks/use-patients';
import { Doctor, Patient } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Users, Pencil, Trash2 } from 'lucide-react';
import { PatientFormDialog } from './patient-form-dialog';
import { ConfirmationDialog } from '../confirmation-dialog';
import { cn } from '@/lib/utils';

type PatientManagementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor;
};

export function PatientManagementDialog({ open, onOpenChange, doctor }: PatientManagementDialogProps) {
  const { t } = useLanguage();
  const { getPatientsByDoctor, deletePatient } = usePatients();
  const [isFormOpen, setFormOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | undefined>(undefined);

  const patients = getPatientsByDoctor(doctor.id);

  const handleAddPatient = () => {
    setPatientToEdit(undefined);
    setFormOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setFormOpen(true);
  };
  
  const getStatusVariant = (status: Patient['status']) => {
    switch (status) {
      case 'Visited': return 'default';
      case 'Canceled': return 'destructive';
      case 'Pending':
      default: return 'secondary';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
                <Users />
                {t('patient.managementTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('patient.managementDesc').replace('{doctorName}', doctor.name)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow min-h-0">
            {patients.length > 0 ? (
                <ScrollArea className="h-full">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>{t('patient.patientName')}</TableHead>
                            <TableHead>{t('patient.referralDate')}</TableHead>
                            <TableHead>{t('patient.status')}</TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {patients.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-sm text-muted-foreground" dir="ltr">{p.phoneNumber}</div>
                                </TableCell>
                                <TableCell>{format(parseISO(p.referralDate), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(p.status)}>
                                        {t(`patient.statusOptions.${p.status}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditPatient(p)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <ConfirmationDialog
                                            trigger={
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            }
                                            title={t('patient.deletePatientTitle')}
                                            description={`${t('patient.deletePatientDesc')} (${p.name})`}
                                            onConfirm={() => deletePatient(p.id)}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border border-dashed rounded-lg">
                    <Users className="h-12 w-12 mb-2" />
                    <p className="font-semibold">{t('patient.noPatients')}</p>
                </div>
            )}
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button onClick={handleAddPatient}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('patient.addPatient')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PatientFormDialog 
        open={isFormOpen} 
        onOpenChange={setFormOpen} 
        doctor={doctor} 
        patientToEdit={patientToEdit} 
      />
    </>
  );
}
