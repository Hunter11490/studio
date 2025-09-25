'use client';

import { useContext } from 'react';
import { DoctorContext, DoctorContextType } from '@/components/providers/doctor-provider';

// This is a temporary type to allow function as an updater
type UpdateFunction<T> = (prev: T) => T;
type PartialDoctorWithFunction = {
  [K in keyof Doctor]?: Doctor[K] | UpdateFunction<Doctor[K]>;
};


export const useDoctors = (): DoctorContextType => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctors must be used within a DoctorProvider');
  }
  return context;
};
