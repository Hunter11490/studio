'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/use-language';
import { IRAQI_GOVERNORATES } from '@/lib/constants';
import { suggestDoctors, SuggestDoctorsOutput } from '@/ai/flows/ai-suggested-doctors';
import { AILoader } from './ai-loader';
import { SuggestedDoctorCard } from './suggested-doctor-card';
import { ScrollArea } from '../ui/scroll-area';

type CitySearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const governorates = Object.keys(IRAQI_GOVERNORATES);

export function CitySearchDialog({ open, onOpenChange }: CitySearchDialogProps) {
  const { t, lang } = useLanguage();
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SuggestDoctorsOutput | null>(null);

  const regions = useMemo(() => {
    return selectedGovernorate ? IRAQI_GOVERNORATES[selectedGovernorate as keyof typeof IRAQI_GOVERNORATES] : [];
  }, [selectedGovernorate]);

  const handleSearch = async () => {
    if (!selectedGovernorate) return;
    setIsLoading(true);
    setResults(null);
    try {
      const location = selectedRegion ? `${selectedRegion}, ${selectedGovernorate}` : selectedGovernorate;
      const suggestions = await suggestDoctors({
        location,
        specialty: 'any',
        language: lang === 'ar' ? 'Arabic' : 'English',
      });
      setResults(suggestions);
    } catch (error) {
      console.error('AI suggestion failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setSelectedGovernorate('');
    setSelectedRegion('');
    setIsLoading(false);
    setResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetSearch(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-md md:max-w-2xl lg:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('dialogs.citySearchTitle')}</DialogTitle>
          <DialogDescription>Find doctors based on their location in Iraq.</DialogDescription>
        </DialogHeader>
        
        {isLoading || results ? (
          <ScrollArea className="flex-grow">
            {isLoading && <AILoader />}
            {results && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.length > 0 ? results.map((doc, i) => <SuggestedDoctorCard key={i} doctor={doc} />)
                : <p className="col-span-full text-center text-muted-foreground">{t('common.noResults')}</p>}
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('dialogs.governorate')}</label>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('dialogs.governorate')} />
                  </SelectTrigger>
                  <SelectContent>
                    {governorates.map(gov => (
                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('dialogs.region')}</label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion} disabled={!selectedGovernorate}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('dialogs.region')} />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSearch} disabled={!selectedGovernorate || isLoading} className="w-full">
              {t('dialogs.search')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
