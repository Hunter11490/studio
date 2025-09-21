'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X } from 'lucide-react';
import { Label } from '../ui/label';

type ReferralNotesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor;
};

export function ReferralNotesDialog({ open, onOpenChange, doctor }: ReferralNotesDialogProps) {
  const { updateDoctor } = useDoctors();
  const { t } = useLanguage();
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      const initialNotes = Array(doctor.referralCount)
        .fill('')
        .map((_, i) => doctor.referralNotes?.[i] || '');
      setNotes(initialNotes);
    }
  }, [open, doctor]);

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...notes];
    newNotes[index] = value;
    setNotes(newNotes);
  };

  const handleSave = () => {
    updateDoctor(doctor.id, { referralNotes: notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen w-screen max-w-full flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-headline">{t('referralNotes.title')}</DialogTitle>
          <DialogDescription>{t('referralNotes.description', { name: doctor.name })}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow p-4">
          <div className="space-y-4">
            {notes.map((note, index) => (
              <div key={index} className="grid gap-2">
                <Label htmlFor={`referral-note-${index}`}>
                  {t('referralNotes.caseLabel', { index: index + 1 })}
                </Label>
                <Input
                  id={`referral-note-${index}`}
                  value={note}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                  placeholder={t('referralNotes.placeholder')}
                />
              </div>
            ))}
            {notes.length === 0 && (
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
