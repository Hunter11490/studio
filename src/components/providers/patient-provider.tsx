'use client';

import { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Patient } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useDoctors } from '@/hooks/use-doctors';
import { MOCK_PATIENTS } from '@/lib/mock-patients';

const BASE_PATIENTS_STORAGE_KEY = 'iraqi_doctors_patients_user';

const initialPatients: Patient[] = [];

export type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
};

export const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { updateDoctor } = useDoctors();
  const userSpecificPatientsKey = user ? `${BASE_PATIENTS_STORAGE_KEY}_${user.id}` : null;
  
  // Conditionally set initial data to MOCK_PATIENTS for the main admin user (HUNTER) on first load
  const [patients, setPatients] = useLocalStorage<Patient[]>(
    userSpecificPatientsKey || 'temp_patients_key', 
    []
  );

  // Effect to load mock data for HUNTER user if it's the first time
  useEffect(() => {
    if (user?.username === 'HUNTER' && userSpecificPatientsKey) {
      const storedData = window.localStorage.getItem(userSpecificPatientsKey);
      if (!storedData || JSON.parse(storedData).length === 0) {
        setPatients(MOCK_PATIENTS);
      }
    }
  }, [user, userSpecificPatientsKey, setPatients]);


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

    // If a doctor is assigned, update their referral count
    if (patientData.doctorId && updateDoctor) {
      updateDoctor(patientData.doctorId, {
        referralCount: (currentCount) => (currentCount || 0) + 1,
        referralNotes: (currentNotes) => [
          ...(currentNotes || []),
          {
            patientName: patientData.patientName,
            referralDate: patientData.receptionDate,
            testDate: new Date().toISOString().split('T')[0],
            testType: '',
            patientAge: '',
            chronicDiseases: '',
          },
        ]
      });
    }

  }, [setPatients, updateDoctor]);

  const value = useMemo(() => ({
    patients: user ? patients : [],
    addPatient,
  }), [patients, user, addPatient]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
