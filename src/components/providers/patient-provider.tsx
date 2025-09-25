'use client';

import { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Patient } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useDoctors } from '@/hooks/use-doctors';
import { generateInitialData } from '@/lib/mock-patients';

const BASE_PATIENTS_STORAGE_KEY = 'iraqi_doctors_patients_user';

const initialPatients: Patient[] = [];

export type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  updatePatient: (id: string, updates: Partial<Omit<Patient, 'id'>>) => void;
};

export const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { doctors, updateDoctor } = useDoctors();
  const userSpecificPatientsKey = user ? `${BASE_PATIENTS_STORAGE_KEY}_${user.id}` : null;
  
  const [patients, setPatients] = useLocalStorage<Patient[]>(
    userSpecificPatientsKey || 'temp_patients_key', 
    []
  );

  // Effect to load mock data for HUNTER user if it's the first time
  useEffect(() => {
    if (user?.username === 'HUNTER' && userSpecificPatientsKey) {
      const storedPatients = window.localStorage.getItem(userSpecificPatientsKey);
      const storedDoctors = window.localStorage.getItem(`iraqi_doctors_list_user_${user.id}`);
      
      if ((!storedPatients || JSON.parse(storedPatients).length === 0) && storedDoctors && JSON.parse(storedDoctors).length > 0) {
        const { patients: initialMockPatients } = generateInitialData();
        // The doctor list is already populated with referral counts, so we just need to set the patients
        const doctorsInStorage = JSON.parse(storedDoctors);
        
        // Remap patient doctor IDs to match the final IDs in storage
        const finalPatients = initialMockPatients.map(p => {
          if (p.doctorId) { // doctorId is the temp ID from generation
            const originalDoctor = doctorsInStorage.find((doc: Doctor) => doc.id.includes(p.doctorId!.split('_')[3])); // Match by name part of temp ID
            if(originalDoctor) {
              return { ...p, doctorId: originalDoctor.id };
            }
          }
          return { ...p, doctorId: undefined };
        });

        setPatients(finalPatients);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userSpecificPatientsKey, setPatients, doctors]);


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
        referralCount: (currentCount: number | undefined) => (currentCount || 0) + 1,
        referralNotes: (currentNotes: any[] | undefined) => [
          ...(currentNotes || []),
          {
            patientName: patientData.patientName,
            referralDate: patientData.receptionDate,
            testDate: new Date().toISOString().split('T')[0],
            testType: '',
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
  }), [patients, user, addPatient, updatePatient]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
