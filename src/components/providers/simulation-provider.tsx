'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { usePatients } from '@/hooks/use-patients';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { createRandomDoctor, createRandomPatient, createRandomServiceRequest, moveInstrumentSet } from '@/lib/simulation-utils';
import { useNotifications } from '@/hooks/use-notifications';
import { TriageLevel, ServiceRequest, InstrumentSet, Patient } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type SimulationContextType = {
  isSimulating: boolean;
  toggleSimulation: () => void;
};

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const DAILY_CHARGE_KEY_PREFIX = 'daily_charge_applied_';
const DAILY_CHARGE_AMOUNT = 150000;
const SIMULATION_INTERVAL = 3000; // 3 seconds
const EMERGENCY_CAPACITY = 20;
const ICU_CAPACITY = 12;


const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const { doctors, addDoctor, deleteDoctor } = useDoctors();
  const { patients, addPatient, updatePatient, addFinancialRecord } = usePatients();
  const [serviceRequests, setServiceRequests] = useLocalStorage<ServiceRequest[]>('hospital_services_requests', []);
  const [instrumentSets, setInstrumentSets] = useLocalStorage<InstrumentSet[]>('sterilization_sets', []);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    // Automatically start simulation on component mount
    setIsSimulating(true);
  }, []);

  const movePatientInEmergency = useCallback(() => {
    const emergencyPatients = patients.filter(p => p.department === 'emergency' && p.status !== 'Discharged');
    if (emergencyPatients.length === 0) return;

    const patientToMove = getRandomElement(emergencyPatients);
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
                 return;
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
    if (Math.random() > 0.3) return; // Don't run every time
    const newRequest = createRandomServiceRequest();
    setServiceRequests(prev => [newRequest, ...prev].slice(0, 50));
    addNotification({ title: t('services.newRequest'), description: `${newRequest.description} (${t(`departments.${newRequest.department}`)})` });
  }, [setServiceRequests, addNotification, t]);

  const simulateSterilizationCycle = useCallback(() => {
    if (instrumentSets.length === 0 || Math.random() > 0.4) return;
    const setToMove = getRandomElement(instrumentSets);
    if (!setToMove) return;

    const newStatus = moveInstrumentSet(setToMove.status);
    if (newStatus !== setToMove.status) {
      setInstrumentSets(prev => prev.map(s => s.id === setToMove.id ? { ...s, status: newStatus, cycleStartTime: Date.now() } : s));
       if (newStatus === 'storage') {
        addNotification({ title: t('sterilization.cycleComplete'), description: `${setToMove.name} ${t('sterilization.nowInStorage')}` });
      }
    }
  }, [instrumentSets, setInstrumentSets, addNotification, t]);

  const simulateInpatientAdmission = useCallback(() => {
    if (Math.random() > 0.2) return;
    const eligiblePatients = patients.filter(p => !p.floor && !p.room && p.status !== 'Discharged' && p.department !== 'emergency');
    if (eligiblePatients.length === 0) return;

    const occupiedRooms = new Set(patients.filter(p => p.floor && p.room).map(p => `${p.floor}-${p.room}`));
    const availableRooms: {floor: number, room: number}[] = [];
    for (let floor = 1; floor <= 20; floor++) {
        for (let room = 1; room <= 10; room++) {
            if (!occupiedRooms.has(`${floor}-${room}`)) {
                availableRooms.push({ floor, room });
            }
        }
    }

    if (availableRooms.length === 0) return;

    const patientToAdmit = getRandomElement(eligiblePatients);
    const roomToAdmit = getRandomElement(availableRooms);
    
    updatePatient(patientToAdmit.id, {
        floor: roomToAdmit.floor,
        room: roomToAdmit.room,
        admittedAt: new Date().toISOString(),
        status: 'Admitted',
        department: 'wards'
    });
    
    addFinancialRecord(patientToAdmit.id, {
        type: 'inpatient',
        description: t('wards.admissionFee'),
        amount: DAILY_CHARGE_AMOUNT,
        date: new Date().toISOString()
    });

    addNotification({ 
        title: t('simulation.patientAdmitted'), 
        description: t('simulation.patientAdmittedDesc', { patientName: patientToAdmit.patientName, floor: roomToAdmit.floor, room: roomToAdmit.floor * 100 + roomToAdmit.room })
    });
  }, [patients, updatePatient, addFinancialRecord, addNotification, t]);
  
  const simulateDailyCharges = useCallback(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const admittedPatients = patients.filter(p => p.status === 'Admitted' && p.floor && p.room);
      
      admittedPatients.forEach(patient => {
          const lastChargeKey = `${DAILY_CHARGE_KEY_PREFIX}${patient.id}`;
          const lastChargeDate = localStorage.getItem(lastChargeKey);

          if (lastChargeDate !== todayStr) {
              addFinancialRecord(patient.id, {
                  type: 'inpatient',
                  description: t('simulation.dailyCharge'),
                  amount: DAILY_CHARGE_AMOUNT,
                  date: new Date().toISOString()
              });
              localStorage.setItem(lastChargeKey, todayStr);
              addNotification({
                  title: t('simulation.dailyCharge'),
                  description: t('simulation.dailyChargeDesc', { patientName: patient.patientName, amount: DAILY_CHARGE_AMOUNT.toLocaleString() })
              });
          }
      });
  }, [patients, addFinancialRecord, addNotification, t]);

  const performRandomAction = useCallback(() => {
    // Capacity Check
    const emergencyPatientsCount = patients.filter(p => p.department === 'emergency' && p.status !== 'Discharged').length;
    const icuPatientsCount = patients.filter(p => p.department === 'icu').length;

    const isCapacityFull = emergencyPatientsCount >= EMERGENCY_CAPACITY && icuPatientsCount >= ICU_CAPACITY;

    const actions = [
      () => { // Add Patient to Emergency (priority action)
        if (!isCapacityFull && doctors.length > 0) {
          const newPatientData = createRandomPatient(doctors, true); // Force emergency patient
          const consultationFee = 25000 + Math.floor(Math.random() * 25000);
          addPatient(newPatientData, {
            type: 'consultation',
            description: `${t('reception.title')} - ${t(`departments.${newPatientData.department}`)}`,
            amount: consultationFee
          });
          addNotification({ title: t('simulation.patientAdded'), description: `${newPatientData.patientName} -> ${t(`departments.${newPatientData.department}`)}` });
        }
      },
      movePatientInEmergency,
      simulateServiceRequest,
      simulateSterilizationCycle,
      simulateInpatientAdmission,
      simulateDailyCharges,
       () => { // Patient gets a lab test
        if(patients.length > 0 && Math.random() < 0.3) {
          const randomPatient = getRandomElement(patients);
          const testCost = 15000 + Math.floor(Math.random() * 50000);
          addFinancialRecord(randomPatient.id, { type: 'lab', description: `${t('lab.test')} ${t('common.random')}`, amount: testCost });
        }
      },
       () => { // Patient buys medicine
        if(patients.length > 0 && Math.random() < 0.4) {
          const randomPatient = getRandomElement(patients);
          const drugCost = 5000 + Math.floor(Math.random() * 100000);
          addFinancialRecord(randomPatient.id, { type: 'pharmacy', description: `${t('pharmacy.drugName')} ${t('common.random')}`, amount: drugCost });
        }
      },
      () => { // Patient makes a payment
        if(patients.length > 0 && Math.random() < 0.2) {
          const indebtedPatients = patients.filter(p => (p.financialRecords || []).reduce((acc, r) => acc + r.amount, 0) > 0);
          if (indebtedPatients.length > 0) {
            const randomPatient = getRandomElement(indebtedPatients);
            const paymentAmount = 10000 + Math.floor(Math.random() * 50000);
            addFinancialRecord(randomPatient.id, { type: 'payment', description: t('accounts.paymentReceived'), amount: -paymentAmount });
          }
        }
      },
       () => { // Remove Oldest Doctor
        if (doctors.length > 20 && Math.random() < 0.05) { 
          const oldestDoctor = [...doctors].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          deleteDoctor(oldestDoctor.id);
        }
      },
    ];
    
    // Always prioritize adding new emergency patients if not full
    if (!isCapacityFull && doctors.length > 0) {
      actions[0](); // Add Patient action
    }

    // Perform one of the other random actions
    const randomAction = getRandomElement(actions.slice(1));
    randomAction();

  }, [doctors, patients, addPatient, deleteDoctor, addFinancialRecord, t, addNotification, movePatientInEmergency, simulateServiceRequest, simulateSterilizationCycle, simulateInpatientAdmission, simulateDailyCharges]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isSimulating) {
      intervalId = setInterval(performRandomAction, SIMULATION_INTERVAL);
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
