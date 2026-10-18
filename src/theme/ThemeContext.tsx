import React, { createContext, useContext, useMemo } from 'react';

import { useEllie } from '@/store/EllieStore';
import { symbolFor } from '@/lib/format';
import { paletteFor, type Palette } from './tokens';

type ThemeCtx = {
  t: Palette;
  dark: boolean;
  /** Currency symbol for the active currency, e.g. "₨". */
  sym: string;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useEllie();
  const value = useMemo<ThemeCtx>(() => {
    const t = paletteFor(state.theme, state.accent);
    return { t, dark: t.dark, sym: symbolFor(state.currency) };
  }, [state.theme, state.accent, state.currency]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
