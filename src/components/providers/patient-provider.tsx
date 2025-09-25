'use client';

import { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Patient } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const BASE_PATIENTS_STORAGE_KEY = 'iraqi_doctors_patients_user';

const initialPatients: Patient[] = [];

export type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
};

export const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userSpecificPatientsKey = user ? `${BASE_PATIENTS_STORAGE_KEY}_${user.id}` : null;
  
  const [patients, setPatients] = useLocalStorage<Patient[]>(userSpecificPatientsKey || 'temp_patients_key', initialPatients);

  useEffect(() => {
    if (!user) {
      setPatients(initialPatients);
    }
  }, [user, setPatients]);

  const addPatient = useCallback((patientData: Omit<Patient, 'id' | 'createdAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
    };
    setPatients(prev => [newPatient, ...prev]);
  }, [setPatients]);

  const value = useMemo(() => ({
    patients: user ? patients : [],
    addPatient,
  }), [patients, user, addPatient]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
