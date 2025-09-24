'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/use-language';
import { Button } from './ui/button';
import { PlusCircle, Stethoscope, BrainCircuit, Database, CheckCircle, ArrowRight } from 'lucide-react';
import { Logo } from './logo';

type WelcomeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => void;
};

const Feature = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <p className="text-muted-foreground">{text}</p>
    </div>
);


export function WelcomeDialog({ open, onOpenChange, onFinished }: WelcomeDialogProps) {
  const { t } = useLanguage();

  const features = [
    { icon: PlusCircle, text: t('welcome.feature1') },
    { icon: Stethoscope, text: t('welcome.feature2') },
    { icon: BrainCircuit, text: t('welcome.feature3') },
    { icon: Database, text: t('welcome.feature4') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-card shadow-2xl overflow-hidden" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-primary/5 opacity-80" />
         <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl" />
         <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative z-10 p-2 sm:p-0">
            <DialogHeader className="items-center text-center mb-6">
              <Logo className="h-16 w-16 text-primary mb-2" />
              <DialogTitle className="font-headline text-2xl animate-glow">{t('welcome.title')}</DialogTitle>
              <DialogDescription>
                {t('welcome.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-4">
                {features.map((feature, index) => (
                    <Feature key={index} icon={feature.icon} text={feature.text} />
                ))}
            </div>

            <DialogFooter className="mt-8">
                <Button onClick={onFinished} className="w-full animate-pulse-glow">
                    {t('welcome.start')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
