'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { useToast } from '@/hooks/use-toast';
import {
  searchInternetForDoctors,
  InternetSearchOutput,
} from '@/ai/flows/internet-search-flow';
import { AILoader } from './ai-loader';
import { Doctor } from '@/types';
import { Separator } from '../ui/separator';
import { Plus, PlusCircle, Search, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

type InternetSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FoundDoctor = Omit<Doctor, 'id' | 'createdAt' | 'isPartner' | 'referralCount' | 'mapLocation' | 'availableDays' | 'clinicCardImageUrl'>;

export function InternetSearchDialog({
  open,
  onOpenChange,
}: InternetSearchDialogProps) {
  const { t } = useLanguage();
  const { addDoctor } = useDoctors();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FoundDoctor[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);
    try {
      const response: InternetSearchOutput = await searchInternetForDoctors({
        query,
      });
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

  const handleAddDoctor = (doctor: FoundDoctor) => {
    addDoctor({
        ...doctor,
        referralCount: 0,
        isPartner: false,
        mapLocation: '',
        availableDays: [],
        clinicCardImageUrl: '',
    });
    toast({
      title: t('toasts.doctorAddedTitle'),
      description: `${doctor.name} ${t('toasts.doctorAddedDesc')}`,
    });
  };

  const handleAddAll = () => {
    results.forEach(doc => {
        addDoctor({
            ...doc,
            referralCount: 0,
            isPartner: false,
            mapLocation: '',
            availableDays: [],
            clinicCardImageUrl: '',
        });
    });
    toast({
      title: t('toasts.allDoctorsAddedTitle'),
      description: `${results.length} ${t('toasts.allDoctorsAddedDesc')}`,
    });
    setResults([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-full w-full p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Globe />
            {t('userMenu.internetSearch')}
          </SheetTitle>
          <SheetDescription>
            {t('dialogs.internetSearchDesc')}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('dialogs.internetSearchPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
            />
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-4">
            {isLoading && <AILoader text={t('dialogs.internetSearching')} />}
            {!isLoading && results.length === 0 && (
              <div className="text-center text-muted-foreground pt-10">
                <p>{t('common.noResults')}</p>
              </div>
            )}
            {results.map((doctor, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{doctor.name}</CardTitle>
                      <CardDescription>{doctor.specialty}</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddDoctor(doctor)}>
                       <Plus className="mr-1 h-4 w-4" /> {t('common.add')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p>{doctor.clinicAddress}</p>
                    <p dir="ltr">{doctor.phoneNumber}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {results.length > 0 && (
          <SheetFooter className="p-4 border-t mt-auto">
            <Button
              className="w-full"
              onClick={handleAddAll}
              disabled={isLoading}
            >
              <PlusCircle className="mr-2" />
              {t('dialogs.addAllResults', { count: results.length })}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
