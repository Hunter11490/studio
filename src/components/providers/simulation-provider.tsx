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
  const { patients, addPatient, updatePatient, addFinancialRecord } = usePatients();
  const { toast } = useToast();
  const { t } = useLanguage();

  const performRandomAction = useCallback(() => {
    const actions = [
      () => { // Add Doctor
        const newDoctor = createRandomDoctor();
        addDoctor(newDoctor);
        toast({ title: t('simulation.doctorAdded'), description: newDoctor.name });
      },
      () => { // Add Patient with consultation fee
        if (doctors.length > 0) {
          const newPatientData = createRandomPatient(doctors);
          const consultationFee = 25000;
          addPatient(newPatientData, {
            type: 'consultation',
            description: `Consultation - ${newPatientData.department}`,
            amount: consultationFee
          });
          toast({ title: t('simulation.patientAdded'), description: `${newPatientData.patientName} -> ${t(`departments.${newPatientData.department}`)}` });
        }
      },
       () => { // Patient gets a lab test
        if(patients.length > 0) {
          const randomPatient = patients[Math.floor(Math.random() * patients.length)];
          const testCost = 15000 + Math.floor(Math.random() * 50000);
          addFinancialRecord(randomPatient.id, {
            type: 'lab',
            description: `Random Lab Test`,
            amount: testCost,
            date: new Date().toISOString()
          });
          toast({ title: t('simulation.labTest'), description: `${randomPatient.patientName} got a lab test.`});
        }
      },
       () => { // Patient buys medicine
        if(patients.length > 0) {
          const randomPatient = patients[Math.floor(Math.random() * patients.length)];
          const drugCost = 5000 + Math.floor(Math.random() * 100000);
          addFinancialRecord(randomPatient.id, {
            type: 'pharmacy',
            description: `Random Medication`,
            amount: drugCost,
            date: new Date().toISOString()
          });
           toast({ title: t('simulation.pharmacyBill'), description: `${randomPatient.patientName} bought medicine.`});
        }
      },
      () => { // Patient makes a payment
        if(patients.length > 0) {
          const indebtedPatients = patients.filter(p => (p.financialRecords || []).reduce((acc, r) => acc + r.amount, 0) > 0);
          if (indebtedPatients.length > 0) {
            const randomPatient = indebtedPatients[Math.floor(Math.random() * indebtedPatients.length)];
            const paymentAmount = 10000 + Math.floor(Math.random() * 50000);
            addFinancialRecord(randomPatient.id, {
              type: 'payment',
              description: `Payment Received`,
              amount: -paymentAmount, // Negative amount for payment
              date: new Date().toISOString()
            });
            toast({ title: t('simulation.paymentMade'), description: `${randomPatient.patientName} paid ${paymentAmount.toLocaleString()} IQD.`});
          }
        }
      },
       () => { // Remove Oldest Doctor
        if (doctors.length > 20) { // Keep a baseline of doctors
          const oldestDoctor = [...doctors].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          deleteDoctor(oldestDoctor.id);
          toast({ title: t('simulation.doctorRemoved'), description: oldestDoctor.name, variant: 'destructive' });
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

  }, [doctors, patients, addDoctor, deleteDoctor, addPatient, updateDoctor, addFinancialRecord, t, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isSimulating) {
      // Run more frequently to show more activity
      intervalId = setInterval(performRandomAction, Math.random() * (15000 - 8000) + 8000); // Between 8-15 seconds
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
