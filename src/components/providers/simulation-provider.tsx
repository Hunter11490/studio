'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { createRandomDoctor, createRandomPatient } from '@/lib/simulation-utils';

type SimulationContextType = {
  isSimulating: boolean;
  toggleSimulation: () => void;
};

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const { doctors, addDoctor, deleteDoctor, updateDoctor } = useDoctors();
  const { patients, addPatient, updatePatient } = usePatients();
  const { toast } = useToast();
  const { t } = useLanguage();

  const performRandomAction = useCallback(() => {
    const actions = [
      () => { // Add Doctor
        const newDoctor = createRandomDoctor();
        addDoctor(newDoctor);
        toast({ title: t('simulation.doctorAdded'), description: newDoctor.name });
      },
      () => { // Add Patient
        if (doctors.length > 0) {
          const newPatient = createRandomPatient(doctors);
          addPatient(newPatient);
          toast({ title: t('simulation.patientAdded'), description: `${newPatient.patientName} -> ${t(`departments.${newPatient.department}`)}` });
        }
      },
      () => { // Remove Oldest Doctor
        if (doctors.length > 5) {
          const oldestDoctor = [...doctors].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          deleteDoctor(oldestDoctor.id);
          toast({ title: t('simulation.doctorRemoved'), description: oldestDoctor.name, variant: 'destructive' });
        }
      },
       () => { // Remove Oldest Patient
        if (patients.length > 10) {
          const oldestPatient = [...patients].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          // This is a simplified delete, a real app would need a dedicated delete function in the provider
          updatePatient(oldestPatient.id, { patientName: `(Archived) ${oldestPatient.patientName}` }); // Soft delete for demo
          toast({ title: t('simulation.patientArchived'), description: oldestPatient.patientName, variant: 'destructive' });
        }
      },
       () => { // Update Referral Count
         if (doctors.length > 0) {
            const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
            const change = Math.random() > 0.6 ? 1 : -1;
            const newCount = Math.max(0, randomDoctor.referralCount + change);
            if(randomDoctor.referralCount !== newCount) {
                updateDoctor(randomDoctor.id, { referralCount: newCount });
                toast({ title: t('simulation.referralUpdate'), description: `${randomDoctor.name} now has ${newCount} referrals.` });
            }
         }
      }
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();

  }, [doctors, patients, addDoctor, deleteDoctor, addPatient, updateDoctor, updatePatient, t, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isSimulating) {
      intervalId = setInterval(performRandomAction, Math.random() * (25000 - 10000) + 10000); // Between 10-25 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSimulating, performRandomAction]);

  const toggleSimulation = () => {
    setIsSimulating(prev => {
        const newState = !prev;
        if (newState) {
            toast({ title: t('simulation.started') });
        } else {
            toast({ title: t('simulation.stopped'), variant: 'destructive' });
        }
        return newState;
    });
  };

  return (
    <SimulationContext.Provider value={{ isSimulating, toggleSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}
