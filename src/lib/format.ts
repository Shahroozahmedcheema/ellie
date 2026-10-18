/** Currency symbols for every code the setup flow and settings offer. */
export const CURRENCY_SYMBOL: Record<string, string> = {
  PKR: '\u20A8',
  USD: '$',
  GBP: '\u00A3',
  EUR: '\u20AC',
  INR: '\u20B9',
  AED: '\u062F.\u0625',
  JPY: '\u00A5',
  CAD: '$',
};

export const symbolFor = (code: string) => CURRENCY_SYMBOL[code] ?? code;

/** `money(11200)` -> `"11,200"`, matching the prototype's toLocaleString('en-US'). */
export const money = (n: number) =>
  Math.round(Number.isFinite(n) ? n : 0).toLocaleString('en-US');

export const ordinal = (d: number) => {
  if (d % 10 === 1 && d !== 11) return 'st';
  if (d % 10 === 2 && d !== 12) return 'nd';
  if (d % 10 === 3 && d !== 13) return 'rd';
  return 'th';
};

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_SHORT = [
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

export const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const DAY_MS = 86400000;

/** Days between two instants, counted by calendar day rather than elapsed hours. */
export const daysBetween = (a: number, b: number) =>
  Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);

export const shortDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
};

const clockLabel = (ts: number) => {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const suffix = h < 12 ? 'am' : 'pm';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
};

/**
 * The day bucket a transaction belongs to — this is what the Activity list
 * groups by, mirroring the prototype's `when.split(' \u00B7 ')[0]`.
 */
export const dayLabel = (ts: number, now = Date.now()) => {
  const diff = daysBetween(ts, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return DAY_NAMES[new Date(ts).getDay()];
  if (diff >= 7 && diff < 14) return `Last ${DAY_NAMES[new Date(ts).getDay()]}`;
  return shortDate(ts);
};

/** The full "when" line shown on a row: today's entries also carry a time. */
export const whenLabel = (ts: number, now = Date.now()) => {
  const day = dayLabel(ts, now);
  return day === 'Today' ? `Today \u00B7 ${clockLabel(ts)}` : day;
};
