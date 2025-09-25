'use client';

import { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Patient, FinancialRecord } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useDoctors } from '@/hooks/use-doctors';
import { generateInitialData } from '@/lib/mock-patients';

const PATIENTS_STORAGE_KEY = 'iraqi_doctors_patients_global_v2';

// Generate the initial data once
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
  const { user } = useAuth();
  const { updateDoctor } = useDoctors();
  
  const [patients, setPatients] = useLocalStorage<Patient[]>(
    PATIENTS_STORAGE_KEY, 
    initialPatients
  );

  const addFinancialRecord = useCallback((patientId: string, record: Omit<FinancialRecord, 'id'>) => {
    const newRecord: FinancialRecord = {
      ...record,
      id: new Date().toISOString() + Math.random(),
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
    patients: user ? patients : [],
    addPatient,
    updatePatient,
    addFinancialRecord,
  }), [patients, user, addPatient, updatePatient, addFinancialRecord]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
