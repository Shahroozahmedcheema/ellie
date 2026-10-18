import type { AccentKey, CategoryKey } from '@/theme/tokens';

/** How a transaction reached the ledger. */
export type Source = 'Typed' | 'Voice' | 'Receipt' | 'Goal';

export type Tx = {
  id: string;
  cat: CategoryKey;
  name: string;
  amount: number;
  /** Epoch milliseconds — the display label is derived, never stored. */
  ts: number;
  src: Source;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  /** Free-text due label, e.g. "By March" or "No date yet". */
  due: string;
  /** Where the pace hatching reaches, 0–100. */
  pace: number;
};

export type Caps = Record<CategoryKey, number>;

export type Cadence = 'Daily' | 'Weekly' | 'Monthly';

export type WeekStart = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type Nudges = {
  daily: boolean;
  digest: boolean;
  overspend: boolean;
};

/** How many daily nudges: 1 soft, 2 medium, 3 aggressive. */
export type NudgeLevel = 1 | 2 | 3;

export type ThemeKey = 'light' | 'dark';

export type Profile = {
  name: string;
  age: number;
  /** Indexes into QUIZ[i].opts, one per question. */
  answers: number[];
  /** Monthly keep-target picked during setup; 'Custom' means unset. */
  keepTarget: number | 'Custom';
};

export type EllieState = {
  version: number;
  onboarded: boolean;
  theme: ThemeKey;
  accent: AccentKey;
  profile: Profile;
  income: number;
  currency: string;
  cadence: Cadence;
  cycleDay: number;
  weekStart: WeekStart;
  nudges: Nudges;
  nudgeLevel: NudgeLevel;
  caps: Caps;
  goals: Goal[];
  txs: Tx[];
  /** Categories chosen during setup — drives which caps are pre-filled. */
  pickedCats: CategoryKey[];
  /** null once the coach-mark tour has been dismissed or completed. */
  tourStep: number | null;
};

/** A resolved budget period. */
export type Cycle = {
  /** Stable key, e.g. "2026-08-25". */
  key: string;
  /** Display name, e.g. "September". */
  name: string;
  /** Range label, e.g. "25 Aug → 24 Sep". */
  label: string;
  start: number;
  end: number;
  /** Whole days remaining; 0 once the cycle has closed. */
  daysLeft: number;
  /** Whole days elapsed, clamped to the cycle length. */
  elapsed: number;
  /** Total days in the cycle. */
  length: number;
};
