'use client';

import { useContext } from 'react';
import { DoctorContext, DoctorContextType } from '@/components/providers/doctor-provider';

export const useDoctors = (): DoctorContextType => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctors must be used within a DoctorProvider');
  }
  return context;
};
