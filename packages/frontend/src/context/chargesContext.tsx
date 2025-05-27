// src/context/ChargesContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { charges as initialCharges } from '../mock/mockCharges';
import type { Charge } from '../mock/mockCharges';

interface ChargesContextValue {
  charges: Charge[];
  addCharge: (c: Omit<Charge,'id'>) => void;
}

const ChargesContext = createContext<ChargesContextValue | null>(null);

export function ChargesProvider({ children }: { children: React.ReactNode }) {
  const [charges, setCharges] = useState<Charge[]>(initialCharges);
  const addCharge = (chg: Omit<Charge,'id'>) =>
    setCharges(cs => [...cs, { id: cs.length + 1, ...chg }]);

  return (
    <ChargesContext.Provider value={{ charges, addCharge }}>
      {children}
    </ChargesContext.Provider>
  );
}

export function useCharges() {
  const ctx = useContext(ChargesContext);
  if (!ctx) throw new Error('useCharges must be under ChargesProvider');
  return ctx;
}

