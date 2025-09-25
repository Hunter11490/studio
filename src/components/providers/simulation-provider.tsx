'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { createRandomDoctor, createRandomPatient } from '@/lib/simulation-utils';
import { useNotifications } from '@/hooks/use-notifications';

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
  const { addNotification } = useNotifications();


  const performRandomAction = useCallback(() => {
    const actions = [
      () => { // Add Doctor
        const newDoctor = createRandomDoctor();
        addDoctor(newDoctor);
        const notifTitle = t('simulation.doctorAdded');
        addNotification({ title: notifTitle, description: newDoctor.name });
      },
      () => { // Add Patient with consultation fee
        if (doctors.length > 0) {
          const newPatientData = createRandomPatient(doctors);
          const consultationFee = 25000;
          addPatient(newPatientData, {
            type: 'consultation',
            description: `${t('reception.title')} - ${t(`departments.${newPatientData.department}`)}`,
            amount: consultationFee
          });
          const notifTitle = t('simulation.patientAdded');
          const notifDesc = `${newPatientData.patientName} -> ${t(`departments.${newPatientData.department}`)}`;
          addNotification({ title: notifTitle, description: notifDesc });
        }
      },
       () => { // Patient gets a lab test
        if(patients.length > 0) {
          const randomPatient = patients[Math.floor(Math.random() * patients.length)];
          const testCost = 15000 + Math.floor(Math.random() * 50000);
          addFinancialRecord(randomPatient.id, {
            type: 'lab',
            description: `${t('lab.test')} ${t('common.random')}`,
            amount: testCost,
            date: new Date().toISOString()
          });
          const notifTitle = t('simulation.labTest');
          const notifDesc = `${randomPatient.patientName} ${t('simulation.labTestDesc')}`;
          addNotification({ title: notifTitle, description: notifDesc });
        }
      },
       () => { // Patient buys medicine
        if(patients.length > 0) {
          const randomPatient = patients[Math.floor(Math.random() * patients.length)];
          const drugCost = 5000 + Math.floor(Math.random() * 100000);
          addFinancialRecord(randomPatient.id, {
            type: 'pharmacy',
            description: `${t('pharmacy.drugName')} ${t('common.random')}`,
            amount: drugCost,
            date: new Date().toISOString()
          });
           const notifTitle = t('simulation.pharmacyBill');
           const notifDesc = `${randomPatient.patientName} ${t('simulation.pharmacyBillDesc')}`;
           addNotification({ title: notifTitle, description: notifDesc });
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
              description: t('accounts.paymentReceived'),
              amount: -paymentAmount, // Negative amount for payment
              date: new Date().toISOString()
            });
            const notifTitle = t('simulation.paymentMade');
            const notifDesc = t('simulation.paymentMadeDesc', { patientName: randomPatient.patientName, amount: paymentAmount.toLocaleString() });
            addNotification({ title: notifTitle, description: notifDesc });
          }
        }
      },
       () => { // Remove Oldest Doctor
        if (doctors.length > 20) { // Keep a baseline of doctors
          const oldestDoctor = [...doctors].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          deleteDoctor(oldestDoctor.id);
          const notifTitle = t('simulation.doctorRemoved');
          addNotification({ title: notifTitle, description: oldestDoctor.name });
        }
      },
       () => { // Update Referral Count
         if (doctors.length > 0) {
            const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
            const change = Math.random() > 0.6 ? 1 : -1;
            const newCount = Math.max(0, randomDoctor.referralCount + change);
            if(randomDoctor.referralCount !== newCount) {
                updateDoctor(randomDoctor.id, { referralCount: newCount });
                const notifTitle = t('simulation.referralUpdate');
                const notifDesc = t('simulation.referralUpdateDesc', { doctorName: randomDoctor.name, count: newCount });
                addNotification({ title: notifTitle, description: notifDesc });
            }
         }
      }
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();

  }, [doctors, patients, addDoctor, deleteDoctor, addPatient, updateDoctor, addFinancialRecord, t, addNotification]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isSimulating) {
      intervalId = setInterval(performRandomAction, Math.random() * (15000 - 8000) + 8000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSimulating, performRandomAction]);

  const toggleSimulation = () => {
    setIsSimulating(prev => !prev);
  };
  
  useEffect(() => {
    if (isSimulating) {
      toast({ title: t('simulation.started') });
    }
  }, [isSimulating, t, toast]);


  return (
    <SimulationContext.Provider value={{ isSimulating, toggleSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}
