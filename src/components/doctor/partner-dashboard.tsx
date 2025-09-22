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
import { Users, FileDown, X, Plus, Minus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import type { Doctor, DoctorInfo } from '@/types';
import { translateText } from '@/ai/flows/translation-flow';
import { exportToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';

type PartnerDashboardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PartnerExportData = {
  [key: string]: string | number;
};

function PartnerDoctorItem({ doctor }: { doctor: Doctor }) {
  const { t } = useLanguage();
  const { updateDoctor } = useDoctors();

  const handleReferralChange = (amount: number) => {
    const newCount = Math.max(0, doctor.referralCount + amount);
    updateDoctor(doctor.id, { referralCount: newCount });
  };
  
  const commission = doctor.referralCount * 100;

  return (
    <AccordionItem value={doctor.id}>
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex flex-1 items-center justify-between gap-2">
          <span className="font-semibold truncate">{doctor.name}</span>
          <Badge variant="secondary" className="whitespace-nowrap">
            {t('doctorCard.referrals')}: {doctor.referralCount}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4">
        <div className="space-y-3 pt-2">
           <div className="flex items-center justify-between">
             <span className="text-sm text-muted-foreground">{t('partnerDashboard.editReferrals')}:</span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleReferralChange(-1)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-4 text-center">{doctor.referralCount}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleReferralChange(1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
  const { t } = useLanguage();
  const { toast } = useToast();

  const partnerDoctors = useMemo(() => {
    return doctors
      .filter(d => d.isPartner)
      .sort((a, b) => {
        return b.referralCount - a.referralCount;
      });
  }, [doctors]);

  useEffect(() => {
    if (open) {
      window.history.pushState({ dialog: 'partnerDashboard' }, '');
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.dialog === 'partnerDashboard') {
          onOpenChange(false);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && window.history.state?.dialog === 'partnerDashboard') {
      window.history.back();
    }
    onOpenChange(isOpen);
  };

  const getTranslatedDoctorData = async (doctorsToTranslate: Doctor[]): Promise<PartnerExportData[]> => {
    const doctorsInfo: DoctorInfo[] = doctorsToTranslate.map(d => ({
        name: d.name,
        specialty: d.specialty,
        clinicAddress: d.clinicAddress
    }));

    let translatedDocs: DoctorInfo[] = [];
    try {
        const response = await translateText({ doctors: doctorsInfo, targetLanguage: 'Arabic' });
        translatedDocs = response.doctors;
    } catch (error) {
        console.error("Batch translation failed, falling back to original data.", error);
        translatedDocs = doctorsInfo; // Fallback to original
    }

    const headers: { [key: string]: string } = {
        name: t('partnerDashboard.exportName'),
        address: t('partnerDashboard.exportAddress'),
        phone: t('partnerDashboard.exportPhone'),
        referrals: t('partnerDashboard.exportReferrals'),
        commission: t('partnerDashboard.exportCommission'),
    };

    return doctorsToTranslate.map((originalDoctor, index) => {
        const translatedInfo = translatedDocs[index] || originalDoctor;
        const referralCount = originalDoctor.referralCount;
        return {
            [headers.name]: translatedInfo.name,
            [headers.address]: translatedInfo.clinicAddress,
            [headers.phone]: originalDoctor.phoneNumber,
            [headers.referrals]: referralCount,
            [headers.commission]: referralCount * 100,
        };
    });
  };

  const handleExportExcel = async () => {
    if (partnerDoctors.length === 0) {
      toast({ title: t('partnerDashboard.noPartners') });
      return;
    }
    try {
      toast({title: t('toasts.exporting'), description: t('toasts.exportingDesc')});
      const translatedData = await getTranslatedDoctorData(partnerDoctors);
      const fileName = `${t('partnerDashboard.exportFileName')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportToExcel(translatedData, fileName);
      toast({ title: t('toasts.exportSuccess') });
    } catch (error) {
      console.error(error);
      toast({ title: t('toasts.exportError'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        
        <DialogFooter className="p-4 border-t bg-background">
          <div className="flex w-full gap-2">
            <Button onClick={() => handleOpenChange(false)} variant="secondary" className="flex-1">
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
