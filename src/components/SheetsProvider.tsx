import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { CategoryKey } from '@/theme/tokens';
import { AddSheet, type AddMode } from './AddSheet';
import { AmountSheet } from './AmountSheet';
import { NewGoalSheet } from './NewGoalSheet';

export type AmountConfig =
  | { kind: 'budget'; cat: CategoryKey; title: string; sub: string }
  | { kind: 'income'; title: string; sub: string }
  | { kind: 'goalTarget'; name: string; title: string; sub: string }
  | { kind: 'goalAdd'; goalId: string; title: string; sub: string }
  | {
      kind: 'tx';
      id: string;
      cat: CategoryKey;
      title: string;
      sub: string;
    };

type Ctx = {
  openAmount: (cfg: AmountConfig) => void;
  closeAmount: () => void;
  openAdd: (mode: AddMode) => void;
  closeAdd: () => void;
  openNewGoal: () => void;
  closeNewGoal: () => void;
};

const SheetsContext = createContext<Ctx | null>(null);

export function SheetsProvider({ children }: { children: React.ReactNode }) {
  const [amount, setAmount] = useState<AmountConfig | null>(null);
  const [addMode, setAddMode] = useState<AddMode | null>(null);
  const [newGoal, setNewGoal] = useState(false);

  const openAmount = useCallback((cfg: AmountConfig) => {
    setAddMode(null);
    setAmount(cfg);
  }, []);
  const closeAmount = useCallback(() => setAmount(null), []);
  const openAdd = useCallback((mode: AddMode) => {
    setAmount(null);
    setAddMode(mode);
  }, []);
  const closeAdd = useCallback(() => setAddMode(null), []);
  const openNewGoal = useCallback(() => setNewGoal(true), []);
  const closeNewGoal = useCallback(() => setNewGoal(false), []);

  const value = useMemo<Ctx>(
    () => ({
      openAmount,
      closeAmount,
      openAdd,
      closeAdd,
      openNewGoal,
      closeNewGoal,
    }),
    [openAmount, closeAmount, openAdd, closeAdd, openNewGoal, closeNewGoal],
  );

  return (
    <SheetsContext.Provider value={value}>
      {children}
      <AmountSheet config={amount} onClose={closeAmount} />
      <AddSheet mode={addMode} onClose={closeAdd} onModeChange={setAddMode} />
      <NewGoalSheet
        open={newGoal}
        onClose={closeNewGoal}
        onNameSet={(name) => {
          setNewGoal(false);
          openAmount({
            kind: 'goalTarget',
            name,
            title: name,
            sub: 'How much do you need in total?',
          });
        }}
      />
    </SheetsContext.Provider>
  );
}

export function useSheets() {
  const ctx = useContext(SheetsContext);
  if (!ctx) throw new Error('useSheets must be used inside <SheetsProvider>');
  return ctx;
}
