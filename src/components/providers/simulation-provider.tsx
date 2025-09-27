'use client';

import { createContext, ReactNode, useMemo } from 'react';

type SimulationContextType = {
  isSimulating: boolean;
  toggleSimulation: () => void;
};

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  
  const contextValue = useMemo(() => ({
    isSimulating: false,
    toggleSimulation: () => {},
  }), []);

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
}
