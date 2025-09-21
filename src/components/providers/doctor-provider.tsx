'use client';

import { createContext, useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Doctor } from '@/types';

const DOCTORS_STORAGE_KEY = 'iraqi_doctors_list_v1';

export type DoctorContextType = {
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  importDoctors: (newDoctors: Doctor[]) => void;
  uncheckAllPartners: () => void;
  resetAllReferrals: () => void;
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
      referralCount: doctorData.referralCount || 0,
      referralNotes: Array(doctorData.referralCount || 0).fill(''),
    };
    setDoctors(prev => [newDoctor, ...prev]);
  };

  const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    setDoctors(prev => prev.map(doc => (doc.id === id ? { ...doc, ...updates } : doc)));
  };

  const deleteDoctor = (id: string) => {
    setDoctors(prev => prev.filter(doc => doc.id !== id));
  };

  const getDoctorById = (id: string) => {
    return doctors.find(doc => doc.id === id);
  };
  
  const uncheckAllPartners = () => {
    setDoctors(prev => prev.map(doc => ({ ...doc, isPartner: false })));
  };

  const resetAllReferrals = () => {
    setDoctors(prev => prev.map(doc => ({ ...doc, referralCount: 0, referralNotes: [] })));
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
    importDoctors,
    uncheckAllPartners,
    resetAllReferrals,
    searchTerm,
    setSearchTerm,
    filterPartners,
    setFilterPartners,
  }), [doctors, searchTerm, filterPartners, setDoctors]);

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}
