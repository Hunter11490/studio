'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { MEDICAL_SPECIALTIES } from '@/lib/constants';
import { suggestDoctors, SuggestDoctorsOutput } from '@/ai/flows/ai-suggested-doctors';
import { AILoader } from './ai-loader';
import { SuggestedDoctorCard } from './suggested-doctor-card';

type SpecialtySearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SpecialtySearchDialog({ open, onOpenChange }: SpecialtySearchDialogProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SuggestDoctorsOutput | null>(null);
  const [currentSpecialty, setCurrentSpecialty] = useState<string | null>(null);

  const filteredSpecialties = MEDICAL_SPECIALTIES.filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectSpecialty = async (specialty: string) => {
    setIsLoading(true);
    setResults(null);
    setCurrentSpecialty(specialty);
    try {
      const suggestions = await suggestDoctors({
        specialty,
        location: 'Baghdad', // Default location as requested
        language: 'English',
      });
      setResults(suggestions);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      // Optionally show a toast error
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
      setSearchTerm('');
      setIsLoading(false);
      setResults(null);
      setCurrentSpecialty(null);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetSearch(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-md md:max-w-2xl lg:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('dialogs.specialtySearchTitle')}</DialogTitle>
          {!results && !isLoading && <DialogDescription>Select a specialty to find doctors in Baghdad.</DialogDescription>}
        </DialogHeader>
        
        {results || isLoading ? (
            <div className="flex-grow overflow-y-auto">
                 <h3 className="text-lg font-semibold mb-4">Results for "{currentSpecialty}"</h3>
                {isLoading && <AILoader />}
                {results && (
                    <ScrollArea className="flex-grow overflow-auto">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {results.map((doc, i) => <SuggestedDoctorCard key={i} doctor={doc} />)}
                        </div>
                    </ScrollArea>
                )}
            </div>
        ) : (
            <>
            <Input
              placeholder={t('dialogs.specialtySearchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="flex-grow">
              <ul className="space-y-1">
                {filteredSpecialties.map(specialty => (
                  <li key={specialty}>
                    <button
                      onClick={() => handleSelectSpecialty(specialty)}
                      className="w-full text-left p-2 rounded-md hover:bg-secondary"
                    >
                      {specialty}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
