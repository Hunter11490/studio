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
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Users } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import type { Doctor } from '@/types';
import { translateText } from '@/ai/flows/translation-flow';
import { Skeleton } from '../ui/skeleton';

type PartnerDashboardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TranslatedDetails = {
    name: string;
};

function PartnerDoctorItem({ doctor }: { doctor: Doctor }) {
  const { updateDoctor } = useDoctors();
  const { t, lang } = useLanguage();
  const [translatedDetails, setTranslatedDetails] = useState<TranslatedDetails | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateDetails = async () => {
      if (!doctor.name) {
        setTranslatedDetails(null);
        return;
      }

      const targetLanguage = lang === 'ar' ? 'Arabic' : 'English';
      
      const containsArabic = /[\u0600-\u06FF]/.test(doctor.name);
      const containsEnglish = /[a-zA-Z]/.test(doctor.name);

      if ((lang === 'en' && !containsArabic) || (lang === 'ar' && !containsEnglish && doctor.name)) {
        setTranslatedDetails(null);
        return;
      }
      
      setIsTranslating(true);
      try {
        const result = await translateText({ 
          name: doctor.name, 
          specialty: doctor.specialty, // Required by flow, but we only need name
          clinicAddress: doctor.clinicAddress, // Required by flow
          targetLanguage 
        });
        setTranslatedDetails(result);
      } catch (error) {
        console.error("Translation failed", error);
        setTranslatedDetails({ name: doctor.name });
      } finally {
        setIsTranslating(false);
      }
    };

    translateDetails();
  }, [lang, doctor.name, doctor.specialty, doctor.clinicAddress]);

  const displayName = translatedDetails?.name ?? doctor.name;

  const handleReferralChange = (doctorId: string, currentCount: number, amount: number) => {
    const newCount = Math.max(0, currentCount + amount);
    updateDoctor(doctorId, { referralCount: newCount });
  };
  
  return (
    <AccordionItem value={doctor.id}>
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex flex-1 items-center justify-between gap-2">
          {isTranslating ? 
            <Skeleton className="h-5 w-32" /> :
            <span className="font-semibold truncate">{displayName}</span>
          }
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
  const { t } = useLanguage();

  const partnerDoctors = useMemo(() => {
    return doctors.filter(d => d.isPartner).sort((a, b) => b.referralCount - a.referralCount);
  }, [doctors]);

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

        <ScrollArea className="flex-grow -mx-6 px-2">
          {partnerDoctors.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {partnerDoctors.map(doctor => (
                <PartnerDoctorItem key={doctor.id} doctor={doctor} />
              ))}
            </Accordion>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="w-12 h-12 mb-2" />
                <p>{t('partnerDashboard.noPartners')}</p>
             </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
