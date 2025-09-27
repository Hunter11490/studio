'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useMemo, useContext } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { createRandomPatient, createRandomServiceRequest, moveInstrumentSet } from '@/lib/simulation-utils';
import { useNotifications } from '@/hooks/use-notifications';
import { TriageLevel, ServiceRequest, InstrumentSet, Patient } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SimulationContextType = {
  isSimulating: boolean;
  toggleSimulation: () => void;
};

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const SIMULATION_TICK_INTERVAL = 7000; // 7 seconds for main actions
const ADMISSION_INTERVAL = 5000; // 5 seconds for admissions
const DISCHARGE_INTERVAL = 7000; // 7 seconds for discharges

const EMERGENCY_CAPACITY = 50;
const ICU_CAPACITY = 12;
const WARDS_CAPACITY = 20 * 10; // 20 floors * 10 rooms

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const { doctors } = useDoctors();
  const { patients, addPatient, updatePatient, addFinancialRecord } = usePatients();
  const [serviceRequests, setServiceRequests] = useLocalStorage<ServiceRequest[]>('hospital_services_requests', []);
  const [instrumentSets, setInstrumentSets] = useLocalStorage<InstrumentSet[]>('sterilization_sets', []);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    setIsSimulating(true);
  }, []);

  const simulateAdmission = useCallback(() => {
    if (!isSimulating || doctors.length === 0) return;

    const icuPatientsCount = patients.filter(p => p.department === 'icu' && p.status !== 'Discharged').length;
    const wardPatientsCount = patients.filter(p => p.department === 'wards' && p.status !== 'Discharged').length;
    
    // Try to admit a new patient to Emergency
    if (Math.random() < 0.6) {
       const emergencyPatientsCount = patients.filter(p => p.department === 'emergency' && p.status !== 'Discharged').length;
       if (emergencyPatientsCount < EMERGENCY_CAPACITY) {
         const newPatientData = createRandomPatient(doctors, true);
         addPatient(newPatientData, {
           type: 'consultation',
           description: `${t('reception.title')} - ${t('departments.emergency')}`,
           amount: 25000,
         });
         addNotification({ title: t('simulation.patientAdded'), description: `${newPatientData.patientName} -> ${t('departments.emergency')}` });
         return; // Do one thing at a time
       }
    }

    // Try to transfer a patient from Emergency
    const patientToTransfer = patients.find(p => p.department === 'emergency' && (p.status === 'In Treatment' || p.status === 'Observation'));
    if (patientToTransfer) {
        if (patientToTransfer.triageLevel === 'critical' && icuPatientsCount < ICU_CAPACITY) {
            const icuDoctors = doctors.filter(d => d.specialty === 'Intensive Care Medicine');
            const attendingDoctorId = icuDoctors.length > 0 ? getRandomElement(icuDoctors).id : undefined;
            const availableBed = Array.from({ length: ICU_CAPACITY }, (_, i) => i + 1).find(bedNum => !patients.some(p => p.bedNumber === bedNum));
            
            if(availableBed){
                updatePatient(patientToTransfer.id, { department: 'icu', status: 'Admitted', attendingDoctorId, bedNumber: availableBed });
                addFinancialRecord(patientToTransfer.id, { type: 'inpatient', description: 'ICU Admission Fee', amount: 500000 });
                addNotification({ title: 'ICU Admission', description: `${patientToTransfer.patientName} was admitted to ICU Bed ${availableBed}.` });
            }
        } else if (wardPatientsCount < WARDS_CAPACITY) {
            const wardDoctors = doctors.filter(d => d.specialty === 'Internal Medicine');
            const attendingDoctorId = wardDoctors.length > 0 ? getRandomElement(wardDoctors).id : undefined;
            updatePatient(patientToTransfer.id, { department: 'wards', status: 'Admitted', attendingDoctorId });
            addFinancialRecord(patientToTransfer.id, { type: 'inpatient', description: t('wards.admissionFee'), amount: 150000 });
            addNotification({ title: t('simulation.patientAdmitted'), description: `${patientToTransfer.patientName} has been admitted to a ward.` });
        }
    }
  }, [isSimulating, doctors, patients, addPatient, updatePatient, addFinancialRecord, addNotification, t]);

  const simulateDischarge = useCallback(() => {
    if (!isSimulating || patients.length === 0) return;
    
    const admittedPatients = patients.filter(p => p.status === 'Admitted' && (p.department === 'icu' || p.department === 'wards'));
    if (admittedPatients.length > 0) {
        const patientToDischarge = getRandomElement(admittedPatients);
        const dischargeStatus = Math.random() < 0.05 ? 'deceased' : 'recovered';
        updatePatient(patientToDischarge.id, {
            status: 'Discharged',
            dischargeStatus: dischargeStatus,
            dischargedAt: new Date().toISOString(),
            department: 'medicalRecords',
            bedNumber: undefined,
            floor: undefined,
            room: undefined
        });
        addNotification({ title: 'Patient Discharged', description: `${patientToDischarge.patientName} was discharged (${dischargeStatus}).` });
    }
  }, [isSimulating, patients, updatePatient, addNotification]);

  const performOtherRandomActions = useCallback(() => {
     if (!isSimulating) return;

     // 1. Create a service request
     if (Math.random() < 0.15) {
       const newRequest = createRandomServiceRequest();
       setServiceRequests(prev => [newRequest, ...prev].slice(0, 50)); // Keep last 50
       addNotification({ title: `New Service Request: ${newRequest.type}`, description: `For: ${t(`departments.${newRequest.department}`)}` });
     }
     
     // 2. Advance sterilization cycle
     if (instrumentSets.length > 0 && Math.random() < 0.5) {
       const setToMove = getRandomElement(instrumentSets.filter(s => s.status !== 'sterilizing')); // Don't interrupt sterilization
       if(setToMove) {
           const originalStatus = setToMove.status;
           const newStatus = moveInstrumentSet(originalStatus);
           
           setInstrumentSets(prev => prev.map(s => s.id === setToMove.id ? { ...s, status: newStatus, cycleStartTime: newStatus === 'sterilizing' ? Date.now() : s.cycleStartTime } : s));
           
           if (originalStatus === 'packaging' && newStatus === 'sterilizing') {
              addNotification({ title: 'Sterilization Started', description: `${setToMove.name} has started its cycle.` });
           }
       }
     }
     
     // 3. Complete a sterilization cycle
     const sterilizingSet = instrumentSets.find(s => s.status === 'sterilizing' && (Date.now() - s.cycleStartTime) / 1000 > s.cycleDuration);
     if(sterilizingSet) {
        setInstrumentSets(prev => prev.map(s => s.id === sterilizingSet.id ? { ...s, status: 'storage' } : s));
        addNotification({ title: t('sterilization.cycleComplete'), description: `${sterilizingSet.name} ${t('sterilization.nowInStorage')}` });
     }

  }, [isSimulating, setServiceRequests, addNotification, t, instrumentSets, setInstrumentSets]);

  useEffect(() => {
    let admissionInterval: NodeJS.Timeout | null = null;
    let dischargeInterval: NodeJS.Timeout | null = null;
    let otherInterval: NodeJS.Timeout | null = null;
    
    if (isSimulating) {
      admissionInterval = setInterval(simulateAdmission, ADMISSION_INTERVAL);
      dischargeInterval = setInterval(simulateDischarge, DISCHARGE_INTERVAL);
      otherInterval = setInterval(performOtherRandomActions, SIMULATION_TICK_INTERVAL);
    }
    
    return () => {
      if (admissionInterval) clearInterval(admissionInterval);
      if (dischargeInterval) clearInterval(dischargeInterval);
      if (otherInterval) clearInterval(otherInterval);
    };
  }, [isSimulating, simulateAdmission, simulateDischarge, performOtherRandomActions]);

  const toggleSimulation = () => {
    const nextState = !isSimulating;
    setIsSimulating(nextState);
    toast({ title: nextState ? t('simulation.started') : t('simulation.stopped') });
  };
  
  const contextValue = useMemo(() => ({
    isSimulating,
    toggleSimulation,
  }), [isSimulating, toggleSimulation]);

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
}
