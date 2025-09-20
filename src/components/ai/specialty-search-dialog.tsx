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
import { useDoctors } from '@/hooks/use-doctors';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';

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
  const { addDoctor } = useDoctors();
  const { toast } = useToast();

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

  const handleAddAll = () => {
    if (!results) return;
    results.forEach(doctor => {
      addDoctor({
        name: doctor.name,
        specialty: doctor.specialty,
        phoneNumber: doctor.phone,
        clinicAddress: doctor.address,
        mapLocation: '',
        clinicCardImageUrl: '',
        isPartner: false,
        referralCount: 0,
        availableDays: [],
      });
    });
    toast({ title: `${results.length} doctors have been added to your directory.` });
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
            <>
              <ScrollArea className="flex-grow overflow-auto -mx-6 px-6">
                 <h3 className="text-lg font-semibold mb-4 text-center">Results for "{currentSpecialty}"</h3>
                {isLoading && <AILoader />}
                {results && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.length > 0 ? results.map((doc, i) => <SuggestedDoctorCard key={i} doctor={doc} />)
                        : <p className="col-span-full text-center text-muted-foreground">{t('common.noResults')}</p>}
                    </div>
                )}
              </ScrollArea>
               {results && results.length > 0 && (
                <div className="pt-4 border-t">
                    <Button onClick={handleAddAll} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add All Results to My Directory
                    </Button>
                </div>
            )}
            </>
        ) : (
            <>
            <Input
              placeholder={t('dialogs.specialtySearchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="flex-grow -mx-6 px-6">
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
