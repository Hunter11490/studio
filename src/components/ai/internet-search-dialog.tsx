'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { useToast } from '@/hooks/use-toast';
import { searchInternetForDoctors, InternetSearchOutput } from '@/ai/flows/internet-search-flow';
import { translateText, DoctorInfo } from '@/ai/flows/translation-flow';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AILoader } from './ai-loader';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Plus, ListPlus, UserSearch, Loader2, BrainCircuit, Phone, Stethoscope, MapPin } from 'lucide-react';
import { Doctor } from '@/types';

type InternetSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearchQuery?: string;
};

type SuggestedDoctor = InternetSearchOutput['doctors'][0];

const formSchema = z.object({
  query: z.string().min(3, 'Search query must be at least 3 characters.'),
});

export function InternetSearchDialog({ open, onOpenChange, initialSearchQuery }: InternetSearchDialogProps) {
  const { t } = useLanguage();
  const { addMultipleDoctors } = useDoctors();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | boolean>(false); // 'all' or doctor index
  const [results, setResults] = useState<SuggestedDoctor[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: initialSearchQuery || '' },
  });

  useEffect(() => {
    if (open) {
      window.history.pushState({ dialog: 'internetSearch' }, '');
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.dialog === 'internetSearch') {
          onOpenChange(false);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && window.history.state?.dialog === 'internetSearch') {
      window.history.back();
    }
    // Reset state on close
    if (!isOpen) {
      setResults([]);
      setHasSearched(false);
      form.reset({ query: '' });
    }
    onOpenChange(isOpen);
  };

  const handleSearch = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    try {
      const response = await searchInternetForDoctors({ query: values.query });
      setResults(response.doctors);
    } catch (error) {
      console.error('Internet search failed:', error);
      toast({
        title: t('toasts.searchErrorTitle'),
        description: t('toasts.searchErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && initialSearchQuery && !hasSearched && !isLoading) {
      form.setValue('query', initialSearchQuery);
      handleSearch({ query: initialSearchQuery });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSearchQuery]);


 const translateDoctors = async (doctorsToTranslate: SuggestedDoctor[]): Promise<DoctorInfo[]> => {
    const targetLanguage = 'Arabic';
    try {
        const doctorsInfo: DoctorInfo[] = doctorsToTranslate.map(d => ({
            name: d.name,
            specialty: d.specialty,
            clinicAddress: d.address
        }));

        const response = await translateText({
            doctors: doctorsInfo,
            targetLanguage,
        });

        return response.doctors;
    } catch (e) {
        console.error("Batch translation failed", e);
        return doctorsToTranslate.map(d => ({
            name: d.name,
            specialty: d.specialty,
            clinicAddress: d.address
        }));
    }
  }

  const handleAddDoctor = async (doctor: SuggestedDoctor, index: number) => {
    setIsAdding(index.toString());
    const translatedDocs = await translateDoctors([doctor]);
    const translatedDoctor = translatedDocs[0];

    const newDoctor: Omit<Doctor, 'id' | 'createdAt'> = {
      name: translatedDoctor.name,
      specialty: translatedDoctor.specialty,
      phoneNumber: doctor.phoneNumber,
      clinicAddress: translatedDoctor.clinicAddress,
      mapLocation: '',
      clinicCardImageUrl: '',
      isPartner: false,
      referralCount: 0,
      availableDays: [],
    };
    addMultipleDoctors([newDoctor]);
    toast({
        title: t('toasts.doctorAddedTitle'),
        description: `${translatedDoctor.name} ${t('toasts.doctorAddedDesc')}`,
    });
    setResults(prev => prev.filter((_, i) => i !== index));
    setIsAdding(false);
  };

  const handleAddAll = async () => {
    if(results.length === 0) return;
    setIsAdding('all');
    
    const translatedDocs = await translateDoctors(results);
    
    const newDoctors: Omit<Doctor, 'id' | 'createdAt'>[] = results.map((originalDoctor, index) => {
      const translatedInfo = translatedDocs[index] || { name: originalDoctor.name, specialty: originalDoctor.specialty, clinicAddress: originalDoctor.address };
      return {
        name: translatedInfo.name,
        specialty: translatedInfo.specialty,
        phoneNumber: originalDoctor.phoneNumber,
        clinicAddress: translatedInfo.clinicAddress,
        mapLocation: '',
        clinicCardImageUrl: '',
        isPartner: false,
        referralCount: 0,
        availableDays: [],
      };
    });

    addMultipleDoctors(newDoctors);

    toast({
        title: t('toasts.allDoctorsAddedTitle'),
        description: t('toasts.allDoctorsAddedDesc', {count: results.length}),
    });
    setResults([]);
    setIsAdding(false);
    handleOpenChange(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return <AILoader text={t('dialogs.internetSearching')} />;
    }
    if (hasSearched && results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
            <UserSearch className="h-16 w-16 mb-4" />
            <h3 className="font-semibold text-lg">{t('dialogs.noResultsFoundTitle')}</h3>
            <p className="text-sm">{t('dialogs.noResultsFoundDesc')}</p>
        </div>
      );
    }
    if (!hasSearched) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
            <BrainCircuit className="h-16 w-16 mb-4 text-primary animate-pulse" />
            <h3 className="font-semibold text-lg">{t('dialogs.internetSearchReadyTitle')}</h3>
            <p className="text-sm">{t('dialogs.internetSearchReadyDesc')}</p>
        </div>
      );
    }
    return (
        <div className="space-y-3">
            {results.map((doctor, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-secondary/50 transition-colors">
                <div className="flex-grow space-y-2">
                <p className="font-bold text-lg text-primary">{doctor.name}</p>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Stethoscope className="h-4 w-4" />
                    <span>{doctor.specialty || t('common.notAvailable')}</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{doctor.address || t('common.notAvailable')}</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm" dir="ltr">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{doctor.phoneNumber || t('common.notAvailable')}</span>
                 </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAddDoctor(doctor, index)} disabled={!!isAdding}>
                {isAdding === index.toString() ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Plus className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">{t('common.add')}</span>
                </Button>
            </div>
            ))}
        </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <UserSearch />
            {t('dialogs.internetSearchTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.internetSearchDesc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-grow relative">
                    <FormControl>
                      <Input
                        placeholder={t('dialogs.internetSearchPlaceholder')}
                        {...field}
                        disabled={isLoading || !!isAdding}
                        className="pl-10"
                      />
                    </FormControl>
                     <div className="absolute left-3 top-0 h-full flex items-center">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !!isAdding}>
                {t('common.search')}
              </Button>
            </form>
          </Form>
        </div>

        <ScrollArea className="flex-grow pr-4 -mr-6">
          {renderContent()}
        </ScrollArea>

        {results.length > 0 && !isLoading && (
          <DialogFooter className="mt-auto pt-4 border-t">
            <Button onClick={handleAddAll} className="w-full" disabled={!!isAdding}>
                {isAdding === 'all' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                ) : (
                    <ListPlus className="mr-2 h-4 w-4"/>
                )}
                {t('dialogs.addAllResults', { count: results.length })}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
