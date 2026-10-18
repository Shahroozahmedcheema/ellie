import { Platform } from 'react-native';

/**
 * Design tokens lifted verbatim from `Ellie Prototype.dc.html`.
 * Web CSS values (gradients, shadows, blurs) are translated into the nearest
 * React Native equivalent while keeping the exact source colours.
 */

export type CategoryKey =
  | 'Food'
  | 'Transport'
  | 'Home'
  | 'Fun'
  | 'Health'
  | 'Shopping'
  | 'Bills'
  | 'Other';

export const CATEGORIES: CategoryKey[] = [
  'Food',
  'Transport',
  'Home',
  'Fun',
  'Health',
  'Shopping',
  'Bills',
  'Other',
];

/** Bright category hues — light theme. */
export const HUE: Record<CategoryKey, string> = {
  Food: '#FF9E7D',
  Transport: '#7FB8FF',
  Home: '#B9A7FF',
  Fun: '#FFC95B',
  Health: '#5FD3AA',
  Shopping: '#FF8FB1',
  Bills: '#8FA0C4',
  Other: '#B5AFA6',
};

/** Dimmed category hues — dark theme. */
export const DIM: Record<CategoryKey, string> = {
  Food: '#F0A288',
  Transport: '#8AB4E8',
  Home: '#B3A8E6',
  Fun: '#EDC272',
  Health: '#6BC79E',
  Shopping: '#EC96AF',
  Bills: '#93A0BC',
  Other: '#ADA8A0',
};

/**
 * Accent identities. The prototype shipped one (coral); the rest follow the
 * same recipe — a saturated mid-tone for light, lifted a step for dark so it
 * still reads against the warm near-black ground.
 */
export type AccentKey = 'coral' | 'pink' | 'blue' | 'violet';

export const ACCENTS: Record<
  AccentKey,
  { name: string; light: string; dark: string }
> = {
  coral: { name: 'Coral', light: '#F0503C', dark: '#FF6B54' },
  pink: { name: 'Pink', light: '#E1467E', dark: '#FF6FA5' },
  blue: { name: 'Blue', light: '#2E74E0', dark: '#5C9DFF' },
  violet: { name: 'Violet', light: '#6E4FE0', dark: '#9B86FF' },
};

export const ACCENT_KEYS = Object.keys(ACCENTS) as AccentKey[];

export type Palette = {
  key: 'light' | 'dark';
  dark: boolean;
  /** Which accent produced `coral`. */
  accent: AccentKey;
  ground: string;
  ink: string;
  sub: string;
  lbl: string;
  inert: string;
  coral: string;
  sage: string;
  sageInk: string;
  sageBg: string;
  ochre: string;
  ochreBg: string;
  hue: Record<CategoryKey, string>;
  /** Alpha suffix appended to a hue for the muted tile fill. */
  tint: string;
  hatch: string;
  track: string;
  hair: string;
  /** Flattened stand-ins for the CSS `linear-gradient(160deg, ...)` glass. */
  glass: string;
  glassUp: string;
  sheet: string;
  /**
   * Fully opaque surfaces, for devices that cannot blur. A translucent fill
   * over an unblurred backdrop reads as a smudge; a solid one reads as paper.
   */
  solid: string;
  solidUp: string;
  /** Gradient stop pairs, used where a real gradient is worth the extra view. */
  glassStops: [string, string];
  glassUpStops: [string, string];
  sheetStops: [string, string];
  lipColor: string;
  lipWidth: number;
  innerTop: string;
  innerBottom: string;
  shadow: Shadow;
  lift: Shadow;
  scrim: string;
  faint: string;
  soft: string;
  blobs: { color: string; x: number; y: number; r: number }[];
  blobOpacity: number;
  blobBlur: number;
  pageBg: string;
  toastBg: string;
  toastInk: string;
  /** Opacity applied to mascot art so it settles into the dark ground. */
  mascotOpacity: number;
};

export type Shadow = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

const LIGHT_BLOBS = [
  { color: '#FFD8C2', x: 0.14, y: 0.09, r: 0.17 },
  { color: '#DCD3FF', x: 0.84, y: 0.06, r: 0.15 },
  { color: '#C9F0E0', x: 0.78, y: 0.4, r: 0.16 },
  { color: '#C7E4FF', x: 0.09, y: 0.6, r: 0.17 },
  { color: '#FFF0C2', x: 0.56, y: 0.88, r: 0.18 },
];

const DARK_BLOBS = [
  { color: '#FFC8A8', x: 0.14, y: 0.09, r: 0.17 },
  { color: '#C9BCFF', x: 0.84, y: 0.06, r: 0.15 },
  { color: '#A9E8CE', x: 0.78, y: 0.4, r: 0.16 },
  { color: '#A6D2FF', x: 0.09, y: 0.6, r: 0.17 },
  { color: '#FFE79A', x: 0.56, y: 0.88, r: 0.18 },
];

export const LIGHT: Palette = {
  key: 'light',
  dark: false,
  accent: 'coral',
  ground: '#F7F5F2',
  ink: '#1C1B1A',
  sub: '#6B6862',
  lbl: '#A8A49D',
  inert: '#C4C0B9',
  coral: '#F0503C',
  sage: '#5BB98C',
  sageInk: '#3E7F5E',
  sageBg: 'rgba(91,185,140,0.16)',
  ochre: '#C9743F',
  ochreBg: 'rgba(201,116,63,0.13)',
  hue: HUE,
  tint: '2E',
  hatch: 'rgba(28,27,26,0.12)',
  track: 'rgba(28,27,26,0.08)',
  hair: 'rgba(28,27,26,0.08)',
  glass: 'rgba(255,255,255,0.60)',
  glassUp: 'rgba(255,255,255,0.75)',
  sheet: 'rgba(255,255,255,0.84)',
  solid: '#FCFBF9',
  solidUp: '#FFFFFF',
  glassStops: ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.46)'],
  glassUpStops: ['rgba(255,255,255,0.86)', 'rgba(255,255,255,0.62)'],
  sheetStops: ['rgba(255,255,255,0.94)', 'rgba(255,255,255,0.78)'],
  lipColor: 'rgba(255,255,255,0.55)',
  lipWidth: 1.5,
  innerTop: 'rgba(255,255,255,0.92)',
  innerBottom: 'rgba(255,255,255,0.26)',
  shadow: {
    shadowColor: '#1F1B16',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#1F1B16',
    shadowOpacity: 0.14,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  scrim: 'rgba(247,245,242,0.55)',
  faint: 'rgba(255,255,255,0.6)',
  soft: 'rgba(28,27,26,0.06)',
  blobs: LIGHT_BLOBS,
  blobOpacity: 0.4,
  blobBlur: 46,
  pageBg: '#EFECE7',
  toastBg: '#1C1B1A',
  toastInk: '#ffffff',
  mascotOpacity: 1,
};

export const DARK: Palette = {
  key: 'dark',
  dark: true,
  accent: 'coral',
  ground: '#1A1613',
  ink: '#F5F2ED',
  sub: '#A9A39A',
  lbl: '#6E6862',
  inert: '#4A4540',
  coral: '#FF6B54',
  sage: '#6ECFA0',
  sageInk: '#6ECFA0',
  sageBg: 'rgba(110,207,160,0.14)',
  ochre: '#D98A4F',
  ochreBg: 'rgba(217,138,79,0.16)',
  hue: DIM,
  tint: '33',
  hatch: 'rgba(255,255,255,0.10)',
  track: 'rgba(255,255,255,0.08)',
  hair: 'rgba(255,255,255,0.09)',
  glass: 'rgba(255,255,255,0.05)',
  glassUp: 'rgba(255,255,255,0.07)',
  sheet: 'rgba(255,255,255,0.08)',
  solid: '#221D1A',
  solidUp: '#2A2421',
  glassStops: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.035)'],
  glassUpStops: ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.05)'],
  sheetStops: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.055)'],
  lipColor: 'rgba(255,255,255,0.14)',
  lipWidth: 1,
  innerTop: 'rgba(255,255,255,0.16)',
  innerBottom: 'rgba(255,255,255,0.05)',
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#000000',
    shadowOpacity: 0.48,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  scrim: 'rgba(26,22,19,0.62)',
  faint: 'rgba(255,255,255,0.05)',
  soft: 'rgba(255,255,255,0.06)',
  blobs: DARK_BLOBS,
  blobOpacity: 0.17,
  blobBlur: 52,
  pageBg: '#EFECE7',
  toastBg: '#F5F2ED',
  toastInk: '#1A1613',
  mascotOpacity: 0.92,
};

export const PALETTES = { light: LIGHT, dark: DARK } as const;

const paletteCache = new Map<string, Palette>();

/**
 * The palette for a theme/accent pair. Only the accent colour changes between
 * variants, so the base palettes stay the single source for everything else.
 */
export function paletteFor(
  theme: 'light' | 'dark',
  accent: AccentKey = 'coral',
): Palette {
  const key = `${theme}:${accent}`;
  const hit = paletteCache.get(key);
  if (hit) return hit;
  const base = PALETTES[theme];
  const made: Palette = {
    ...base,
    ...androidSurfaces(base),
    accent,
    coral: ACCENTS[accent][theme],
  };
  paletteCache.set(key, made);
  return made;
}

/**
 * Android draws every frosted surface as an opaque one, with no lip.
 *
 * The glass look is a translucent fill under a translucent white border. A
 * background extends beneath its own border, so on Android those two composite
 * in the border ring and paint a brighter outline inset around the element —
 * which reads as a second box inside the first. It showed up everywhere the
 * pairing was used: cards, sheets, keypad keys, buttons.
 *
 * Rather than patch each of those, the tokens themselves go opaque here, so a
 * surface is a single flat fill that Android rounds correctly and cannot
 * composite against anything. iOS and web keep the real thing.
 */
function androidSurfaces(base: Palette): Partial<Palette> {
  if (Platform.OS !== 'android') return {};
  return {
    glass: base.solid,
    glassUp: base.solidUp,
    sheet: base.solidUp,
    faint: base.solid,
    lipColor: 'transparent',
    lipWidth: 0,
  };
}

/** cubic-bezier(.22,1,.36,1) — the prototype's single easing curve. */
export const EASE = { x1: 0.22, y1: 1, x2: 0.36, y2: 1 } as const;

export const RADIUS = {
  card: 24,
  tile: 16,
  sheet: 32,
  button: 18,
  pill: 999,
} as const;
