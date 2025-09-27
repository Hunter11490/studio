'use client';

import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Patient, FinancialRecord, ReferralCase } from '@/types';
import { useDoctors } from '@/hooks/use-doctors';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

export type PatientContextType = {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'user_id'>, initialRecord?: Omit<FinancialRecord, 'id' | 'date'>) => void;
  updatePatient: (id: string, updates: Partial<Omit<Patient, 'id' | 'user_id' | 'createdAt'>>) => void;
  addFinancialRecord: (patientId: string, record: Omit<FinancialRecord, 'id' | 'date'>) => void;
};

export const PatientContext = createContext<PatientContextType | null>(null);


const fromSupabase = (row: any): Patient => ({
  id: row.id,
  user_id: row.user_id,
  createdAt: row.created_at,
  patientName: row.patient_name,
  dob: row.dob,
  receptionDate: row.reception_date,
  address: row.address,
  idFront: row.id_front,
  idBack: row.id_back,
  department: row.department,
  doctorId: row.doctor_id,
  attendingDoctorId: row.attending_doctor_id,
  financialRecords: row.financial_records || [],
  triageLevel: row.triage_level,
  status: row.status,
  vitalSigns: row.vital_signs,
  bedNumber: row.bed_number,
  floor: row.floor,
  room: row.room,
  admittedAt: row.admitted_at,
  dischargeStatus: row.discharge_status,
  dischargedAt: row.discharged_at,
});

const toSupabase = (patient: Partial<Patient>) => {
    const row: any = {};
    if (patient.patientName !== undefined) row.patient_name = patient.patientName;
    if (patient.dob !== undefined) row.dob = patient.dob;
    if (patient.receptionDate !== undefined) row.reception_date = patient.receptionDate;
    if (patient.address !== undefined) row.address = patient.address;
    if (patient.idFront !== undefined) row.id_front = patient.idFront;
    if (patient.idBack !== undefined) row.id_back = patient.idBack;
    if (patient.department !== undefined) row.department = patient.department;
    if (patient.doctorId !== undefined) row.doctor_id = patient.doctorId;
    if (patient.attendingDoctorId !== undefined) row.attending_doctor_id = patient.attendingDoctorId;
    if (patient.financialRecords !== undefined) row.financial_records = patient.financialRecords;
    if (patient.triageLevel !== undefined) row.triage_level = patient.triageLevel;
    if (patient.status !== undefined) row.status = patient.status;
    if (patient.vitalSigns !== undefined) row.vital_signs = patient.vitalSigns;
    if (patient.bedNumber !== undefined) row.bed_number = patient.bedNumber;
    if (patient.floor !== undefined) row.floor = patient.floor;
    if (patient.room !== undefined) row.room = patient.room;
    if (patient.admittedAt !== undefined) row.admitted_at = patient.admittedAt;
    if (patient.dischargeStatus !== undefined) row.discharge_status = patient.dischargeStatus;
    if (patient.dischargedAt !== undefined) row.discharged_at = patient.dischargedAt;
    if (patient.user_id !== undefined) row.user_id = patient.user_id;

    return row;
};


export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { updateDoctor } = useDoctors();
  
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) {
        setPatients([]);
        return;
      };

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patients:', error);
      } else if (data) {
        setPatients(data.map(fromSupabase));
      }
    };

    fetchPatients();
  }, [user]);


  const addPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'createdAt' | 'user_id'>, initialRecord?: Omit<FinancialRecord, 'id' | 'date'>) => {
    if (!user) return;
    
    const financialRecords = [];
    if(initialRecord) {
       const newRecord: FinancialRecord = {
            ...initialRecord,
            id: new Date().toISOString() + Math.random() + '_initial',
            date: new Date().toISOString()
        }
        financialRecords.push(newRecord);
    }
    
    const fullPatientData = { ...patientData, financialRecords, user_id: user.id };

    const { data, error } = await supabase
        .from('patients')
        .insert([toSupabase(fullPatientData)])
        .select();

    if (error) {
        console.error("Error adding patient:", error);
    } else if (data) {
        setPatients(prev => [fromSupabase(data[0]), ...prev]);
    }


    if (patientData.doctorId && updateDoctor) {
      // This part still uses the old client-side updateDoctor logic, which is fine for now
      // as it will trigger its own Supabase update.
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

  }, [user, updateDoctor]);

  const updatePatient = useCallback(async (id: string, updates: Partial<Omit<Patient, 'id'>>) => {
    const { data, error } = await supabase
        .from('patients')
        .update(toSupabase(updates))
        .eq('id', id)
        .select();
    
    if (error) {
        console.error("Error updating patient:", error);
    } else if (data) {
        setPatients(prev => prev.map(p => p.id === id ? fromSupabase(data[0]) : p));
    }
  }, []);

  const addFinancialRecord = useCallback(async (patientId: string, record: Omit<FinancialRecord, 'id' | 'date'>) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const newRecord: FinancialRecord = {
      ...record,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
    };
    
    const updatedRecords = [...(patient.financialRecords || []), newRecord];
    
    await updatePatient(patientId, { financialRecords: updatedRecords });

  }, [patients, updatePatient]);
  
  const value = useMemo(() => ({
    patients,
    addPatient,
    updatePatient,
    addFinancialRecord,
  }), [patients, addPatient, updatePatient, addFinancialRecord]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
