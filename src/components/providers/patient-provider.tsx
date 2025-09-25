'use client';

import { createContext, useState, useMemo, useCallback } from 'react';
import { Patient, FinancialRecord } from '@/types';
import { useDoctors } from '@/hooks/use-doctors';
import { generateInitialData } from '@/lib/mock-patients';

const initialData = generateInitialData();
const initialPatients = initialData.patients;

export type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>, initialRecord?: Omit<FinancialRecord, 'id' | 'date'>) => void;
  updatePatient: (id: string, updates: Partial<Omit<Patient, 'id'>>) => void;
  addFinancialRecord: (patientId: string, record: Omit<FinancialRecord, 'id'>) => void;
};

export const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { updateDoctor } = useDoctors();
  
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

  const addFinancialRecord = useCallback((patientId: string, record: Omit<FinancialRecord, 'id'>) => {
    const newRecord: FinancialRecord = {
      ...record,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
    };
    
    setPatients(prev => 
      prev.map(p => 
        p.id === patientId 
          ? { ...p, financialRecords: [...(p.financialRecords || []), newRecord] } 
          : p
      )
    );
  }, [setPatients]);


  const addPatient = useCallback((patientData: Omit<Patient, 'id' | 'createdAt'>, initialRecord?: Omit<FinancialRecord, 'id' | 'date'>) => {
    const financialRecords: FinancialRecord[] = [];
    if(initialRecord) {
        financialRecords.push({
            ...initialRecord,
            id: new Date().toISOString() + Math.random() + '_initial',
            date: new Date().toISOString()
        })
    }

    const newPatient: Patient = {
      ...patientData,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      financialRecords,
    };
    setPatients(prev => [newPatient, ...prev]);

    // If a doctor is assigned, update their referral count
    if (patientData.doctorId && updateDoctor) {
      updateDoctor(patientData.doctorId, {
        referralCount: (currentCount: number | undefined) => (currentCount || 0) + 1,
        referralNotes: (currentNotes: any[] | undefined) => [
          ...(currentNotes || []),
          {
            patientName: patientData.patientName,
            referralDate: patientData.receptionDate,
            testDate: new Date().toISOString().split('T')[0],
            testType: initialRecord?.description || '',
            patientAge: String(new Date().getFullYear() - parseInt(patientData.dob.year)),
            chronicDiseases: '',
          },
        ]
      });
    }

  }, [setPatients, updateDoctor]);

  const updatePatient = useCallback((id: string, updates: Partial<Omit<Patient, 'id'>>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setPatients]);
  
  const value = useMemo(() => ({
    patients,
    addPatient,
    updatePatient,
    addFinancialRecord,
  }), [patients, addPatient, updatePatient, addFinancialRecord]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
