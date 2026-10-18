import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Pattern,
  Rect,
} from 'react-native-svg';

import { CIRCUMFERENCE, RING, type RestArc, type Segment } from '@/store/derive';
import { useTheme } from '@/theme/ThemeContext';
import type { CategoryKey } from '@/theme/tokens';
import { font, shadowOf } from './ui';

/**
 * Tweens a number and reports it as plain React state.
 *
 * `react-native-svg` attributes take numbers and strings, not Animated nodes —
 * handing an interpolation straight to `strokeDasharray` throws once the
 * renderer tries to write it to the element. Driving the value through a
 * listener keeps the prototype's motion while every prop stays a plain number.
 */
function useTween(to: number, duration: number) {
  const value = useRef(new Animated.Value(to)).current;
  const [frame, setFrame] = useState(to);

  useEffect(() => {
    const id = value.addListener(({ value: v }) => setFrame(v));
    const anim = Animated.timing(value, {
      toValue: to,
      duration,
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      value.removeListener(id);
    };
  }, [to, duration, value]);

  return frame;
}

/**
 * Each arc animates its dash length so the ring re-slices smoothly whenever a
 * transaction lands, matching the prototype's 0.37s dasharray transition.
 */
function Arc({
  dash,
  rotate,
  color,
  opacity,
  onPress,
}: {
  dash: [number, number];
  rotate: number;
  color: string;
  opacity: number;
  onPress?: () => void;
}) {
  const len = useTween(dash[0], 370);
  const fade = useTween(opacity, 190);

  // `onPress` on an SVG node makes react-native-svg attach React Native's
  // responder props, which react-native-web then hands to the DOM as unknown
  // event handlers. Native gets the real press prop; web gets a plain click.
  const press =
    Platform.OS === 'web'
      ? ({ onClick: onPress } as unknown as { onPress?: () => void })
      : { onPress };

  return (
    <Circle
      cx={RING.cx}
      cy={RING.cx}
      r={RING.r}
      fill="none"
      stroke={color}
      strokeWidth={RING.stroke}
      strokeLinecap="round"
      strokeDasharray={`${len} ${Math.max(CIRCUMFERENCE - len, 0)}`}
      opacity={fade}
      transform={`rotate(${rotate} ${RING.cx} ${RING.cx})`}
      {...press}
    />
  );
}

export function Donut({
  segments,
  rest,
  selected,
  onSelect,
  children,
  sharePct,
}: {
  segments: Segment[];
  rest: RestArc | null;
  selected: CategoryKey | null;
  onSelect: (cat: CategoryKey | null) => void;
  /** Rendered in the hole. */
  children: React.ReactNode;
  sharePct: number | null;
}) {
  const { t } = useTheme();
  const [pillW, setPillW] = useState(40);

  const active = selected ? segments.find((s) => s.cat === selected) : null;
  const R = RING.r + RING.stroke / 2 + 17;
  const pillX = active ? RING.cx + Math.cos(active.mid) * R : 0;
  const pillY = active ? RING.cx + Math.sin(active.mid) * R : 0;

  return (
    <View style={{ width: RING.size, height: RING.size, alignSelf: 'center' }}>
      <Svg width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`}>
        <Defs>
          <Pattern
            id="hatch"
            width={4.24}
            height={4.24}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect width={1.4} height={4.24} fill={t.hatch} />
          </Pattern>
        </Defs>
        <G>
          {rest ? (
            <Arc
              dash={rest.dash}
              rotate={rest.rotate}
              color="url(#hatch)"
              opacity={selected ? 0.5 : 1}
              onPress={() => onSelect(null)}
            />
          ) : null}
          {segments.map((s) => (
            <Arc
              key={s.cat}
              dash={s.dash}
              rotate={s.rotate}
              color={s.color}
              opacity={selected && selected !== s.cat ? 0.3 : 1}
              onPress={() => onSelect(selected === s.cat ? null : s.cat)}
            />
          ))}
        </G>
      </Svg>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: 40,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        {children}
      </View>

      {active && sharePct !== null ? (
        <View
          pointerEvents="none"
          // Centred on its own measured width, as translate(-50%,-50%) does in
          // the prototype — a fixed offset drifts as the label grows.
          onLayout={(e) => setPillW(e.nativeEvent.layout.width)}
          style={{
            position: 'absolute',
            left: pillX,
            top: pillY,
            transform: [{ translateX: -pillW / 2 }, { translateY: -13 }],
            height: 26,
            paddingHorizontal: 11,
            borderRadius: 999,
            backgroundColor: t.ink,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            ...shadowOf(t),
          }}
        >
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: 12,
              color: t.ground,
            }}
          >
            {sharePct}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** The small ring used on each budget row. */
export function MiniRing({
  pct,
  color,
  size = 44,
  stroke = 4,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const { t } = useTheme();
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const target = (c * Math.min(Math.max(pct, 0), 100)) / 100;
  const len = useTween(target, 340);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.track}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len} ${Math.max(c - len, 0)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{ fontFamily: font.semibold, fontSize: 11.5, color }}
        >
          {pct}%
        </Text>
      </View>
    </View>
  );
}
