'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { createRandomDoctor, createRandomPatient, createRandomServiceRequest, moveInstrumentSet } from '@/lib/simulation-utils';
import { useNotifications } from '@/hooks/use-notifications';
import { TriageLevel, ServiceRequest, InstrumentSet } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SimulationContextType = {
  isSimulating: boolean;
  toggleSimulation: () => void;
};

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const { doctors, addDoctor, deleteDoctor, updateDoctor } = useDoctors();
  const { patients, addPatient, updatePatient, addFinancialRecord } = usePatients();
  const [serviceRequests, setServiceRequests] = useLocalStorage<ServiceRequest[]>('hospital_services_requests', []);
  const [instrumentSets, setInstrumentSets] = useLocalStorage<InstrumentSet[]>('sterilization_sets', []);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    setIsSimulating(true);
  }, []);

  const movePatientInEmergency = useCallback(() => {
    const emergencyPatients = patients.filter(p => p.department === 'emergency' && p.status !== 'Discharged');
    if (emergencyPatients.length === 0) return;

    const patientToMove = emergencyPatients[Math.floor(Math.random() * emergencyPatients.length)];
    let nextStatus: Patient['status'] = patientToMove.status;
    
    switch(patientToMove.status) {
        case 'Waiting':
            nextStatus = 'In Treatment';
            break;
        case 'In Treatment':
            const rand = Math.random();
            if(patientToMove.triageLevel === 'critical' && rand < 0.5) {
                 updatePatient(patientToMove.id, { department: 'icu', status: 'Admitted' });
                 addNotification({ title: 'ICU Admission', description: `${patientToMove.patientName} was admitted to ICU.`});
                 return; // Exit after moving to ICU
            }
            nextStatus = rand < 0.7 ? 'Observation' : 'Discharged';
            break;
        case 'Observation':
            nextStatus = 'Discharged';
            break;
    }

    if (nextStatus !== patientToMove.status) {
        updatePatient(patientToMove.id, { status: nextStatus });
        if (nextStatus === 'Discharged') {
           addNotification({ title: 'Patient Discharged', description: `${patientToMove.patientName} was discharged from Emergency.`});
        }
    }
}, [patients, updatePatient, addNotification]);

  const simulateServiceRequest = useCallback(() => {
    const newRequest = createRandomServiceRequest();
    setServiceRequests(prev => [newRequest, ...prev].slice(0, 50));
    addNotification({ title: t('services.newRequest'), description: `${newRequest.description} (${t(`departments.${newRequest.department}`)})` });
  }, [setServiceRequests, addNotification, t]);

  const simulateSterilizationCycle = useCallback(() => {
    const setToMove = instrumentSets[Math.floor(Math.random() * instrumentSets.length)];
    if (!setToMove) return;

    const newStatus = moveInstrumentSet(setToMove.status);
    if (newStatus !== setToMove.status) {
      setInstrumentSets(prev => prev.map(s => s.id === setToMove.id ? { ...s, status: newStatus, cycleStartTime: Date.now() } : s));
       if (newStatus === 'storage') {
        addNotification({ title: t('sterilization.cycleComplete'), description: `${setToMove.name} ${t('sterilization.nowInStorage')}` });
      }
    }
  }, [instrumentSets, setInstrumentSets, addNotification, t]);


  const performRandomAction = useCallback(() => {
    const actions = [
      () => { // Add Doctor
        const newDoctor = createRandomDoctor();
        addDoctor(newDoctor);
        const notifTitle = t('simulation.doctorAdded');
        addNotification({ title: notifTitle, description: newDoctor.name });
      },
      () => { // Add Patient
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
      movePatientInEmergency,
      simulateServiceRequest,
      simulateSterilizationCycle,
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
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();

  }, [doctors, patients, addDoctor, deleteDoctor, addPatient, updateDoctor, addFinancialRecord, t, addNotification, movePatientInEmergency, simulateServiceRequest, simulateSterilizationCycle]);

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
    const wasSimulating = isSimulating;
    setIsSimulating(prev => !prev);
     if(wasSimulating) {
        toast({ title: t('simulation.stopped') });
     } else {
        toast({ title: t('simulation.started') });
     }
  };
  
  return (
    <SimulationContext.Provider value={{ isSimulating, toggleSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}
