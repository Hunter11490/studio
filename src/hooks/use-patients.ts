'use client';

import { useContext } from 'react';
import { PatientContext, PatientContextType } from '@/components/providers/patient-provider';

export const usePatients = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};
