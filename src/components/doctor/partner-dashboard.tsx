'use client';

import { useMemo, useState, useEffect } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Users, FileDown } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import type { Doctor } from '@/types';
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
  const { updateDoctor } = useDoctors();
  const { t } = useLanguage();
  
  const handleReferralChange = (doctorId: string, currentCount: number, amount: number) => {
    const newCount = Math.max(0, currentCount + amount);
    updateDoctor(doctorId, { referralCount: newCount });
  };
  
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
                <span className="text-sm text-muted-foreground">{t('doctorCard.commission')}:</span>
                <span className="font-semibold text-accent">
                    {(doctor.referralCount * 100).toLocaleString()} {t('doctorCard.usd')}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('partnerDashboard.editReferrals')}:</span>
                <div className="flex items-center gap-2">
                    <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => handleReferralChange(doctor.id, doctor.referralCount, -1)}
                    >
                    <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold w-5 text-center">{doctor.referralCount}</span>
                    <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => handleReferralChange(doctor.id, doctor.referralCount, 1)}
                    >
                    <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function PartnerDashboard({ open, onOpenChange }: PartnerDashboardProps) {
  const { doctors } = useDoctors();
  const { t, lang } = useLanguage();
  const { toast } = useToast();

  const partnerDoctors = useMemo(() => {
    return doctors.filter(d => d.isPartner).sort((a, b) => b.referralCount - a.referralCount);
  }, [doctors]);

  const getTranslatedDoctorData = async (doctor: Doctor): Promise<PartnerExportData> => {
    const targetLanguage = lang === 'ar' ? 'Arabic' : 'English';
    const containsArabic = /[\u0600-\u06FF]/.test(doctor.name);
    const containsEnglish = /[a-zA-Z]/.test(doctor.name);

    let translatedName = doctor.name;
    let translatedAddress = doctor.clinicAddress;

    if ((lang === 'en' && containsArabic) || (lang === 'ar' && containsEnglish)) {
      try {
        const result = await translateText({ 
          name: doctor.name, 
          specialty: doctor.specialty,
          clinicAddress: doctor.clinicAddress, 
          targetLanguage 
        });
        translatedName = result.name;
        translatedAddress = result.clinicAddress;
      } catch (error) {
        console.error("Translation for export failed for doctor:", doctor.name, error);
      }
    }

    const headers = {
      name: t('partnerDashboard.exportName'),
      address: t('partnerDashboard.exportAddress'),
      phone: t('partnerDashboard.exportPhone'),
      referrals: t('partnerDashboard.exportReferrals'),
      commission: t('partnerDashboard.exportCommission'),
    };
    
    return {
      [headers.name]: translatedName,
      [headers.address]: translatedAddress,
      [headers.phone]: doctor.phoneNumber,
      [headers.referrals]: doctor.referralCount,
      [headers.commission]: doctor.referralCount * 100,
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md md:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline flex items-center gap-2">
            <Users />
            {t('header.partnerDashboard')}
          </SheetTitle>
          <SheetDescription>
            {t('partnerDashboard.description')}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow -mx-6">
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
        
        {partnerDoctors.length > 0 && (
          <SheetFooter className="pt-4 border-t">
            <div className="flex w-full gap-2">
              <Button onClick={handleExportExcel} variant="outline" className="flex-1">
                <FileDown className="mr-2 h-4 w-4" />
                {t('partnerDashboard.exportExcel')}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
