'use client';

import { useContext } from 'react';
import { SimulationContext } from '@/components/providers/simulation-provider';

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
