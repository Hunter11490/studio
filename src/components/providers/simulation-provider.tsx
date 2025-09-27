'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

const DAILY_CHARGE_KEY_PREFIX = 'daily_charge_applied_';
const DAILY_CHARGE_AMOUNT = 150000;
const ADMISSION_INTERVAL = 5000;
const DISCHARGE_INTERVAL = 7000;
const OTHER_ACTIONS_INTERVAL = 3000;
const EMERGENCY_CAPACITY = 50;
const ICU_CAPACITY = 12;
const WARDS_CAPACITY = 20 * 10;


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
    setIsSimulating(true);
  }, []);

  const simulateAdmission = useCallback(() => {
    const icuPatientsCount = patients.filter(p => p.department === 'icu' && p.status !== 'Discharged').length;
    const wardPatientsCount = patients.filter(p => p.department === 'wards' && p.status !== 'Discharged').length;

    const admitToIcu = Math.random() < 0.2 && icuPatientsCount < ICU_CAPACITY;
    const admitToWard = !admitToIcu && wardPatientsCount < WARDS_CAPACITY;

    let patientToAdmit: Patient | undefined;
    
    if (admitToIcu || admitToWard) {
        const eligiblePatients = patients.filter(p => 
            (p.department === 'emergency' || (!p.floor && !p.room)) && p.status !== 'Discharged'
        );
        if (eligiblePatients.length > 0) {
            patientToAdmit = getRandomElement(eligiblePatients);
        }
    }

    if (!patientToAdmit) return;

    if (admitToIcu) {
        updatePatient(patientToAdmit.id, { department: 'icu', status: 'Admitted', floor: undefined, room: undefined });
        addNotification({ title: 'ICU Admission', description: `${patientToAdmit.patientName} was admitted to ICU.` });
    } else if (admitToWard) {
        const occupiedRooms = new Set(patients.filter(p => p.floor && p.room).map(p => `${p.floor}-${p.room}`));
        const availableRooms: {floor: number, room: number}[] = [];
        for (let floor = 1; floor <= 20; floor++) {
            for (let room = 1; room <= 10; room++) {
                if (!occupiedRooms.has(`${floor}-${room}`)) {
                    availableRooms.push({ floor, room });
                }
            }
        }
        if (availableRooms.length > 0) {
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
        }
    }

  }, [patients, updatePatient, addFinancialRecord, addNotification, t]);

  const simulateDischarge = useCallback(() => {
    const admittedPatients = patients.filter(p => p.status === 'Admitted' && (p.department === 'icu' || p.department === 'wards'));
    if (admittedPatients.length === 0) return;

    const patientToDischarge = getRandomElement(admittedPatients);
    const dischargeStatus = Math.random() < 0.05 ? 'deceased' : 'recovered';

    updatePatient(patientToDischarge.id, {
        status: 'Discharged',
        dischargeStatus: dischargeStatus,
        dischargedAt: new Date().toISOString(),
        floor: undefined,
        room: undefined,
        department: 'medicalRecords'
    });
    
    addNotification({
        title: dischargeStatus === 'recovered' ? 'Patient Discharged' : 'Patient Deceased',
        description: `${patientToDischarge.patientName} has been discharged (${dischargeStatus}).`
    });

  }, [patients, updatePatient, addNotification]);

  const simulateServiceRequest = useCallback(() => {
    if (serviceRequests.length < 20 && Math.random() < 0.1) {
        const newRequest = createRandomServiceRequest();
        setServiceRequests(prev => [newRequest, ...prev]);
        addNotification({ title: `New Service Request: ${newRequest.type}`, description: `For: ${t(`departments.${newRequest.department}`)}` });
    }
  }, [serviceRequests.length, setServiceRequests, addNotification, t]);

  const simulateSterilizationCycle = useCallback(() => {
    const setsToMove = instrumentSets.filter(s => {
        if (s.status === 'sterilizing') {
            return (Date.now() - s.cycleStartTime) / 1000 > s.cycleDuration;
        }
        return Math.random() < 0.05;
    });

    if (setsToMove.length === 0) return;

    const setToMove = getRandomElement(setsToMove);
    const originalStatus = setToMove.status;
    const newStatus = moveInstrumentSet(originalStatus);
    
    const wasSterilizing = originalStatus === 'sterilizing';

    setInstrumentSets(prev => prev.map(s => 
        s.id === setToMove.id 
        ? { 
            ...s, 
            status: newStatus,
            cycleStartTime: newStatus === 'sterilizing' ? Date.now() : s.cycleStartTime
          } 
        : s
    ));
    
    if (wasSterilizing) {
       addNotification({ title: t('sterilization.cycleComplete'), description: `${setToMove.name} ${t('sterilization.nowInStorage')}` });
    }

  }, [instrumentSets, setInstrumentSets, addNotification, t]);
  
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

  const performOtherRandomActions = useCallback(() => {
    const emergencyPatientsCount = patients.filter(p => p.department === 'emergency' && p.status !== 'Discharged').length;
    
    if (emergencyPatientsCount < EMERGENCY_CAPACITY && doctors.length > 0) {
      const newPatientData = createRandomPatient(doctors, true);
      const consultationFee = 25000 + Math.floor(Math.random() * 25000);
      addPatient(newPatientData, {
        type: 'consultation',
        description: `${t('reception.title')} - ${t(`departments.${newPatientData.department}`)}`,
        amount: consultationFee
      });
      addNotification({ title: t('simulation.patientAdded'), description: `${newPatientData.patientName} -> ${t(`departments.${newPatientData.department}`)}` });
    }

    const otherActions = [
      () => { 
        const emergencyPatients = patients.filter(p => p.department === 'emergency' && p.status !== 'Discharged');
        if (emergencyPatients.length === 0) return;
        const patientToMove = getRandomElement(emergencyPatients);
        let nextStatus: Patient['status'] = patientToMove.status;
        switch(patientToMove.status) {
            case 'Waiting': nextStatus = 'In Treatment'; break;
            case 'In Treatment': nextStatus = 'Observation'; break;
            case 'Observation': nextStatus = 'Waiting'; break;
        }
        updatePatient(patientToMove.id, { status: nextStatus });
      },
      simulateServiceRequest,
      simulateSterilizationCycle,
      simulateDailyCharges,
      () => { 
        if(patients.length > 0 && Math.random() < 0.3) {
          const randomPatient = getRandomElement(patients);
          const testCost = 15000 + Math.floor(Math.random() * 50000);
          addFinancialRecord(randomPatient.id, { type: 'lab', description: `${t('lab.test')} ${t('common.random')}`, amount: testCost });
        }
      },
      () => { 
        if(patients.length > 0 && Math.random() < 0.4) {
          const randomPatient = getRandomElement(patients);
          const drugCost = 5000 + Math.floor(Math.random() * 100000);
          addFinancialRecord(randomPatient.id, { type: 'pharmacy', description: `${t('pharmacy.drugName')} ${t('common.random')}`, amount: drugCost });
        }
      },
      () => {
        if (doctors.length > 20 && Math.random() < 0.05) { 
          const oldestDoctor = [...doctors].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          deleteDoctor(oldestDoctor.id);
        }
      },
    ];
    
    const randomAction = getRandomElement(otherActions);
    randomAction();

  }, [doctors, patients, addPatient, deleteDoctor, addFinancialRecord, t, addNotification, simulateServiceRequest, simulateSterilizationCycle, simulateDailyCharges, updatePatient]);

  useEffect(() => {
    let admissionInterval: NodeJS.Timeout | null = null;
    let dischargeInterval: NodeJS.Timeout | null = null;
    let otherActionsInterval: NodeJS.Timeout | null = null;

    if (isSimulating) {
      admissionInterval = setInterval(simulateAdmission, ADMISSION_INTERVAL);
      dischargeInterval = setInterval(simulateDischarge, DISCHARGE_INTERVAL);
      otherActionsInterval = setInterval(performOtherRandomActions, OTHER_ACTIONS_INTERVAL);
    }
    
    return () => {
      if (admissionInterval) clearInterval(admissionInterval);
      if (dischargeInterval) clearInterval(dischargeInterval);
      if (otherActionsInterval) clearInterval(otherActionsInterval);
    };
  }, [isSimulating, simulateAdmission, simulateDischarge, performOtherRandomActions]);

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
