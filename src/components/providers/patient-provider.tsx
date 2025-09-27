'use client';

import { createContext, useState, useMemo, useCallback } from 'react';
import { Patient, FinancialRecord, ReferralCase } from '@/types';
import { useDoctors } from '@/hooks/use-doctors';

const initialPatients: Patient[] = [];

export type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>, initialRecord?: Omit<FinancialRecord, 'id' | 'date'>) => void;
  updatePatient: (id: string, updates: Partial<Omit<Patient, 'id'>>) => void;
  addFinancialRecord: (patientId: string, record: Omit<FinancialRecord, 'id' | 'date'>) => void;
};

export const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { updateDoctor } = useDoctors();
  
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

  const addFinancialRecord = useCallback((patientId: string, record: Omit<FinancialRecord, 'id' | 'date'>) => {
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
    const newPatient: Patient = {
      ...patientData,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      financialRecords: [],
    };

    if(initialRecord) {
       const newRecord: FinancialRecord = {
            ...initialRecord,
            id: new Date().toISOString() + Math.random() + '_initial',
            date: new Date().toISOString()
        }
        newPatient.financialRecords!.push(newRecord);
    }


    setPatients(prev => [newPatient, ...prev]);

    if (patientData.doctorId && updateDoctor) {
      updateDoctor(patientData.doctorId, {
        referralCount: (currentCount: any) => (currentCount || 0) + 1,
        referralNotes: (currentNotes: any) => [
          ...(currentNotes || []),
          {
            patientName: patientData.patientName,
            referralDate: patientData.receptionDate,
            testDate: new Date().toISOString().split('T')[0],
            testType: initialRecord?.description || '',
            patientAge: String(new Date().getFullYear() - parseInt(patientData.dob.year)),
            chronicDiseases: '',
          },
        ] as ReferralCase[],
      });
    }

  }, [setPatients, updateDoctor]);

  const updatePatient = useCallback((id: string, updates: Partial<Omit<Patient, 'id'>>) => {
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPatient = { ...p, ...updates };

        // If department changes, clear location-specific fields
        if (updates.department) {
          if (updates.department !== 'icu') {
            updatedPatient.bedNumber = undefined;
          }
          if (updates.department !== 'wards') {
            updatedPatient.floor = undefined;
            updatedPatient.room = undefined;
          }
        }
        
        return updatedPatient;
      }
      return p;
    }));
  }, [setPatients]);
  
  const value = useMemo(() => ({
    patients,
    addPatient,
    updatePatient,
    addFinancialRecord,
  }), [patients, addPatient, updatePatient, addFinancialRecord]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}