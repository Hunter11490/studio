'use client';

import { createContext, useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Doctor } from '@/types';

const DOCTORS_STORAGE_KEY = 'iraqi_doctors_list_v1';

export type DoctorContextType = {
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => void;
  updateDoctor: (id: string, updates: Partial<Omit<Doctor, 'referralCount'>>) => void;
  deleteDoctor: (id: string) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  resetAllReferrals: () => void; // This is now an indirect action
  uncheckAllPartners: () => void;
  importDoctors: (newDoctors: Doctor[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterPartners: boolean;
  setFilterPartners: (filter: boolean) => void;
};

export const DoctorContext = createContext<DoctorContextType | null>(null);

export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = useLocalStorage<Doctor[]>(DOCTORS_STORAGE_KEY, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartners, setFilterPartners] = useState(false);

  const addDoctor = (doctorData: Omit<Doctor, 'id' | 'createdAt'>) => {
    const newDoctor: Doctor = {
      ...doctorData,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      referralCount: 0, // Initialize with 0, will be derived from patients
    };
    setDoctors(prev => [newDoctor, ...prev]);
  };

  const updateDoctor = (id: string, updates: Partial<Omit<Doctor, 'referralCount'>>) => {
    setDoctors(prev => prev.map(doc => (doc.id === id ? { ...doc, ...updates } : doc)));
  };

  const deleteDoctor = (id: string) => {
    setDoctors(prev => prev.filter(doc => doc.id !== id));
  };

  const getDoctorById = (id: string) => {
    return doctors.find(doc => doc.id === id);
  };

  const resetAllReferrals = () => {
    // This is now an indirect action. The patient provider should handle patient deletion.
    // The UI will update automatically. We don't change doctor data here.
    // The confirmation dialog for this is in the user-menu, and it should call the patient context.
  };

  const uncheckAllPartners = () => {
    setDoctors(prev => prev.map(doc => ({ ...doc, isPartner: false })));
  };

  const importDoctors = (newDoctors: Doctor[]) => {
    // A simple merge, could be more sophisticated (e.g., check for duplicates)
    setDoctors(prev => [...newDoctors, ...prev]);
  };

  const value = useMemo(() => ({
    doctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctorById,
    resetAllReferrals,
    uncheckAllPartners,
    importDoctors,
    searchTerm,
    setSearchTerm,
    filterPartners,
    setFilterPartners,
  }), [doctors, searchTerm, filterPartners, setDoctors]);

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}
