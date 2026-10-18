import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { buildCycles } from '@/lib/cycle';
import { applyNudgeSchedule } from '@/lib/notifications';
import {
  DEFAULT_INCOME,
  EMPTY_CAPS,
  SEED_VERSION,
  STORAGE_KEY,
  newId,
} from '@/lib/seed';
import type {
  Cadence,
  Caps,
  Cycle,
  EllieState,
  Goal,
  Nudges,
  NudgeLevel,
  Source,
  ThemeKey,
  Tx,
  WeekStart,
} from '@/lib/types';
import type { AccentKey, CategoryKey } from '@/theme/tokens';

/** A fresh install: no ledger, no goals, no caps — everything is yours. */
const DEFAULT_STATE = (): EllieState => ({
  version: SEED_VERSION,
  onboarded: false,
  theme: 'light',
  accent: 'coral',
  profile: { name: '', age: 25, answers: [], keepTarget: 'Custom' },
  income: DEFAULT_INCOME,
  currency: 'PKR',
  cadence: 'Monthly',
  cycleDay: 25,
  weekStart: 'Mon',
  nudges: { daily: true, digest: true, overspend: false },
  nudgeLevel: 2,
  caps: EMPTY_CAPS(),
  goals: [],
  txs: [],
  pickedCats: [],
  tourStep: null,
});

export type PopKind = 'add' | 'edit' | 'del' | 'budget' | 'info';

export type Pop = {
  id: number;
  kind: PopKind;
  title: string;
  sub?: string;
  cat: CategoryKey;
};

type Ctx = {
  state: EllieState;
  ready: boolean;
  /** Cycles for the active cadence, oldest first; the last one is live. */
  cycles: Cycle[];
  cycleIdx: number;
  cycle: Cycle;
  setCycleIdx: (i: number) => void;
  /** Transactions inside the selected cycle, newest first. */
  cycleTxs: Tx[];

  pop: Pop | null;
  showPop: (kind: PopKind, title: string, sub?: string, cat?: CategoryKey) => void;
  flash: (title: string, sub?: string) => void;

  celebrate: string | null;
  clearCelebrate: () => void;

  /** Category whose row should bloom after an edit. */
  pulseCat: CategoryKey | null;

  addTx: (input: {
    cat: CategoryKey;
    name: string;
    amount: number;
    ts?: number;
    src?: Source;
  }) => void;
  updateTx: (id: string, patch: { amount?: number; cat?: CategoryKey }) => void;
  removeTx: (id: string) => void;

  setCap: (cat: CategoryKey, value: number) => void;
  setIncome: (value: number) => void;

  addGoal: (name: string, target: number) => string;
  removeGoal: (id: string) => void;
  contribute: (goalId: string, amount: number) => void;

  setTheme: (theme: ThemeKey) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentKey) => void;
  setCurrency: (code: string) => void;
  setCadence: (cadence: Cadence) => void;
  setCycleDay: (day: number) => void;
  setWeekStart: (day: WeekStart) => void;
  setNudge: (key: keyof Nudges, value: boolean) => void;
  setNudgeLevel: (level: NudgeLevel) => void;

  finishOnboarding: (result: {
    name: string;
    age: number;
    answers: number[];
    income: number;
    currency: string;
    cadence: Cadence;
    cycleDay: number;
    weekStart: WeekStart;
    cats: CategoryKey[];
    keepTarget: number | 'Custom';
    nudges: Nudges;
    nudgeLevel: NudgeLevel;
    theme: ThemeKey;
    accent: AccentKey;
  }) => void;

  tourStep: number | null;
  nextTour: () => void;
  skipTour: () => void;

  eraseData: () => void;
};

const EllieContext = createContext<Ctx | null>(null);

export function EllieProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EllieState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [cycleIdx, setCycleIdxRaw] = useState(3);
  const [pop, setPop] = useState<Pop | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [pulseCat, setPulseCat] = useState<CategoryKey | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popSeq = useRef(0);

  // ── load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<EllieState>;
          if (alive && saved && saved.version === SEED_VERSION) {
            const base = DEFAULT_STATE();
            setState({
              ...base,
              ...saved,
              profile: { ...base.profile, ...(saved.profile ?? {}) },
              nudges: { ...base.nudges, ...(saved.nudges ?? {}) },
              nudgeLevel: (saved.nudgeLevel ?? base.nudgeLevel) as NudgeLevel,
              caps: { ...base.caps, ...(saved.caps ?? {}) } as Caps,
              goals: saved.goals ?? base.goals,
              txs: saved.txs ?? base.txs,
            });
            setReady(true);
            return;
          }
        }
      } catch {
        // A corrupt or unreadable store falls through to a fresh install.
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── persist ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Persistence is best-effort; the session keeps working either way.
    });
  }, [state, ready]);

  // Re-scheduling is cheap and idempotent, so just react to the two settings
  // that decide it rather than threading calls through every action.
  useEffect(() => {
    if (!ready || !state.onboarded) return;
    // Deferred deliberately: this fires on the first render after setup
    // finishes, which is the same frame the app is navigating to /home. Doing
    // native notification work there competes with the transition, so it waits
    // until the screen has settled.
    const id = setTimeout(() => {
      void applyNudgeSchedule(state.nudgeLevel, state.nudges.daily);
    }, 1200);
    return () => clearTimeout(id);
  }, [ready, state.onboarded, state.nudgeLevel, state.nudges.daily]);

  // Keep "days left" honest if the app is left open across midnight.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      if (popTimer.current) clearTimeout(popTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    },
    [],
  );

  const cycles = useMemo(
    () => buildCycles(state.cadence, state.cycleDay, state.weekStart, now),
    [state.cadence, state.cycleDay, state.weekStart, now],
  );

  const safeIdx = Math.min(Math.max(cycleIdx, 0), cycles.length - 1);
  const cycle = cycles[safeIdx];

  // Snap back to the live cycle whenever the cadence reshapes the strip.
  useEffect(() => {
    setCycleIdxRaw(cycles.length - 1);
  }, [state.cadence, state.cycleDay, state.weekStart, cycles.length]);

  const cycleTxs = useMemo(() => {
    if (!cycle) return [];
    return state.txs
      .filter((t) => t.ts >= cycle.start && t.ts < cycle.end)
      .sort((a, b) => b.ts - a.ts);
  }, [state.txs, cycle]);

  const showPop = useCallback(
    (kind: PopKind, title: string, sub?: string, cat: CategoryKey = 'Other') => {
      popSeq.current += 1;
      setPop({ id: popSeq.current, kind, title, sub, cat });
      if (popTimer.current) clearTimeout(popTimer.current);
      popTimer.current = setTimeout(() => setPop(null), 1750);
    },
    [],
  );

  const flash = useCallback(
    (title: string, sub?: string) => showPop('info', title, sub, 'Other'),
    [showPop],
  );

  const pulse = useCallback((cat: CategoryKey) => {
    setPulseCat(cat);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulseCat(null), 940);
  }, []);

  const fireCelebrate = useCallback((name: string) => {
    setCelebrate(name);
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    celebrateTimer.current = setTimeout(() => setCelebrate(null), 2600);
  }, []);

  // ── transactions ──────────────────────────────────────────────────────
  const addTx = useCallback<Ctx['addTx']>(
    ({ cat, name, amount, ts = Date.now(), src = 'Typed' }) => {
      const tx: Tx = { id: newId(), cat, name, amount, ts, src };
      setState((s) => ({ ...s, txs: [tx, ...s.txs] }));
      pulse(cat);
    },
    [pulse],
  );

  const updateTx = useCallback<Ctx['updateTx']>((id, patch) => {
    setState((s) => ({
      ...s,
      txs: s.txs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTx = useCallback<Ctx['removeTx']>((id) => {
    setState((s) => ({ ...s, txs: s.txs.filter((t) => t.id !== id) }));
  }, []);

  // ── budgets ───────────────────────────────────────────────────────────
  const setCap = useCallback<Ctx['setCap']>(
    (cat, value) => {
      setState((s) => ({ ...s, caps: { ...s.caps, [cat]: value } }));
      pulse(cat);
    },
    [pulse],
  );

  const setIncome = useCallback<Ctx['setIncome']>((value) => {
    setState((s) => ({ ...s, income: value }));
  }, []);

  // ── goals ─────────────────────────────────────────────────────────────
  const addGoal = useCallback<Ctx['addGoal']>((name, target) => {
    const id = newId('g');
    setState((s) => ({
      ...s,
      goals: s.goals.concat([
        { id, name, target, saved: 0, due: 'No date yet', pace: 12 },
      ]),
    }));
    return id;
  }, []);

  const removeGoal = useCallback<Ctx['removeGoal']>((id) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, []);

  /**
   * Money into a goal leaves the balance, so it lands in the ledger as an
   * `Other` transaction named after the goal — exactly as the prototype does.
   */
  const contribute = useCallback<Ctx['contribute']>(
    (goalId, amount) => {
      let reached: string | null = null;
      let put = 0;
      setState((s) => {
        const goal = s.goals.find((g) => g.id === goalId);
        if (!goal) return s;
        put = Math.max(Math.min(amount, goal.target - goal.saved), 0);
        if (put <= 0) return s;
        const saved = goal.saved + put;
        if (saved >= goal.target) reached = goal.name;
        const tx: Tx = {
          id: newId(),
          cat: 'Other',
          name: `→ ${goal.name}`,
          amount: put,
          ts: Date.now(),
          src: 'Goal',
        };
        return {
          ...s,
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, saved } : g)),
          txs: [tx, ...s.txs],
        };
      });
      pulse('Other');
      if (reached) fireCelebrate(reached);
      return;
    },
    [pulse, fireCelebrate],
  );

  // ── settings ──────────────────────────────────────────────────────────
  const setTheme = useCallback<Ctx['setTheme']>((theme) => {
    setState((s) => ({ ...s, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  const setAccent = useCallback<Ctx['setAccent']>((accent) => {
    setState((s) => ({ ...s, accent }));
  }, []);

  const setCurrency = useCallback<Ctx['setCurrency']>((currency) => {
    setState((s) => ({ ...s, currency }));
  }, []);

  const setCadence = useCallback<Ctx['setCadence']>((cadence) => {
    setState((s) => ({ ...s, cadence }));
  }, []);

  const setCycleDay = useCallback<Ctx['setCycleDay']>((cycleDay) => {
    setState((s) => ({ ...s, cycleDay }));
  }, []);

  const setWeekStart = useCallback<Ctx['setWeekStart']>((weekStart) => {
    setState((s) => ({ ...s, weekStart }));
  }, []);

  const setNudge = useCallback<Ctx['setNudge']>((key, value) => {
    setState((s) => ({ ...s, nudges: { ...s.nudges, [key]: value } }));
  }, []);

  const setNudgeLevel = useCallback<Ctx['setNudgeLevel']>((level) => {
    setState((s) => ({ ...s, nudgeLevel: level }));
  }, []);

  // ── setup ─────────────────────────────────────────────────────────────
  const finishOnboarding = useCallback<Ctx['finishOnboarding']>((result) => {
    setState((s) => {
      const caps = { ...s.caps };
      const share = Math.max(
        Math.round(result.income / Math.max(result.cats.length, 1) / 500) * 500,
        500,
      );
      result.cats.forEach((c) => {
        caps[c] = caps[c] || share;
      });
      return {
        ...s,
        onboarded: true,
        theme: result.theme,
        accent: result.accent,
        income: result.income,
        currency: result.currency,
        cadence: result.cadence,
        cycleDay: result.cycleDay,
        weekStart: result.weekStart,
        nudges: result.nudges,
        nudgeLevel: result.nudgeLevel,
        caps,
        pickedCats: result.cats,
        profile: {
          name: result.name.trim(),
          age: result.age,
          answers: result.answers,
          keepTarget: result.keepTarget,
        },
        tourStep: 0,
      };
    });
  }, []);

  const nextTour = useCallback(() => {
    setState((s) => {
      const step = (s.tourStep ?? 0) + 1;
      return { ...s, tourStep: step >= 6 ? null : step };
    });
  }, []);

  const skipTour = useCallback(() => {
    setState((s) => ({ ...s, tourStep: null }));
  }, []);

  /** Wipes the ledger and goals but keeps your setup — currency, cycle, caps. */
  const eraseData = useCallback(() => {
    setState((s) => ({ ...s, txs: [], goals: [] }));
    setCycleIdxRaw(cycles.length - 1);
    flash('Everything erased', 'Your setup is untouched');
  }, [cycles.length, flash]);

  const setCycleIdx = useCallback(
    (i: number) => setCycleIdxRaw(Math.min(Math.max(i, 0), cycles.length - 1)),
    [cycles.length],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      cycles,
      cycleIdx: safeIdx,
      cycle,
      setCycleIdx,
      cycleTxs,
      pop,
      showPop,
      flash,
      celebrate,
      clearCelebrate: () => setCelebrate(null),
      pulseCat,
      addTx,
      updateTx,
      removeTx,
      setCap,
      setIncome,
      addGoal,
      removeGoal,
      contribute,
      setTheme,
      toggleTheme,
      setAccent,
      setCurrency,
      setCadence,
      setCycleDay,
      setWeekStart,
      setNudge,
      setNudgeLevel,
      finishOnboarding,
      tourStep: state.tourStep,
      nextTour,
      skipTour,
      eraseData,
    }),
    [
      state,
      ready,
      cycles,
      safeIdx,
      cycle,
      setCycleIdx,
      cycleTxs,
      pop,
      showPop,
      flash,
      celebrate,
      pulseCat,
      addTx,
      updateTx,
      removeTx,
      setCap,
      setIncome,
      addGoal,
      removeGoal,
      contribute,
      setTheme,
      toggleTheme,
      setAccent,
      setCurrency,
      setCadence,
      setCycleDay,
      setWeekStart,
      setNudge,
      setNudgeLevel,
      finishOnboarding,
      nextTour,
      skipTour,
      eraseData,
    ],
  );

  return <EllieContext.Provider value={value}>{children}</EllieContext.Provider>;
}

export function useEllie() {
  const ctx = useContext(EllieContext);
  if (!ctx) throw new Error('useEllie must be used inside <EllieProvider>');
  return ctx;
}

export type { Goal, Tx };
