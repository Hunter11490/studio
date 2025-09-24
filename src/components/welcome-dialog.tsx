'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useLanguage } from '@/hooks/use-language';
import { Button } from './ui/button';
import { PlusCircle, Stethoscope, BrainCircuit, Database, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Card, CardContent } from './ui/card';

type WelcomeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => void;
};

export function WelcomeDialog({ open, onOpenChange, onFinished }: WelcomeDialogProps) {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: PlusCircle,
      title: t('welcome.step1Title'),
      description: t('welcome.step1Desc'),
    },
    {
      icon: Stethoscope,
      title: t('welcome.step2Title'),
      description: t('welcome.step2Desc'),
    },
    {
      icon: BrainCircuit,
      title: t('welcome.step3Title'),
      description: t('welcome.step3Desc'),
    },
    {
      icon: Database,
      title: t('welcome.step4Title'),
      description: t('welcome.step4Desc'),
    },
    {
      icon: CheckCircle,
      title: t('welcome.step5Title'),
      description: t('welcome.step5Desc'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-center">{t('welcome.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('welcome.description')}
          </DialogDescription>
        </DialogHeader>

        <Carousel 
            className="w-full"
            opts={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
            onSelect={(api) => {
                if (api) setStep(api.selectedScrollSnap());
            }}
        >
            <CarouselContent>
                {steps.map((s, index) => (
                    <CarouselItem key={index}>
                        <div className="p-1">
                            <Card className="bg-secondary/50 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center aspect-video">
                                    <s.icon className="w-12 h-12 text-primary" />
                                    <h3 className="text-lg font-semibold">{s.title}</h3>
                                    <p className="text-sm text-muted-foreground">{s.description}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className={cn(step === 0 && 'invisible')} />
            <CarouselNext className={cn(step === steps.length - 1 && 'invisible')} />
        </Carousel>

        <div className="flex justify-center items-center gap-2">
            {steps.map((_, index) => (
                <div 
                    key={index}
                    className={cn("h-2 w-2 rounded-full transition-all", step === index ? 'w-4 bg-primary' : 'bg-muted')}
                />
            ))}
        </div>

        <DialogFooter>
          {step === steps.length - 1 ? (
             <Button onClick={onFinished} className="w-full">
                {t('common.finish')}
                {lang === 'en' ? <ArrowRight className="ml-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
            </Button>
          ): (
            <div className="w-full text-center text-xs text-muted-foreground">
                {t('common.next')} / {t('common.previous')}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
