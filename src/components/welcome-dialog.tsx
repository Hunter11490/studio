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
import { Logo } from './logo';

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
      <DialogContent 
        className="sm:max-w-2xl bg-card shadow-2xl overflow-hidden transition-all duration-300 data-[state=open]:scale-100 scale-95" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-primary/5 opacity-80" />
         <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl" />
         <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative z-10">
            <DialogHeader className="items-center text-center mb-4">
              <Logo className="h-16 w-16 text-primary mb-2" />
              <DialogTitle className="font-headline text-2xl animate-glow">{t('welcome.title')}</DialogTitle>
              <DialogDescription>
                {t('welcome.description')}
              </DialogDescription>
            </DialogHeader>

            <Carousel 
                className="w-full"
                opts={{ direction: lang === 'ar' ? 'rtl' : 'ltr', loop: true }}
                onSelect={(api) => {
                    if (api) setStep(api.selectedScrollSnap());
                }}
            >
                <CarouselContent>
                    {steps.map((s, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                                <Card className="bg-background/70 backdrop-blur-sm border-dashed min-h-[280px]">
                                    <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center h-full">
                                        <s.icon className="w-16 h-16 text-primary" />
                                        <h3 className="text-xl font-semibold">{s.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>

            <div className="flex justify-center items-center gap-2 mt-4">
                {steps.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {}} // Could add functionality to jump to slide
                        className={cn("h-2 rounded-full transition-all duration-300", step === index ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/50')}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            <DialogFooter className="mt-6">
              {step === steps.length - 1 ? (
                 <Button onClick={onFinished} className="w-full animate-pulse-glow">
                    {t('common.finish')}
                    {lang === 'en' ? <ArrowRight className="ml-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                </Button>
              ): (
                <div className="w-full text-center text-xs text-muted-foreground">
                    {t('common.next')} / {t('common.previous')}
                </div>
              )}
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
