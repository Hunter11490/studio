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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AILoader } from './ai-loader';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Plus, ListPlus, UserSearch, Loader2 } from 'lucide-react';
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
  const { t, lang } = useLanguage();
  const { addMultipleDoctors } = useDoctors();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | boolean>(false); // 'all' or doctor index
  const [results, setResults] = useState<SuggestedDoctor[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: initialSearchQuery || '' },
  });

  useEffect(() => {
    if (open) {
      window.history.pushState({ sheet: 'internetSearch' }, '');
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.sheet === 'internetSearch') {
          onOpenChange(false);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && window.history.state?.sheet === 'internetSearch') {
      window.history.back();
    }
    onOpenChange(isOpen);
  };

  const handleSearch = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
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
    // If an initial search query is provided and the dialog is opened, run the search automatically.
    if (open && initialSearchQuery && results.length === 0 && !isLoading) {
      form.setValue('query', initialSearchQuery);
      handleSearch({ query: initialSearchQuery });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSearchQuery]);


 const translateDoctors = async (doctorsToTranslate: SuggestedDoctor[]): Promise<DoctorInfo[]> => {
    // Always translate to Arabic as requested
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
        // Fallback to original if batch fails
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-screen w-screen max-w-full flex flex-col p-0 gap-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="font-headline flex items-center gap-2">
            <UserSearch />
            {t('dialogs.internetSearchTitle', {
              defaultValue: 'Internet Doctor Search',
            })}
          </SheetTitle>
          <SheetDescription>
            {t('dialogs.internetSearchDesc')}
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        placeholder={t('dialogs.internetSearchPlaceholder')}
                        {...field}
                        disabled={isLoading || !!isAdding}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !!isAdding} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {t('common.search', { defaultValue: 'Search' })}
              </Button>
            </form>
          </Form>
        </div>

        <ScrollArea className="flex-grow">
          {isLoading && <AILoader text={t('dialogs.internetSearching')} />}
          {!isLoading && results.length > 0 && (
            <div className="space-y-2 p-4">
              {results.map((doctor, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-md bg-secondary">
                  <div className="flex-grow">
                    <p className="font-bold">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                    <p className="text-sm">{doctor.address}</p>
                    <p className="text-sm" dir="ltr">{doctor.phoneNumber}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAddDoctor(doctor, index)} disabled={!!isAdding}>
                    {isAdding === index.toString() ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="mr-2 h-4 w-4" />
                    )}
                    {t('common.add')}
                  </Button>
                </div>
              ))}
            </div>
          )}
           {!isLoading && results.length === 0 && (
             <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No results found for this search.</p>
             </div>
           )}
        </ScrollArea>

        {results.length > 0 && !isLoading && (
          <SheetFooter className="p-4 border-t bg-background">
            <Button onClick={handleAddAll} className="w-full" disabled={!!isAdding}>
                {isAdding === 'all' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                ) : (
                    <ListPlus className="mr-2 h-4 w-4"/>
                )}
                {t('dialogs.addAllResults', { count: results.length })}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
