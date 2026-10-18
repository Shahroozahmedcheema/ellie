import type { Cadence, Cycle, WeekStart } from './types';
import { DAY_MS, MONTH_LONG, daysBetween, ordinal } from './format';

const SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEK_INDEX: Record<WeekStart, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const atMidnight = (y: number, m: number, d: number) =>
  new Date(y, m, d, 0, 0, 0, 0).getTime();

const stamp = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};

const range = (start: number, end: number) => {
  const a = new Date(start);
  const b = new Date(end - 1);
  return `${a.getDate()} ${SHORT[a.getMonth()]} \u2192 ${b.getDate()} ${SHORT[b.getMonth()]}`;
};

/**
 * The monthly cycle containing `ts`, anchored on `cycleDay`.
 * A cycleDay of 25 puts 8 Sep inside "25 Aug -> 24 Sep", which the prototype
 * names after the month the cycle *ends* in.
 */
const monthlyCycleStart = (ts: number, cycleDay: number) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = d.getMonth();
  // Clamp for short months: a 31st cycle day lands on the 28th/30th.
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const anchor = Math.min(cycleDay, daysInMonth);
  const thisMonthAnchor = atMidnight(y, m, anchor);
  if (ts >= thisMonthAnchor) return thisMonthAnchor;
  const prevDays = new Date(y, m, 0).getDate();
  return atMidnight(y, m - 1, Math.min(cycleDay, prevDays));
};

const addMonths = (startTs: number, n: number, cycleDay: number) => {
  const d = new Date(startTs);
  const y = d.getFullYear();
  const m = d.getMonth() + n;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  return atMidnight(y, m, Math.min(cycleDay, daysInMonth));
};

const weeklyCycleStart = (ts: number, weekStart: WeekStart) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const target = WEEK_INDEX[weekStart];
  const delta = (d.getDay() - target + 7) % 7;
  return d.getTime() - delta * DAY_MS;
};

const dailyCycleStart = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const buildCycle = (
  start: number,
  end: number,
  name: string,
  now: number,
): Cycle => {
  const length = Math.max(Math.round((end - start) / DAY_MS), 1);
  const elapsed = Math.min(Math.max(daysBetween(start, now), 0), length);
  const daysLeft = now >= end ? 0 : Math.max(length - elapsed, 0);
  return {
    key: stamp(start),
    name,
    label: range(start, end),
    start,
    end,
    daysLeft,
    elapsed,
    length,
  };
};

/**
 * Builds the cycle strip the month chevrons page through: `back` closed cycles,
 * then the live one. The live cycle is always the last entry.
 */
export function buildCycles(
  cadence: Cadence,
  cycleDay: number,
  weekStart: WeekStart,
  now = Date.now(),
  back = 3,
): Cycle[] {
  const out: Cycle[] = [];

  if (cadence === 'Monthly') {
    const currentStart = monthlyCycleStart(now, cycleDay);
    for (let i = back; i >= 0; i--) {
      const start = addMonths(currentStart, -i, cycleDay);
      const end = addMonths(currentStart, -i + 1, cycleDay);
      // Named for the month the cycle closes in, as the prototype does.
      const name = MONTH_LONG[new Date(end - 1).getMonth()];
      out.push(buildCycle(start, end, name, now));
    }
    return out;
  }

  if (cadence === 'Weekly') {
    const currentStart = weeklyCycleStart(now, weekStart);
    for (let i = back; i >= 0; i--) {
      const start = currentStart - i * 7 * DAY_MS;
      const end = start + 7 * DAY_MS;
      const d = new Date(start);
      const name = `Week of ${d.getDate()} ${SHORT[d.getMonth()]}`;
      out.push(buildCycle(start, end, name, now));
    }
    return out;
  }

  const currentStart = dailyCycleStart(now);
  for (let i = back; i >= 0; i--) {
    const start = currentStart - i * DAY_MS;
    const end = start + DAY_MS;
    const d = new Date(start);
    const name = i === 0 ? 'Today' : `${d.getDate()} ${SHORT[d.getMonth()]}`;
    out.push(buildCycle(start, end, name, now));
  }
  return out;
}

export const cadenceNote = (cadence: Cadence) =>
  cadence === 'Daily'
    ? 'A fresh allowance every morning at midnight.'
    : cadence === 'Weekly'
      ? 'Resets every week on the day you pick.'
      : 'Resets on the same date each month \u2014 pick it below.';

export const cycleDayLabel = (day: number) =>
  `${day}${ordinal(day)} of each month`;
