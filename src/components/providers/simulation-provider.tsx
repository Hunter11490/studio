'use client';

import { createContext, useState, useEffect, useCallback, ReactNode, useMemo, useContext } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { useNotifications } from '@/hooks/use-notifications';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { runSimulationCycle, SimulationAction } from '@/ai/flows/simulation-flow';
import { ServiceRequest, InstrumentSet, Patient } from '@/types';

type SimulationContextType = {
  isSimulating: boolean;
  toggleSimulation: () => void;
};

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const SIMULATION_TICK_INTERVAL = 10000; // 10 seconds per AI decision cycle

const EMERGENCY_CAPACITY = 50;
const ICU_CAPACITY = 12;
const WARDS_CAPACITY = 20 * 10;

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
    // Auto-start simulation on component mount.
    setIsSimulating(true);
  }, []);

  const executeSimulationAction = useCallback((action: SimulationAction) => {
    switch (action.action) {
      case 'ADMIT_PATIENT_TO_EMERGENCY': {
        if (doctors.length > 0) {
            const newPatientData = {
                patientName: `Patient ${Math.floor(Date.now() / 1000)}`,
                dob: { day: '1', month: '1', year: '1990' },
                receptionDate: new Date().toISOString(),
                address: { governorate: 'Baghdad', region: 'Karrada', mahalla: '901', zuqaq: '1', dar: '1' },
                department: 'emergency',
                status: 'Waiting',
                triageLevel: ['minor', 'stable', 'urgent', 'critical'][Math.floor(Math.random() * 4)] as any,
                vitalSigns: { heartRate: 60 + Math.floor(Math.random() * 40), bloodPressure: '120/80', spo2: 95 + Math.floor(Math.random() * 5), temperature: 36.5 + Math.random() },
            };
            addPatient(newPatientData, {
                type: 'consultation',
                description: `${t('reception.title')} - ${t('departments.emergency')}`,
                amount: 25000,
            });
            addNotification({ title: t('simulation.patientAdded'), description: `${newPatientData.patientName} -> ${t('departments.emergency')}` });
        }
        break;
      }
      
      case 'TRANSFER_PATIENT_FROM_EMERGENCY_TO_ICU': {
        if (action.patientId) {
          const icuDoctors = doctors.filter(d => d.specialty === 'Intensive Care Medicine');
          const attendingDoctorId = icuDoctors.length > 0 ? getRandomElement(icuDoctors).id : undefined;
          const availableBed = Array.from({ length: ICU_CAPACITY }, (_, i) => i + 1).find(bedNum => !patients.some(p => p.bedNumber === bedNum));
          
          if(availableBed) {
            updatePatient(action.patientId, { department: 'icu', status: 'Admitted', attendingDoctorId, bedNumber: availableBed });
            addFinancialRecord(action.patientId, { type: 'inpatient', description: 'ICU Admission Fee', amount: 500000 });
            addNotification({ title: 'ICU Admission', description: `Patient admitted to ICU Bed ${availableBed}.` });
          }
        }
        break;
      }
        
      case 'TRANSFER_PATIENT_FROM_EMERGENCY_TO_WARD': {
        if (action.patientId) {
            const wardDoctors = doctors.filter(d => d.specialty === 'Internal Medicine');
            const attendingDoctorId = wardDoctors.length > 0 ? getRandomElement(wardDoctors).id : undefined;
            updatePatient(action.patientId, { department: 'wards', status: 'Admitted', attendingDoctorId });
            addFinancialRecord(action.patientId, { type: 'inpatient', description: t('wards.admissionFee'), amount: 150000 });
            addNotification({ title: t('simulation.patientAdmitted'), description: `A patient has been admitted to a ward.` });
        }
        break;
      }

      case 'DISCHARGE_PATIENT': {
        if (action.patientId && action.details) {
            const dischargeStatus = action.details as 'recovered' | 'deceased';
            updatePatient(action.patientId, {
                status: 'Discharged',
                dischargeStatus: dischargeStatus,
                dischargedAt: new Date().toISOString(),
                department: 'medicalRecords',
                bedNumber: undefined,
                floor: undefined,
                room: undefined
            });
            addNotification({ title: 'Patient Discharged', description: `A patient was discharged (${dischargeStatus}).` });
        }
        break;
      }
        
      case 'CREATE_SERVICE_REQUEST': {
        const newRequest = {
            id: `service-${Date.now()}`,
            type: ['maintenance', 'cleaning', 'catering'][Math.floor(Math.random() * 3)] as any,
            description: action.details || "AI Generated Service Request",
            department: doctors.length > 0 ? getRandomElement(doctors).specialty.toLowerCase().replace(/ /g, '') : 'reception',
            status: 'new' as const,
            createdAt: new Date().toISOString(),
        };
        setServiceRequests(prev => [newRequest, ...prev].slice(0, 50));
        addNotification({ title: `New Service Request: ${newRequest.type}`, description: `For: ${t(`departments.${newRequest.department}`)}` });
        break;
      }

      case 'ADVANCE_SERVICE_REQUEST': {
        if (action.patientId) { // Using patientId as serviceRequestId here
            const request = serviceRequests.find(r => r.id === action.patientId && r.status !== 'completed');
            if(request) {
                const newStatus = request.status === 'new' ? 'in-progress' : 'completed';
                setServiceRequests(prev => prev.map(r => r.id === request.id ? {...r, status: newStatus} : r));
            }
        }
        break;
      }
    }
  }, [addPatient, addFinancialRecord, addNotification, doctors, t, updatePatient, patients, setServiceRequests, serviceRequests]);

  const runSimulationCycleCallback = useCallback(async () => {
    if (!isSimulating || !doctors.length) return;

    const simulationState = {
      patients: patients.map(p => ({
        id: p.id,
        patientName: p.patientName,
        department: p.department,
        status: p.status,
        triageLevel: p.triageLevel,
        admittedAt: p.admittedAt
      })),
      doctors: doctors.map(d => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
      })),
      departments: {
        emergency: { count: patients.filter(p => p.department === 'emergency' && p.status !== 'Discharged').length, capacity: EMERGENCY_CAPACITY },
        icu: { count: patients.filter(p => p.department === 'icu' && p.status !== 'Discharged').length, capacity: ICU_CAPACITY },
        wards: { count: patients.filter(p => p.department === 'wards' && p.status !== 'Discharged').length, capacity: WARDS_CAPACITY },
      },
      serviceRequests: serviceRequests.map(r => ({ id: r.id, type: r.type, status: r.status, department: r.department })),
    };

    try {
      const result = await runSimulationCycle(simulationState);
      if (result && result.actions) {
        result.actions.forEach(executeSimulationAction);
      }
    } catch (error) {
      console.error("Simulation cycle failed:", error);
    }

  }, [isSimulating, doctors, patients, serviceRequests, executeSimulationAction]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSimulating) {
      interval = setInterval(runSimulationCycleCallback, SIMULATION_TICK_INTERVAL);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, runSimulationCycleCallback]);

  useEffect(() => {
    const visualInterval = setInterval(() => {
      if (!isSimulating) return;
       const sterilizingSet = instrumentSets.find(s => s.status === 'sterilizing' && (Date.now() - s.cycleStartTime) / 1000 > s.cycleDuration);
       if(sterilizingSet) {
          setInstrumentSets(prev => prev.map(s => s.id === sterilizingSet.id ? { ...s, status: 'storage' } : s));
          addNotification({ title: t('sterilization.cycleComplete'), description: `${sterilizingSet.name} ${t('sterilization.nowInStorage')}` });
       }
    }, 2000);

    return () => clearInterval(visualInterval);
  }, [isSimulating, instrumentSets, setInstrumentSets, addNotification, t]);

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
