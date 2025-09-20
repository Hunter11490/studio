'use client';

import { Building, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoctors } from '@/hooks/use-doctors';
import { useToast } from '@/hooks/use-toast';
import type { SuggestDoctorsOutput } from '@/ai/flows/ai-suggested-doctors';

type DoctorSuggestion = SuggestDoctorsOutput[0];

export function SuggestedDoctorCard({ doctor }: { doctor: DoctorSuggestion }) {
  const { addDoctor } = useDoctors();
  const { toast } = useToast();
  
  const handleAdd = () => {
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
    toast({ title: `${doctor.name} has been added to your directory.` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{doctor.name}</CardTitle>
        <CardDescription>{doctor.specialty}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="flex items-start gap-2">
          <Phone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <span>{doctor.phone}</span>
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <span>{doctor.address}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAdd} className="w-full">Add to My Directory</Button>
      </CardFooter>
    </Card>
  );
}
