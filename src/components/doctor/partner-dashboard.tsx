'use client';

import { useMemo } from 'react';
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

type PartnerDashboardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PartnerDashboard({ open, onOpenChange }: PartnerDashboardProps) {
  const { doctors, updateDoctor } = useDoctors();
  const { t } = useLanguage();

  const partnerDoctors = useMemo(() => {
    return doctors.filter(d => d.isPartner).sort((a, b) => b.referralCount - a.referralCount);
  }, [doctors]);

  const handleReferralChange = (doctorId: string, currentCount: number, amount: number) => {
    const newCount = Math.max(0, currentCount + amount);
    updateDoctor(doctorId, { referralCount: newCount });
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

        <ScrollArea className="flex-grow -mx-6 px-2">
          {partnerDoctors.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {partnerDoctors.map(doctor => (
                <AccordionItem key={doctor.id} value={doctor.id}>
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
