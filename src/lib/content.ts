import type { CategoryKey } from '@/theme/tokens';
import type { IconName } from './icons';

/**
 * Setup steps, in order. The prototype's final `paywall` step is deliberately
 * absent: Ellie ships without one.
 */
export const ONB_STEPS = [
  'welcome',
  'name',
  'age',
  'quiz',
  'analyzing',
  'standing',
  'standing2',
  'habit',
  'currency',
  'cadence',
  'income',
  'categories',
  'target',
  'notify',
  'nudgeLevel',
  'theme',
  'contract',
] as const;

export type OnbStep = (typeof ONB_STEPS)[number];

export const ONB_CTA: Partial<Record<OnbStep, string>> = {
  welcome: "Let's go 👋",
  habit: 'Start tracking 📊',
  notify: 'Turn nudges on 🔔',
  theme: 'Looks right ✨',
};

export const QUIZ: {
  q: string;
  opts: string[];
  hues: CategoryKey[];
}[] = [
  {
    q: 'What are you saving towards? 🎯',
    opts: [
      '🏠 Somewhere to live',
      '🛍 A specific thing',
      '🌿 Room to breathe',
      '🤷 Nothing yet',
    ],
    hues: ['Home', 'Shopping', 'Health', 'Other'],
  },
  {
    q: 'Where does it usually go wrong? 🤔',
    opts: [
      '🛒 Small impulse buys',
      '🌀 I lose track entirely',
      '🧾 Bills catch me out',
      '🐢 Saving never sticks',
    ],
    hues: ['Shopping', 'Transport', 'Bills', 'Fun'],
  },
  {
    q: 'How does checking your money feel? 💭',
    opts: [
      '😰 Anxious',
      '🙈 I avoid it',
      '😐 Fine, mostly',
      '💪 Motivating',
    ],
    hues: ['Fun', 'Bills', 'Health', 'Food'],
  },
];

export const PAIN_LINES = [
  'those small impulse buys',
  'losing track entirely',
  'bills landing unannounced',
  'saving that never sticks',
];

export const FEEL_LINES = ['anxious', 'avoidant', 'fine, mostly', 'motivated'];

export const WANT_LINES = [
  'somewhere to live',
  'something specific',
  'room to breathe',
  'nothing in particular yet',
];

export const ONB_CHECKS = (possessive: string) => [
  `Reading ${possessive} answers 📖`,
  'Shaping your first cycle 🗓',
  'Tuning the categories 🎨',
  'Ready ✅',
];

export const ONB_WEEKS: {
  name: string;
  sub: string;
  hue: CategoryKey;
  w: number;
}[] = [
  {
    name: 'Week one 📝',
    sub: 'Log everything, judge nothing',
    hue: 'Transport',
    w: 26,
  },
  {
    name: 'Week two 🔍',
    sub: 'Spot the two you could drop',
    hue: 'Food',
    w: 52,
  },
  {
    name: 'Week three 💡',
    sub: 'Decide with real numbers',
    hue: 'Health',
    w: 78,
  },
  {
    name: 'Week four 🎯',
    sub: 'Keep more without trying harder',
    hue: 'Fun',
    w: 100,
  },
];

export const ONB_HABIT_STATS = [
  { num: '23%', label: 'kept on average' },
  { num: '4 min', label: 'a day is enough' },
  { num: '30 days', label: 'to make it stick' },
];

export const ONB_PROMISES: { text: string; hue: CategoryKey }[] = [
  { text: '📝 I log what I spend, even on the bad days', hue: 'Food' },
  {
    text: '🍩 I look at the ring once a day, not ten times',
    hue: 'Transport',
  },
  { text: '🧮 I set budgets I could actually live inside', hue: 'Home' },
  { text: '🌱 I let a goal take its time', hue: 'Health' },
  { text: '🕊 I do not use money to tell myself off', hue: 'Fun' },
];

export const ONB_NUDGES: {
  key: 'daily' | 'digest' | 'overspend';
  name: string;
  note: string;
}[] = [
  {
    key: 'daily',
    name: 'A quiet daily check-in 🌤',
    note: 'One line, morning, no numbers shouted',
  },
  {
    key: 'digest',
    name: 'Sunday digest 📬',
    note: 'What moved over the week',
  },
  {
    key: 'overspend',
    name: 'Only when a cap tips over 🧾',
    note: 'Stated as a fact, never a scold',
  },
];

export const SETTINGS_NUDGES: {
  key: 'daily' | 'digest' | 'overspend';
  name: string;
  note: string;
}[] = [
  { key: 'daily', name: 'Daily check-in', note: 'One line at 9pm, never a nag' },
  { key: 'digest', name: 'Weekly digest', note: 'Sunday morning, what moved' },
  {
    key: 'overspend',
    name: 'Budget warnings',
    note: 'Only when a category tips over',
  },
];

export const ONB_CURRENCIES = [
  'PKR',
  'USD',
  'GBP',
  'EUR',
  'INR',
  'AED',
  'JPY',
  'CAD',
];
export const SETTINGS_CURRENCIES = ['PKR', 'USD', 'GBP', 'AED'];

export const KEEP_TARGETS: (number | 'Custom')[] = [
  3000, 6000, 10000, 15000, 20000, 'Custom',
];

export const GOAL_IDEAS = ['Umrah', 'New laptop', 'Eid gifts', 'Rainy day'];

/** Which on-screen element a coach mark points at. */
export type TourTargetKey =
  | 'ring'
  | 'fab'
  | 'tabActivity'
  | 'tabPlan'
  | 'tabSettings';

/**
 * Coach marks, shown once setup finishes. Each one names the element it
 * highlights; the spotlight is drawn around that element's measured position,
 * so nothing is duplicated or drawn at a guessed coordinate.
 */
export const TOUR: {
  title: string;
  body: string;
  hue: CategoryKey;
  target: TourTargetKey;
  /**
   * Where on the target to centre the highlight. `top` is used for the ring's
   * untouched arc, which lives on the upper edge of the donut.
   */
  anchor?: 'center' | 'top';
  /** Extra breathing room around the measured element, in points. */
  pad?: number;
}[] = [
  {
    title: 'This ring is your cycle 🍩',
    body: 'One segment per category, sized by what you spent. Tap any segment and it tells you its share.',
    hue: 'Food',
    target: 'ring',
    pad: 4,
  },
  {
    title: 'The hatched arc is untouched 📐',
    body: 'Diagonal stripes mean not spent yet. When the stripes run out, so has the cycle.',
    hue: 'Home',
    target: 'ring',
    anchor: 'top',
    pad: 4,
  },
  {
    title: 'Log it three ways ➕',
    body: 'Tap the plus. Type it, say it out loud, or photograph the receipt.',
    hue: 'Health',
    target: 'fab',
    pad: 8,
  },
  {
    title: 'Activity holds every line 📊',
    body: 'Filter by category, tap a row to edit the amount, swipe nothing — it is all taps.',
    hue: 'Transport',
    target: 'tabActivity',
    pad: 10,
  },
  {
    title: 'Plan is budgets and goals 🎯',
    body: 'Caps per category on one side, something you are saving for on the other. Goal money leaves your balance.',
    hue: 'Fun',
    target: 'tabPlan',
    pad: 10,
  },
  {
    title: 'Everything you just set ⚙️',
    body: 'Currency, cycle, income, nudges and appearance all live in Settings if you change your mind.',
    hue: 'Shopping',
    target: 'tabSettings',
    pad: 10,
  },
];

export const DATE_CHIPS = ['Today', 'Yesterday', 'Earlier this week'] as const;
export type DateChip = (typeof DATE_CHIPS)[number];

export const ADD_STEP_QUESTIONS = [
  'What did you spend on?',
  'How much was it?',
  'When was it?',
];

export const ADD_STEP_HINTS = [
  'A shop, a person, a bill — whatever you will recognise later.',
  'Round numbers are fine.',
];

export const MASCOT = {
  logo: require('../../assets/mascot/logo.png'),
  peeking: require('../../assets/mascot/peeking.png'),
  cheering: require('../../assets/mascot/cheering.png'),
  wave: require('../../assets/mascot/wave.png'),
  thinking: require('../../assets/mascot/thinking.png'),
  worried: require('../../assets/mascot/worried.png'),
  sitting: require('../../assets/mascot/sitting.png'),
  asleep: require('../../assets/mascot/asleep.png'),
  curious: require('../../assets/mascot/curious.png'),
  coin: require('../../assets/mascot/coin.png'),
  coinFront: require('../../assets/mascot/coin-front.png'),
};
