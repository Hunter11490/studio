'use client';

import { useMemo, useState, useEffect } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Users, FileDown, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import type { Doctor } from '@/types';
import { translateText } from '@/ai/flows/translation-flow';
import { exportToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import { usePatients } from '@/hooks/use-patients';

type PartnerDashboardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PartnerExportData = {
  [key: string]: string | number;
};

function PartnerDoctorItem({ doctor }: { doctor: Doctor }) {
  const { getPatientsByDoctor } = usePatients();
  const { t } = useLanguage();

  const patients = getPatientsByDoctor(doctor.id);
  const referralCount = patients.length;
  const commission = referralCount * 100;

  return (
    <AccordionItem value={doctor.id}>
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex flex-1 items-center justify-between gap-2">
          <span className="font-semibold truncate">{doctor.name}</span>
          <Badge variant="secondary" className="whitespace-nowrap">
            {t('doctorCard.referrals')}: {referralCount}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4">
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('doctorCard.commission')}:</span>
            <span className="font-semibold text-accent">
              {commission.toLocaleString()} {t('doctorCard.usd')}
            </span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function PartnerDashboard({ open, onOpenChange }: PartnerDashboardProps) {
  const { doctors } = useDoctors();
  const { getPatientsByDoctor } = usePatients();
  const { t, lang } = useLanguage();
  const { toast } = useToast();

  const partnerDoctors = useMemo(() => {
    return doctors
      .filter(d => d.isPartner)
      .sort((a, b) => {
        const countA = getPatientsByDoctor(a.id).length;
        const countB = getPatientsByDoctor(b.id).length;
        return countB - countA;
      });
  }, [doctors, getPatientsByDoctor]);

  const getTranslatedDoctorData = async (doctor: Doctor): Promise<PartnerExportData> => {
    const targetLanguage = lang === 'ar' ? 'Arabic' : 'English';
    const referralCount = getPatientsByDoctor(doctor.id).length;

    let translatedData = { name: doctor.name, specialty: doctor.specialty, clinicAddress: doctor.clinicAddress };
    
    try {
        const result = await translateText({ name: doctor.name, specialty: doctor.specialty, clinicAddress: doctor.clinicAddress, targetLanguage });
        translatedData = result;
    } catch (error) {
        console.error("Translation failed for", doctor.name, "falling back to original.");
    }
    
    const headers: { [key: string]: string } = {
        name: t('partnerDashboard.exportName'),
        address: t('partnerDashboard.exportAddress'),
        phone: t('partnerDashboard.exportPhone'),
        referrals: t('partnerDashboard.exportReferrals'),
        commission: t('partnerDashboard.exportCommission'),
    };

    return {
        [headers.name]: translatedData.name,
        [headers.address]: translatedData.clinicAddress,
        [headers.phone]: doctor.phoneNumber,
        [headers.referrals]: referralCount,
        [headers.commission]: referralCount * 100,
    };
  };

  const handleExportExcel = async () => {
    if (partnerDoctors.length === 0) {
      toast({ title: t('partnerDashboard.noPartners') });
      return;
    }
    try {
      toast({title: t('toasts.exporting'), description: t('toasts.exportingDesc')});

      const translatedData = await Promise.all(partnerDoctors.map(doc => getTranslatedDoctorData(doc)));
      
      const fileName = `${t('partnerDashboard.exportFileName')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      exportToExcel(translatedData, fileName);
      toast({ title: t('toasts.exportSuccess') });
    } catch (error) {
      console.error(error);
      toast({ title: t('toasts.exportError'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen w-screen max-w-full flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-headline flex items-center gap-2">
            <Users />
            {t('header.partnerDashboard')}
          </DialogTitle>
          <DialogDescription>
            {t('partnerDashboard.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow">
           <div className="px-2">
              {partnerDoctors.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                  {partnerDoctors.map(doctor => (
                    <PartnerDoctorItem key={doctor.id} doctor={doctor} />
                  ))}
                </Accordion>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
                    <Users className="w-12 h-12 mb-2" />
                    <p>{t('partnerDashboard.noPartners')}</p>
                </div>
              )}
            </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t">
          <div className="flex w-full gap-2">
            <Button onClick={() => onOpenChange(false)} variant="secondary" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              {t('partnerDashboard.close')}
            </Button>
            {partnerDoctors.length > 0 && (
              <Button onClick={handleExportExcel} variant="outline" className="flex-1">
                <FileDown className="mr-2 h-4 w-4" />
                {t('partnerDashboard.exportExcel')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
