'use client';

import { useState, useEffect } from 'react';
import { Doctor, ReferralCase } from '@/types';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X, PlusCircle, MinusCircle } from 'lucide-react';
import { Label } from '../ui/label';

type ReferralNotesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor;
};

export function ReferralNotesDialog({ open, onOpenChange, doctor }: ReferralNotesDialogProps) {
  const { updateDoctor } = useDoctors();
  const { t } = useLanguage();
  const [cases, setCases] = useState<ReferralCase[]>([]);

  useEffect(() => {
    if (open) {
      const initialCases: ReferralCase[] = Array(doctor.referralCount)
        .fill(null)
        .map((_, i) => {
          const existingCase = doctor.referralNotes?.[i];
          return {
            patientName: existingCase?.patientName || '',
            referralDate: existingCase?.referralDate || '',
            testType: existingCase?.testType || '',
            patientAge: existingCase?.patientAge || '',
            chronicDiseases: existingCase?.chronicDiseases || '',
          };
        });
      setCases(initialCases);
    }
  }, [open, doctor]);

  const handleCaseChange = (index: number, field: keyof ReferralCase, value: string) => {
    const newCases = [...cases];
    newCases[index][field] = value;
    setCases(newCases);
  };
  
  const handleAddCase = () => {
    setCases(prev => [...prev, { patientName: '', referralDate: '', testType: '', patientAge: '', chronicDiseases: '' }]);
  };
  
  const handleRemoveCase = () => {
    if (cases.length > 0) {
      setCases(prev => prev.slice(0, -1));
    }
  };

  const handleSave = () => {
    updateDoctor(doctor.id, { referralNotes: cases, referralCount: cases.length });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen w-screen max-w-full flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-headline">{t('referralNotes.title')}</DialogTitle>
          <DialogDescription>{t('referralNotes.description', { name: doctor.name })}</DialogDescription>
        </DialogHeader>

         <div className="p-4 border-b flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">{t('referralNotes.manageCases')}</h3>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRemoveCase} disabled={cases.length === 0}>
                    <MinusCircle className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">{t('referralNotes.removeCase')}</span>
                </Button>
                <Button variant="default" size="sm" onClick={handleAddCase}>
                    <PlusCircle className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">{t('referralNotes.addCase')}</span>
                </Button>
            </div>
         </div>

        <ScrollArea className="flex-grow p-4">
          <div className="space-y-6">
            {cases.map((caseItem, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold text-lg text-primary">{t('referralNotes.caseLabel', { index: index + 1 })}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`patient-name-${index}`}>{t('referralNotes.patientName')}</Label>
                        <Input
                        id={`patient-name-${index}`}
                        value={caseItem.patientName}
                        onChange={(e) => handleCaseChange(index, 'patientName', e.target.value)}
                        placeholder={t('referralNotes.patientName')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`referral-date-${index}`}>{t('referralNotes.referralDate')}</Label>
                        <Input
                        id={`referral-date-${index}`}
                        type="date"
                        value={caseItem.referralDate}
                        onChange={(e) => handleCaseChange(index, 'referralDate', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`test-type-${index}`}>{t('referralNotes.testType')}</Label>
                        <Input
                        id={`test-type-${index}`}
                        value={caseItem.testType}
                        onChange={(e) => handleCaseChange(index, 'testType', e.target.value)}
                        placeholder={t('referralNotes.testType')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`patient-age-${index}`}>{t('referralNotes.patientAge')}</Label>
                        <Input
                        id={`patient-age-${index}`}
                        type="number"
                        value={caseItem.patientAge}
                        onChange={(e) => handleCaseChange(index, 'patientAge', e.target.value)}
                        placeholder={t('referralNotes.patientAge')}
                        />
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor={`chronic-diseases-${index}`}>{t('referralNotes.chronicDiseases')}</Label>
                    <Input
                    id={`chronic-diseases-${index}`}
                    value={caseItem.chronicDiseases}
                    onChange={(e) => handleCaseChange(index, 'chronicDiseases', e.target.value)}
                    placeholder={t('referralNotes.chronicDiseasesPlaceholder')}
                    />
                </div>
              </div>
            ))}
            {cases.length === 0 && (
              <div className="text-center text-muted-foreground pt-10">
                <p>{t('referralNotes.noCases')}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-background">
          <div className="flex w-full gap-2">
            <Button onClick={() => onOpenChange(false)} variant="secondary" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              {t('common.close')}
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {t('referralNotes.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
