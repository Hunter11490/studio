'use client';

import { useContext } from 'react';
import { SimulationContext } from '@/components/providers/simulation-provider';

type SimulationContextType = {
  isSimulating: boolean;
  toggleSimulation: () => void;
};

export const useSimulation = (): SimulationContextType => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
