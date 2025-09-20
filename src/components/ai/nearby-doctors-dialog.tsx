'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/use-language';
import { suggestDoctors, SuggestDoctorsOutput } from '@/ai/flows/ai-suggested-doctors';
import { AILoader } from './ai-loader';
import { SuggestedDoctorCard } from './suggested-doctor-card';
import { ScrollArea } from '../ui/scroll-area';

type NearbyDoctorsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NearbyDoctorsDialog({ open, onOpenChange }: NearbyDoctorsDialogProps) {
  const { t, lang } = useLanguage();
  const [location, setLocation] = useState('Baghdad');
  const [nameOrSpecialty, setNameOrSpecialty] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SuggestDoctorsOutput | null>(null);

  const handleSearch = async () => {
    if (!location) return;
    setIsLoading(true);
    setResults(null);
    try {
      const suggestions = await suggestDoctors({
        location,
        specialty: nameOrSpecialty || 'any',
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
    setLocation('Baghdad');
    setNameOrSpecialty('');
    setIsLoading(false);
    setResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetSearch(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-md md:max-w-2xl lg:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('dialogs.nearbySearchTitle')}</DialogTitle>
          <DialogDescription>Get AI-powered doctor suggestions based on location.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('dialogs.location')}</label>
              <Input value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t('dialogs.nameOrSpecialty')}</label>
              <Input value={nameOrSpecialty} onChange={e => setNameOrSpecialty(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={!location || isLoading} className="w-full">
            {isLoading ? t('common.loading') : t('dialogs.search')}
          </Button>
        </div>
        
        <ScrollArea className="flex-grow mt-4">
          {isLoading && <AILoader />}
          {results && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.length > 0 ? results.map((doc, i) => <SuggestedDoctorCard key={i} doctor={doc} />)
              : <p className="col-span-full text-center text-muted-foreground">{t('common.noResults')}</p>}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
