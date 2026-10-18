import { useMemo } from 'react';

import { dayLabel, whenLabel } from '@/lib/format';
import type { Cycle, Goal, Tx } from '@/lib/types';
import { CATEGORIES, type CategoryKey, type Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';
import { useEllie } from './EllieStore';

export type Segment = {
  cat: CategoryKey;
  color: string;
  /** Stroke dash pair for the arc. */
  dash: [number, number];
  /** Degrees of rotation applied around the ring centre. */
  rotate: number;
  /** Radians at the arc's midpoint — where the share pill hangs. */
  mid: number;
  dimmed: boolean;
};

export type RestArc = {
  dash: [number, number];
  rotate: number;
};

export type CatRow = {
  cat: CategoryKey;
  amount: number;
  share: number;
  /** Spend as a percentage of the cap, unclamped so overspend reads > 100. */
  capPct: number;
  cap: number;
  /** True when no budget has been set for this category yet. */
  uncapped: boolean;
  over: boolean;
};

export type Mover = CatRow & { delta: number | null };

export type ListGroup = {
  day: string;
  total: number;
  items: (Tx & { when: string })[];
};

/** Ring geometry — identical to the prototype's r=98 / stroke=22 donut. */
export const RING = { r: 98, stroke: 22, gap: 6, size: 222, cx: 111 } as const;
export const CIRCUMFERENCE = 2 * Math.PI * RING.r;

export type Derived = {
  t: Palette;
  dark: boolean;
  sym: string;
  cycle: Cycle;
  txs: Tx[];
  /** Total per category for the selected cycle. */
  by: Partial<Record<CategoryKey, number>>;
  spent: number;
  left: number;
  income: number;
  /** Money that moved into goals this cycle. */
  goalSpend: number;
  /** Categories with spend, in ring order. */
  cats: CategoryKey[];
  /** Categories with spend, largest first. */
  topCats: CategoryKey[];
  pctOf: (cat: CategoryKey) => number;
  segments: Segment[];
  rest: RestArc | null;
  ahead: boolean;
  paceDelta: number;
  dailyLeft: number;
  rows: CatRow[];
  ringRows: CatRow[];
  allocated: number;
  reconGap: number;
  bars: { cat: CategoryKey; pct: number; height: number }[];
  movers: Mover[];
  goals: (Goal & { pct: number; done: boolean; hatchTo: number })[];
  reachedCount: number;
  filterCats: string[];
};

const BAR_MAX_HEIGHT = 120;

export function useDerived(): Derived {
  const { state, cycle, cycles, cycleIdx, cycleTxs } = useEllie();
  const { t, dark, sym } = useTheme();

  return useMemo(() => {
    // Guarded for arithmetic; the reported figure stays truthful.
    const income = state.income || 1;
    const txs = cycleTxs;

    const by: Partial<Record<CategoryKey, number>> = {};
    txs.forEach((x) => {
      by[x.cat] = (by[x.cat] ?? 0) + x.amount;
    });

    const spent = Object.values(by).reduce<number>((a, b) => a + (b ?? 0), 0);
    const goalSpend = txs
      .filter((x) => x.src === 'Goal')
      .reduce((a, b) => a + b.amount, 0);
    const left = Math.max(income - spent, 0);

    const cats = CATEGORIES.filter((c) => by[c]);
    const topCats = (Object.keys(by) as CategoryKey[]).sort(
      (a, b) => (by[b] ?? 0) - (by[a] ?? 0),
    );
    const pctOf = (c: CategoryKey) =>
      spent ? Math.round(((by[c] ?? 0) / spent) * 100) : 0;

    // ── donut ────────────────────────────────────────────────────────────
    const segments: Segment[] = [];
    let cursor = 0;
    // What one full turn of the ring represents. Dividing by income alone gives
    // Infinity before an income is set and NaN when nothing is logged either —
    // both of which reach the SVG as a broken dash. Once spending passes income
    // the ring grows to hold it, so segments stay proportional instead of
    // each clamping to a full turn and overlapping.
    const ringBase = Math.max(income, spent) || 1;
    cats.forEach((cat) => {
      const val = by[cat] ?? 0;
      const frac = Math.min(val / ringBase, 1);
      const len = Math.max(CIRCUMFERENCE * frac - RING.gap, RING.stroke);
      const rotate = cursor * 360 - 90 + (RING.gap / CIRCUMFERENCE) * 180;
      segments.push({
        cat,
        color: t.hue[cat],
        dash: [len, CIRCUMFERENCE - len],
        rotate,
        mid: (cursor + frac / 2) * 2 * Math.PI - Math.PI / 2,
        dimmed: false,
      });
      cursor += frac;
    });

    const remaining = Math.max(1 - cursor, 0);
    let rest: RestArc | null = null;
    if (remaining > 0.012) {
      const len = Math.max(CIRCUMFERENCE * remaining - RING.gap, RING.stroke);
      rest = {
        dash: [len, CIRCUMFERENCE - len],
        rotate: cursor * 360 - 90 + (RING.gap / CIRCUMFERENCE) * 180,
      };
    }

    // ── pace ─────────────────────────────────────────────────────────────
    const elapsed = cycle ? cycle.elapsed : 0;
    const length = cycle ? cycle.length : 30;
    const closed = cycle ? cycle.daysLeft === 0 : true;
    const paceTarget = closed ? income : income * (elapsed / Math.max(length, 1));
    const ahead = spent <= paceTarget;
    const paceDelta = ahead ? Math.max(paceTarget - spent, 0) : spent - paceTarget;
    const dailyLeft = cycle && cycle.daysLeft ? left / cycle.daysLeft : 0;

    const makeRow = (cat: CategoryKey): CatRow => {
      const amount = by[cat] ?? 0;
      const cap = state.caps[cat] ?? 0;
      // No cap set yet: the row still shows the spend, but the ring stays at
      // zero rather than reading as infinitely over budget.
      const uncapped = cap <= 0;
      const capPct = uncapped ? 0 : Math.round((amount / cap) * 100);
      return {
        cat,
        amount,
        share: pctOf(cat),
        capPct,
        cap,
        uncapped,
        over: !uncapped && capPct > 100,
      };
    };

    const rows = topCats.slice(0, 3).map(makeRow);

    // Budgets list: the categories you picked during setup, plus anything you
    // have actually spent on since.
    const ringRows = (Object.keys(state.caps) as CategoryKey[])
      .filter((c) => by[c] || state.caps[c] > 0 || state.pickedCats.includes(c))
      .map(makeRow);

    const allocated = Object.values(state.caps).reduce<number>(
      (a, b) => a + (b ?? 0),
      0,
    );
    const reconGap = income - allocated;

    // ── report ───────────────────────────────────────────────────────────
    const maxBar = Math.max(...cats.map((c) => by[c] ?? 0), 1);
    const top5 = topCats.slice(0, 5);
    const bars = cats
      .filter((c) => top5.includes(c))
      .map((cat) => ({
        cat,
        pct: pctOf(cat),
        height: Math.round(((by[cat] ?? 0) / maxBar) * BAR_MAX_HEIGHT),
      }));

    const prevCycle = cycles[Math.max(cycleIdx - 1, 0)];
    const prevBy: Partial<Record<CategoryKey, number>> = {};
    if (prevCycle && prevCycle !== cycle) {
      state.txs
        .filter((x) => x.ts >= prevCycle.start && x.ts < prevCycle.end)
        .forEach((x) => {
          prevBy[x.cat] = (prevBy[x.cat] ?? 0) + x.amount;
        });
    }

    const movers: Mover[] = topCats.slice(0, 3).map((cat) => {
      const prev = prevBy[cat] ?? 0;
      const delta = prev ? Math.round((((by[cat] ?? 0) - prev) / prev) * 100) : null;
      return { ...makeRow(cat), delta };
    });

    // ── goals ────────────────────────────────────────────────────────────
    const goals = state.goals.map((g) => {
      const pct = Math.min(Math.round((g.saved / Math.max(g.target, 1)) * 100), 100);
      const done = g.saved >= g.target;
      return { ...g, pct, done, hatchTo: Math.max(g.pace, pct) };
    });
    const reachedCount = goals.filter((g) => g.done).length;

    const filterCats = ['All', ...topCats];

    return {
      t,
      dark,
      sym,
      cycle,
      txs,
      by,
      spent,
      left,
      income: state.income,
      goalSpend,
      cats,
      topCats,
      pctOf,
      segments,
      rest,
      ahead,
      paceDelta,
      dailyLeft,
      rows,
      ringRows,
      allocated,
      reconGap,
      bars,
      movers,
      goals,
      reachedCount,
      filterCats,
    };
  }, [state, cycle, cycles, cycleIdx, cycleTxs, t, dark, sym]);
}

/** Groups a transaction list by day bucket, preserving newest-first order. */
export function groupByDay(txs: Tx[], now = Date.now()): ListGroup[] {
  const order: string[] = [];
  const map = new Map<string, (Tx & { when: string })[]>();
  txs.forEach((tx) => {
    const day = dayLabel(tx.ts, now);
    if (!map.has(day)) {
      map.set(day, []);
      order.push(day);
    }
    map.get(day)!.push({ ...tx, when: whenLabel(tx.ts, now) });
  });
  return order.map((day) => {
    const items = map.get(day)!;
    return {
      day,
      total: items.reduce((a, b) => a + b.amount, 0),
      items,
    };
  });
}
