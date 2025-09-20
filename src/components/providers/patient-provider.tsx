'use client';

import { createContext, useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Patient } from '@/types';

const PATIENTS_STORAGE_KEY = 'iraqi_doctors_patients_v1';

export type PatientContextType = {
  patients: Patient[];
  getPatientsByDoctor: (doctorId: string) => Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  deletePatientsByDoctor: (doctorId: string) => void;
  deleteAllPatients: () => void; // New function for resetting referrals
};

export const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useLocalStorage<Patient[]>(PATIENTS_STORAGE_KEY, []);

  const getPatientsByDoctor = (doctorId: string) => {
    return patients.filter(p => p.referringDoctorId === doctorId).sort((a, b) => new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime());
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: new Date().toISOString() + Math.random(),
    };
    setPatients(prev => [newPatient, ...prev]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };
  
  const deletePatientsByDoctor = (doctorId: string) => {
    setPatients(prev => prev.filter(p => p.referringDoctorId !== doctorId));
  };

  const deleteAllPatients = () => {
    setPatients([]);
  };

  const value = useMemo(() => ({
    patients,
    getPatientsByDoctor,
    addPatient,
    updatePatient,
    deletePatient,
    deletePatientsByDoctor,
    deleteAllPatients,
  }), [patients, setPatients]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
