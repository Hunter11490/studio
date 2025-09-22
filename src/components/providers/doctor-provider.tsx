'use client';

import { createContext, useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Doctor } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const BASE_DOCTORS_STORAGE_KEY = 'iraqi_doctors_list_user';
const VIEW_MODE_STORAGE_KEY = 'iraqi_doctors_view_mode_v1';
const SORT_OPTION_STORAGE_KEY = 'iraqi_doctors_sort_option_v1';

export type SortOption = 'name' | 'createdAt' | 'address';

const initialDoctors: Doctor[] = [];

export type DoctorContextType = {
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => void;
  addMultipleDoctors: (doctors: Omit<Doctor, 'id' | 'createdAt'>[]) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  updateMultipleDoctors: (updatedDoctors: Doctor[]) => void;
  deleteDoctor: (id: string) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  importDoctors: (newDoctors: Doctor[]) => void;
  uncheckAllPartners: () => void;
  resetAllReferrals: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterPartners: boolean;
  setFilterPartners: (filter: boolean) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
};

export const DoctorContext = createContext<DoctorContextType | null>(null);

export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userSpecificDoctorsKey = user ? `${BASE_DOCTORS_STORAGE_KEY}_${user.id}` : null;
  
  const [doctors, setDoctors] = useLocalStorage<Doctor[]>(userSpecificDoctorsKey || 'temp_doctors_key', initialDoctors);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartners, setFilterPartners] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(VIEW_MODE_STORAGE_KEY, 'grid');
  const [sortOption, setSortOption] = useLocalStorage<SortOption>(SORT_OPTION_STORAGE_KEY, 'createdAt');

  // When user logs out, clear the doctors from state.
  useEffect(() => {
    if (!user) {
      setDoctors(initialDoctors);
    }
  }, [user, setDoctors]);


  const addDoctor = (doctorData: Omit<Doctor, 'id' | 'createdAt'>) => {
    const referralCount = doctorData.referralCount || 0;
    const newDoctor: Doctor = {
      ...doctorData,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
      referralCount: referralCount,
      referralNotes: Array(referralCount).fill(null).map(() => ({
        patientName: '',
        referralDate: '',
        testType: '',
        patientAge: '',
        chronicDiseases: '',
      })),
    };
    setDoctors(prev => [newDoctor, ...prev]);
  };
  
  const addMultipleDoctors = (doctorsData: Omit<Doctor, 'id' | 'createdAt'>[]) => {
    const newDoctors: Doctor[] = doctorsData.map((doctorData, index) => {
       const referralCount = doctorData.referralCount || 0;
       return {
          ...doctorData,
          id: new Date().toISOString() + Math.random() + index,
          createdAt: new Date().toISOString(),
          referralCount: referralCount,
          referralNotes: Array(referralCount).fill(null).map(() => ({
            patientName: '',
            referralDate: '',
            testType: '',
            patientAge: '',
            chronicDiseases: '',
          })),
        };
    });
    setDoctors(prev => [...newDoctors, ...prev]);
  };

  const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    setDoctors(prev => prev.map(doc => (doc.id === id ? { ...doc, ...updates } : doc)));
  };

  const updateMultipleDoctors = (updatedDoctors: Doctor[]) => {
    setDoctors(updatedDoctors);
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
    const existingIds = new Set(doctors.map(d => d.id));
    const trulyNewDoctors = newDoctors.filter(d => !existingIds.has(d.id));
    setDoctors(prev => [...prev, ...trulyNewDoctors]);
  };

  const value = useMemo(() => ({
    doctors: user ? doctors : [],
    addDoctor,
    addMultipleDoctors,
    updateDoctor,
    updateMultipleDoctors,
    deleteDoctor,
    getDoctorById,
    importDoctors,
    uncheckAllPartners,
    resetAllReferrals,
    searchTerm,
    setSearchTerm,
    filterPartners,
    setFilterPartners,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
  }), [doctors, user, searchTerm, filterPartners, viewMode, sortOption, setDoctors, setViewMode, setSortOption]);

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}
