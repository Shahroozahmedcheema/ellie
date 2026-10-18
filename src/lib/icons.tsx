import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Every glyph in the prototype is a stroked 24x24 outline. Rather than ship a
 * font, each icon is stored as the same primitive list the source SVG used.
 */
type Prim =
  | { t: 'p'; d: string }
  | { t: 'c'; cx: number; cy: number; r: number }
  | { t: 'r'; x: number; y: number; w: number; h: number; rx?: number };

const p = (d: string): Prim => ({ t: 'p', d });
const c = (cx: number, cy: number, r: number): Prim => ({ t: 'c', cx, cy, r });
const r = (x: number, y: number, w: number, h: number, rx?: number): Prim => ({
  t: 'r',
  x,
  y,
  w,
  h,
  rx,
});

export const ICONS = {
  Food: [p('M3.5 10.5 h17 a8.5 8.5 0 0 1-17 0 Z'), p('M9 7 V4.5'), p('M13 7 V3.5')],
  Transport: [
    p('M3.5 15.5 v-3 l2-4.5 h13 l2 4.5 v3 Z'),
    c(7.5, 17.5, 1.5),
    c(16.5, 17.5, 1.5),
  ],
  Home: [p('M4 9.8 L12 3.8 L20 9.8 V20 H4 Z')],
  Fun: [c(12, 12, 8.5), p('M10.2 8.6 L16 12 L10.2 15.4 Z')],
  Health: [
    p(
      'M12 20 C12 20 3.8 14.8 3.8 9.4 A4.4 4.4 0 0 1 12 7.2 A4.4 4.4 0 0 1 20.2 9.4 C20.2 14.8 12 20 12 20 Z',
    ),
  ],
  Shopping: [p('M5 8 h14 l-1.2 12.5 H6.2 Z'), p('M9 8 V6.2 a3 3 0 0 1 6 0 V8')],
  Bills: [
    p('M6 3.5 h12 v17 l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3 Z'),
    p('M9 8.5 h6'),
    p('M9 12.5 h6'),
  ],
  Other: [c(12, 12, 8.5), p('M12 8.4 V15.6'), p('M8.4 12 H15.6')],

  sun: [
    c(12, 12, 3.6),
    p('M12 2.8 v2.4'),
    p('M12 18.8 v2.4'),
    p('M21.2 12 h-2.4'),
    p('M5.2 12 H2.8'),
    p('M18.5 5.5 l-1.7 1.7'),
    p('M7.2 16.8 l-1.7 1.7'),
    p('M18.5 18.5 l-1.7-1.7'),
    p('M7.2 7.2 L5.5 5.5'),
  ],
  moon: [p('M20 14.2 A8.6 8.6 0 0 1 9.8 4 A8.8 8.8 0 1 0 20 14.2 Z')],

  back: [p('M20 12 H4.8'), p('M11.4 5 L4.2 12 L11.4 19')],
  plus: [p('M12 5.4 V18.6'), p('M5.4 12 H18.6')],
  trash: [
    p('M4.6 7.4 h14.8'),
    p('M9.6 7.4 V5.6 h4.8 V7.4'),
    p('M6.6 7.4 L7.6 19.4 h8.8 L17.4 7.4'),
  ],
  pencil: [p('M15.6 4.8 l3.6 3.6 L9 18.6 H5.4 v-3.6 Z')],
  check: [p('M5.2 12.6 L10 17.2 L18.8 7.4')],
  clock: [c(12, 12, 8), p('M12 7.6 V12 l3.2 2')],
  info: [c(12, 12, 8.4), p('M12 11 v5.2'), p('M12 7.9 v.1')],

  mic: [r(9, 3, 6, 11, 3), p('M5.5 11.5 a6.5 6.5 0 0 0 13 0'), p('M12 18 v3')],
  micSmall: [
    r(9, 3.4, 6, 10, 3),
    p('M5.6 11.4 a6.4 6.4 0 0 0 12.8 0'),
    p('M12 17.8 V20.6'),
  ],
  keyboard: [
    r(4, 4, 16, 16, 3),
    p('M8.4 9.2 h.01'),
    p('M12 9.2 h.01'),
    p('M15.6 9.2 h.01'),
    p('M8.4 14.6 h7.2'),
  ],
  camera: [
    p(
      'M3.6 8.4 a2 2 0 0 1 2-2 h1.6 l1.2-2 h6.8 l1.2 2 h1.6 a2 2 0 0 1 2 2 v8.6 a2 2 0 0 1-2 2 H5.6 a2 2 0 0 1-2-2 Z',
    ),
    c(12, 12.4, 3.2),
  ],

  target: [c(12, 12, 7.6), c(12, 12, 2.4)],
  ring: [c(12, 12, 7.6)],
  history: [
    p('M4.6 12 a7.4 7.4 0 1 0 2.3-5.3'),
    p('M4.4 4.6 V9.2 H9'),
    p('M12 8.4 V12 l2.8 1.7'),
  ],
  voiceFeature: [
    p(
      'M12 4.5 a2.6 2.6 0 0 1 2.6 2.6 v4.4 a2.6 2.6 0 0 1-5.2 0 V7.1 A2.6 2.6 0 0 1 12 4.5 Z',
    ),
    p('M6.6 11.4 a5.4 5.4 0 0 0 10.8 0'),
    p('M12 16.8 V19.5'),
  ],
  hatch: [p('M4 16 L16 4'), p('M9 19 L19 9')],
  bars: [p('M4.5 19 V11'), p('M12 19 V5.5'), p('M19.5 19 v-4.6')],
  gear: [
    c(12, 12, 2.8),
    p('M12 3 v2.2'),
    p('M12 18.8 V21'),
    p('M21 12 h-2.2'),
    p('M5.2 12 H3'),
  ],

  tabHome: [p('M3.2 8.8 L10 3.4 L16.8 8.8 V16.4 H3.2 Z')],
  tabActivity: [p('M4.2 15.4 V9.6'), p('M10 15.4 V4.8'), p('M15.8 15.4 V11.8')],
  tabPlan: [c(10, 10, 6.6), c(10, 10, 2.1)],
  tabSettings: [
    c(10, 10, 2.6),
    p('M10 2.6 v1.9'),
    p('M10 15.5 v1.9'),
    p('M17.4 10 h-1.9'),
    p('M4.5 10 H2.6'),
    p('M15.2 4.8 l-1.35 1.35'),
    p('M6.15 13.85 L4.8 15.2'),
    p('M15.2 15.2 l-1.35-1.35'),
    p('M6.15 6.15 L4.8 4.8'),
  ],

  fingerprint: [
    p('M4.2 22.5 C4.2 11.6 12.6 3.2 23 3.2 C33.4 3.2 41.8 11.6 41.8 22.5'),
    p(
      'M8.6 34.5 C7.2 30.7 8.4 26.6 8.4 22.5 C8.4 14 15 7.4 23 7.4 C31 7.4 37.6 14 37.6 22.5 C37.6 27.2 37.2 31.8 36.2 36.2',
    ),
    p(
      'M12.8 42.6 C11.4 39.4 12.6 34.6 12.6 22.5 C12.6 16.3 17.3 11.6 23 11.6 C28.7 11.6 33.4 16.3 33.4 22.5 C33.4 30 33 37 31.6 43.4',
    ),
    p(
      'M17.9 47.6 C16.6 43.2 16.8 33 16.8 22.5 C16.8 18.6 19.6 15.8 23 15.8 C26.4 15.8 29.2 18.6 29.2 22.5 C29.2 32 28.6 40.4 26.8 47.2',
    ),
    p(
      'M21.1 44.6 C21 39.4 21 30.4 21 22.5 C21 21 21.8 20 23 20 C24.2 20 25 21 25 22.5 C25 31 24.8 37.4 23.9 43.4',
    ),
  ],
} satisfies Record<string, Prim[]>;

export type IconName = keyof typeof ICONS;

/** Names whose paths were authored against a viewBox other than 24x24. */
const VIEWBOX: Partial<Record<IconName, string>> = {
  tabHome: '0 0 20 20',
  tabActivity: '0 0 20 20',
  tabPlan: '0 0 20 20',
  tabSettings: '0 0 20 20',
  fingerprint: '0 0 46 52',
};

export type IconProps = {
  name: IconName;
  size?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
};

export function Icon({
  name,
  size = 18,
  height,
  color = 'currentColor',
  strokeWidth = 1.7,
  fill = 'none',
}: IconProps) {
  const prims = ICONS[name] as Prim[];
  return (
    <Svg
      width={size}
      height={height ?? size}
      viewBox={VIEWBOX[name] ?? '0 0 24 24'}
      fill={fill}
    >
      {prims.map((prim, i) => {
        // `key` is passed directly, never spread — React 19 rejects a key that
        // arrives inside a spread object.
        const common = {
          stroke: color,
          strokeWidth,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          fill: 'none' as const,
        };
        if (prim.t === 'p') return <Path key={i} {...common} d={prim.d} />;
        if (prim.t === 'c')
          return (
            <Circle key={i} {...common} cx={prim.cx} cy={prim.cy} r={prim.r} />
          );
        return (
          <Rect
            key={i}
            {...common}
            x={prim.x}
            y={prim.y}
            width={prim.w}
            height={prim.h}
            rx={prim.rx}
          />
        );
      })}
    </Svg>
  );
}
