'use client';

import { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Doctor, ReferralCase } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

type UpdateFunction<T> = (prev: T) => T;
type PartialDoctorWithFunction = {
  [K in keyof Doctor]?: Doctor[K] | UpdateFunction<Doctor[K]>;
};

export type SortOption = 'name' | 'createdAt' | 'address';

export type DoctorContextType = {
  doctors: Doctor[];
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt' | 'user_id'>) => Promise<{ error: PostgrestError | null }>;
  addMultipleDoctors: (doctors: Omit<Doctor, 'id' | 'createdAt' | 'user_id'>[]) => Promise<{ error: PostgrestError | null }>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<{ error: PostgrestError | null }>;
  updateMultipleDoctors: (updatedDoctors: Doctor[]) => void;
  deleteDoctor: (id: string) => Promise<{ error: PostgrestError | null }>;
  deleteAllDoctors: () => Promise<{ error: PostgrestError | null }>;
  getDoctorById: (id: string) => Doctor | undefined;
  importDoctors: (newDoctors: Doctor[]) => void;
  uncheckAllPartners: () => Promise<{ error: PostgrestError | null }>;
  resetAllReferrals: () => Promise<{ error: PostgrestError | null }>;
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

const fromSupabase = (row: any): Doctor => ({
  id: row.id,
  user_id: row.user_id,
  createdAt: row.created_at,
  name: row.name,
  specialty: row.specialty,
  phoneNumber: row.phone_number,
  clinicAddress: row.clinic_address,
  mapLocation: row.map_location,
  clinicCardImageUrl: row.clinic_card_image_url,
  isPartner: row.is_partner,
  referralCount: row.referral_count,
  referralNotes: row.referral_notes || [],
  availableDays: row.available_days || [],
});

const toSupabase = (doctor: Partial<Doctor>) => {
    const row: any = {};
    if (doctor.name !== undefined) row.name = doctor.name;
    if (doctor.specialty !== undefined) row.specialty = doctor.specialty;
    if (doctor.phoneNumber !== undefined) row.phone_number = doctor.phoneNumber;
    if (doctor.clinicAddress !== undefined) row.clinic_address = doctor.clinicAddress;
    if (doctor.mapLocation !== undefined) row.map_location = doctor.mapLocation;
    if (doctor.clinicCardImageUrl !== undefined) row.clinic_card_image_url = doctor.clinicCardImageUrl;
    if (doctor.isPartner !== undefined) row.is_partner = doctor.isPartner;
    if (doctor.referralCount !== undefined) row.referral_count = doctor.referralCount;
    if (doctor.referralNotes !== undefined) row.referral_notes = doctor.referralNotes;
    if (doctor.availableDays !== undefined) row.available_days = doctor.availableDays;
    if (doctor.user_id !== undefined) row.user_id = doctor.user_id;

    return row;
};


export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartners, setFilterPartners] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('name');

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user) {
        setDoctors([]);
        return;
      };

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching doctors:', error);
      } else if (data) {
        setDoctors(data.map(fromSupabase));
      }
    };

    fetchDoctors();
  }, [user]);

  const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'createdAt' | 'user_id'>) => {
    if (!user) return { error: { message: "User not logged in", details: "", hint: "", code: "" } };
    
    const { data, error } = await supabase
        .from('doctors')
        .insert([toSupabase({ ...doctorData, user_id: user.id })])
        .select();

    if (error) {
        console.error('Error adding doctor:', error);
    } else if (data) {
        setDoctors(prev => [fromSupabase(data[0]), ...prev]);
    }
    return { error };
  };
  
  const addMultipleDoctors = async (doctorsData: Omit<Doctor, 'id' | 'createdAt' | 'user_id'>[]) => {
     if (!user) return { error: { message: "User not logged in", details: "", hint: "", code: "" } };

    const newSupabaseDoctors = doctorsData.map(doc => toSupabase({ ...doc, user_id: user.id }));

    const { data, error } = await supabase
        .from('doctors')
        .insert(newSupabaseDoctors)
        .select();
    
    if (error) {
        console.error('Error adding multiple doctors:', error);
    } else if (data) {
        setDoctors(prev => [...data.map(fromSupabase), ...prev]);
    }
    return { error };
  };

  const updateDoctor = async (id: string, updates: Partial<Doctor>) => {
    const { data, error } = await supabase
        .from('doctors')
        .update(toSupabase(updates))
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Error updating doctor:', error);
    } else if (data) {
        setDoctors(prev => prev.map(doc => doc.id === id ? fromSupabase(data[0]) : doc));
    }
    return { error };
  };

  const updateMultipleDoctors = (updatedDoctors: Doctor[]) => {
    // This is now more complex. It's better to update one by one or handle it in a backend function.
    // For now, let's just log a warning.
    console.warn("updateMultipleDoctors is not optimized for Supabase and will be slow.");
    updatedDoctors.forEach(doc => {
      // Don't await, let them run in parallel
      updateDoctor(doc.id, doc);
    });
  };

  const deleteDoctor = async (id: string) => {
    const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting doctor:', error);
    } else {
        setDoctors(prev => prev.filter(doc => doc.id !== id));
    }
    return { error };
  };
  
  const deleteAllDoctors = async () => {
    if (!user) return { error: { message: "User not logged in", details: "", hint: "", code: "" } };
    
    const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting all doctors:', error);
    } else {
        setDoctors([]);
    }
    return { error };
  };

  const getDoctorById = (id: string) => {
    return doctors.find(doc => doc.id === id);
  };
  
  const uncheckAllPartners = async () => {
    if (!user) return { error: { message: "User not logged in", details: "", hint: "", code: "" } };
    const { data, error } = await supabase
        .from('doctors')
        .update({ is_partner: false })
        .eq('user_id', user.id)
        .eq('is_partner', true)
        .select();
        
    if(error){
        console.error('Error unchecking partners:', error);
    } else if (data) {
       setDoctors(prev => prev.map(doc => ({...doc, isPartner: false})));
    }
    return { error };
  };

  const resetAllReferrals = async () => {
    if (!user) return { error: { message: "User not logged in", details: "", hint: "", code: "" } };
    
    const { data, error } = await supabase
        .from('doctors')
        .update({ referral_count: 0, referral_notes: [] })
        .eq('user_id', user.id)
        .gt('referral_count', 0)
        .select();

    if (error) {
        console.error('Error resetting referrals:', error);
    } else if (data) {
        setDoctors(prev => prev.map(doc => ({...doc, referralCount: 0, referralNotes: []})));
    }
    return { error };
  };

  const importDoctors = async (newDoctors: Doctor[]) => {
    if (!user) return;
    // For simplicity, we'll just replace all doctors. A more robust solution might merge them.
    await deleteAllDoctors();
    await addMultipleDoctors(newDoctors);
  };

  const value = useMemo(() => ({
    doctors,
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
  }), [doctors, searchTerm, filterPartners, viewMode, sortOption]);

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}
