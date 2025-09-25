'use client';

import { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Doctor } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { MOCK_DOCTORS } from '@/lib/mock-doctors';

const BASE_DOCTORS_STORAGE_KEY = 'iraqi_doctors_list_user';
const VIEW_MODE_STORAGE_KEY = 'iraqi_doctors_view_mode_v1';
const SORT_OPTION_STORAGE_KEY = 'iraqi_doctors_sort_option_v1';

export type SortOption = 'name' | 'createdAt' | 'address';

const initialDoctors: Doctor[] = [];

// This allows for functional updates, e.g., setCount(c => c + 1)
type UpdateFunction<T> = (prev: T) => T;
type PartialDoctorWithFunction = {
  [K in keyof Doctor]?: Doctor[K] | UpdateFunction<Doctor[K]>;
};

export type DoctorContextType = {
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => void;
  addMultipleDoctors: (doctors: Omit<Doctor, 'id' | 'createdAt'>[]) => void;
  updateDoctor: (id: string, updates: PartialDoctorWithFunction) => void;
  updateMultipleDoctors: (updatedDoctors: Doctor[]) => void;
  deleteDoctor: (id: string) => void;
  deleteAllDoctors: () => void;
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
  
  const [doctors, setDoctors] = useLocalStorage<Doctor[]>(
    userSpecificDoctorsKey || 'temp_doctors_key', 
    []
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartners, setFilterPartners] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(VIEW_MODE_STORAGE_KEY, 'grid');
  const [sortOption, setSortOption] = useLocalStorage<SortOption>(SORT_OPTION_STORAGE_KEY, 'name');

  // Effect to load mock data for HUNTER user if it's the first time
  useEffect(() => {
    if (user?.username === 'HUNTER' && userSpecificDoctorsKey) {
      const storedData = window.localStorage.getItem(userSpecificDoctorsKey);
      if (!storedData || JSON.parse(storedData).length === 0) {
        setDoctors(MOCK_DOCTORS.map(doc => ({
          ...doc,
          id: new Date().toISOString() + Math.random() + doc.name,
          createdAt: new Date().toISOString(),
          referralNotes: Array((doc.referralCount || 0)).fill(null).map(() => ({
            patientName: '', referralDate: '', testDate: '', testType: '', patientAge: '', chronicDiseases: ''
          })),
        })));
      }
    }
  }, [user, userSpecificDoctorsKey, setDoctors]);


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
        testDate: new Date().toISOString().split('T')[0],
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
            testDate: new Date().toISOString().split('T')[0],
            testType: '',
            patientAge: '',
            chronicDiseases: '',
          })),
        };
    });
    setDoctors(prev => [...newDoctors, ...prev]);
  };

  const updateDoctor = useCallback((id: string, updates: PartialDoctorWithFunction) => {
    setDoctors(prev => prev.map(doc => {
      if (doc.id === id) {
        const newDoc = { ...doc };
        for (const key in updates) {
          const updateValue = updates[key as keyof typeof updates];
          if (typeof updateValue === 'function') {
            (newDoc as any)[key] = updateValue((doc as any)[key]);
          } else {
            (newDoc as any)[key] = updateValue;
          }
        }
        return newDoc;
      }
      return doc;
    }));
  }, [setDoctors]);

  const updateMultipleDoctors = (updatedDoctors: Doctor[]) => {
    setDoctors(updatedDoctors);
  };

  const deleteDoctor = (id: string) => {
    setDoctors(prev => prev.filter(doc => doc.id !== id));
  };
  
  const deleteAllDoctors = () => {
    setDoctors([]);
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
    setDoctors(newDoctors);
  };

  const value = useMemo(() => ({
    doctors: user ? doctors : [],
    addDoctor,
    addMultipleDoctors,
    updateDoctor,
    updateMultipleDoctors,
    deleteDoctor,
    deleteAllDoctors,
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
  }), [doctors, user, searchTerm, filterPartners, viewMode, sortOption, addMultipleDoctors, updateDoctor, updateMultipleDoctors, deleteDoctor, deleteAllDoctors, getDoctorById, importDoctors, uncheckAllPartners, resetAllReferrals, setViewMode, setSortOption]);

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}
