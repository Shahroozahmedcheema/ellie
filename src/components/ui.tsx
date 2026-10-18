import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/lib/icons';
import { money as fmtMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeContext';
import type { CategoryKey, Palette } from '@/theme/tokens';

// ── press feedback ──────────────────────────────────────────────────────
// The prototype scales elements on `style-active`. This reproduces that with
// a spring so taps feel the same on a device.

export type PressProps = PressableProps & {
  /** Scale applied while held. Matches the prototype's per-element values. */
  scale?: number;
  haptic?: false | 'light' | 'medium' | 'selection';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Style keys that describe an element's place in its parent rather than its
 * own appearance. These belong on the outer touchable.
 */
const LAYOUT_KEYS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
  'zIndex',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
]);

/** Splits a flattened style into [outer layout, inner appearance]. */
function splitLayout(flat: Record<string, unknown>) {
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  Object.keys(flat).forEach((k) => {
    (LAYOUT_KEYS.has(k) ? outer : inner)[k] = flat[k];
  });
  return [outer, inner] as [ViewStyle, ViewStyle];
}

export function Press({
  scale = 0.96,
  haptic = 'light',
  style,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: PressProps) {
  const v = useRef(new Animated.Value(1)).current;

  const to = useCallback(
    (value: number) => {
      Animated.spring(v, {
        toValue: value,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }).start();
    },
    [v],
  );

  // The press animation lives on an inner view, so anything describing how the
  // element sits in its parent has to ride on the Pressable itself — otherwise
  // `flex: 1`, `alignSelf` or absolute offsets are applied to a child that has
  // already been sized to its content, and the button collapses.
  const [outer, inner] = splitLayout(
    (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>,
  );

  return (
    <Pressable
      {...rest}
      style={outer}
      onPressIn={(e) => {
        to(scale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && Platform.OS !== 'web') {
          const style =
            haptic === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light;
          if (haptic === 'selection') Haptics.selectionAsync().catch(() => {});
          else Haptics.impactAsync(style).catch(() => {});
        }
        onPress?.(e);
      }}
    >
      <Animated.View style={[inner, { transform: [{ scale: v }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── surfaces ────────────────────────────────────────────────────────────

export const shadowOf = (t: Palette, lift = false) => {
  const s = lift ? t.lift : t.shadow;
  return {
    shadowColor: s.shadowColor,
    shadowOpacity: s.shadowOpacity,
    shadowRadius: s.shadowRadius,
    shadowOffset: s.shadowOffset,
    elevation: s.elevation,
  };
};

type SurfaceProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Which of the three glass mixes to use. */
  tone?: 'glass' | 'glassUp' | 'sheet';
  radius?: number;
  lift?: boolean;
  /** Drop the highlight lip — used for flush strips. */
  bare?: boolean;
  /**
   * No drop shadow. Several prototype surfaces (the segmented control, the
   * month chip) carry only the inner highlight and sit flat on the page.
   */
  flat?: boolean;
};

/**
 * The prototype's frosted card: a 160deg white gradient, a bright 1px lip and
 * a soft drop shadow. The inner highlight becomes a top hairline overlay.
 */
export function Glass({
  children,
  style,
  tone = 'glass',
  radius = 24,
  lift = false,
  bare = false,
  flat = false,
}: SurfaceProps) {
  const { t } = useTheme();
  const stops =
    tone === 'sheet'
      ? t.sheetStops
      : tone === 'glassUp'
        ? t.glassUpStops
        : t.glassStops;
  const base = tone === 'sheet' ? t.sheet : tone === 'glassUp' ? t.glassUp : t.glass;

  const frame: ViewStyle = {
    borderRadius: radius,
    borderWidth: bare ? 0 : t.lipWidth,
    borderColor: t.lipColor,
    ...(flat ? null : shadowOf(t, lift)),
  };

  // On Android the surface is a single opaque view, with no border.
  //
  // Every version of this artifact came from stacking translucent layers:
  //   - a fill painted as a *child*, which Android will not clip to a rounded
  //     parent, so it showed as a square-cornered plate;
  //   - a `LinearGradient`, whose gradient covers its full rectangular bounds
  //     regardless of `borderRadius`, which merely promoted that plate;
  //   - and a translucent background under a translucent border. Backgrounds
  //     extend beneath the border, so the two composite there and paint a
  //     brighter ring inset around the card — a second box.
  //
  // An opaque background with no border cannot produce any of them: one view,
  // one fill, corners rounded by Android's own background path. Separation
  // comes from the shadow instead of a drawn edge.
  if (Platform.OS === 'android') {
    // `base` is already opaque here and the lip is already zero — see
    // `androidSurfaces` in theme/tokens. A plain view is used rather than a
    // gradient because a `LinearGradient` paints across its full rectangular
    // bounds and ignores `borderRadius` on Android.
    return (
      <View style={[frame, { backgroundColor: base }, style]}>{children}</View>
    );
  }

  return (
    <LinearGradient
      colors={stops}
      start={{ x: 0.18, y: 0 }}
      end={{ x: 0.82, y: 1 }}
      style={[frame, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** The lighter `t.soft` fill used behind chips, toggles and summary rows. */
export function Soft({
  children,
  style,
  radius = 18,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}) {
  const { t } = useTheme();
  return (
    <View style={[{ borderRadius: radius, backgroundColor: t.soft }, style]}>
      {children}
    </View>
  );
}

// ── typography ──────────────────────────────────────────────────────────

type TxtProps = {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export function H1({ children, style }: TxtProps) {
  const { t } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: font.semibold,
          fontSize: 28,
          lineHeight: 34,
          letterSpacing: -0.84,
          color: t.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function H2({ children, style, numberOfLines }: TxtProps) {
  const { t } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: font.semibold,
          fontSize: 20,
          lineHeight: 26,
          color: t.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Small uppercase section label with wide tracking. */
export function Label({ children, style }: TxtProps) {
  const { t } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: font.semibold,
          fontSize: 13,
          letterSpacing: 1.17,
          textTransform: 'uppercase',
          color: t.lbl,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Sub({ children, style, numberOfLines }: TxtProps) {
  const { t } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: font.regular, fontSize: 12.5, color: t.sub },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function RowTitle({ children, style }: TxtProps) {
  const { t } = useTheme();
  return (
    <Text
      style={[
        { fontFamily: font.semibold, fontSize: 15, color: t.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function CardTitle({ children, style }: TxtProps) {
  const { t } = useTheme();
  return (
    <Text
      style={[
        { fontFamily: font.semibold, fontSize: 16, color: t.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTheme();
  return (
    <View style={[{ flex: 1, height: 1, backgroundColor: t.hair }, style]} />
  );
}

// ── money ───────────────────────────────────────────────────────────────

/**
 * An amount with the currency symbol set small and raised, exactly as the
 * prototype does with `font-size:.45em; vertical-align:.58em`.
 */
export function Money({
  value,
  size = 16,
  color,
  weight = font.semibold,
  style,
  formatted,
}: {
  value?: number;
  formatted?: string;
  size?: number;
  color?: string;
  weight?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { t, sym } = useTheme();
  const text = formatted ?? fmtMoney(value ?? 0);
  return (
    <Text
      // An amount is data of unbounded length sitting in a fixed row, so it
      // stays on one line and is allowed to shrink rather than wrapping or
      // pushing its neighbours out. Deliberately no `adjustsFontSizeToFit`:
      // the currency symbol is a nested Text, and Android sizes nested runs
      // unreliably under auto-shrink.
      numberOfLines={1}
      style={[
        {
          fontFamily: weight,
          fontSize: size,
          color: color ?? t.ink,
          letterSpacing: size >= 26 ? -size * 0.03 : 0,
          flexShrink: 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: size * 0.45,
          opacity: 0.45,
          lineHeight: size,
        }}
      >
        {sym}
      </Text>
      {text}
    </Text>
  );
}

/** Inline "₨1,200" for sentences, where the symbol keeps its size. */
export function inlineMoney(sym: string, value: number) {
  return `${sym}${fmtMoney(value)}`;
}

// ── category tile ───────────────────────────────────────────────────────

export function CatTile({
  cat,
  size = 40,
  selected = false,
  iconSize,
  style,
}: {
  cat: CategoryKey;
  size?: number;
  selected?: boolean;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { t, dark } = useTheme();
  const hue = t.hue[cat];
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          // The prototype's tile() is a flat 16px at every size.
          borderRadius: 16,
          backgroundColor: selected ? hue : hue + t.tint,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon
        name={cat}
        size={iconSize ?? Math.round(size * 0.43)}
        color={selected ? '#fff' : hue}
      />
    </View>
  );
}

// ── controls ────────────────────────────────────────────────────────────

export function Chip({
  label,
  active,
  onPress,
  style,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  return (
    <Press
      scale={0.91}
      haptic="selection"
      onPress={onPress}
      style={[
        {
          height: 34,
          paddingHorizontal: 13,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? t.ink : t.soft,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 12.5,
          color: active ? t.ground : t.sub,
        }}
      >
        {label}
      </Text>
    </Press>
  );
}

/** The pill segmented control used by Plan and Activity. */
export function Segmented({
  options,
  value,
  onChange,
  height = 42,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  height?: number;
}) {
  const { t } = useTheme();
  return (
    <Glass
      tone="glass"
      radius={999}
      flat
      style={{ flexDirection: 'row', padding: 4 }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              flex: 1,
              height,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? t.ink : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 15,
                color: active ? t.ground : t.sub,
              }}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </Glass>
  );
}

export function Toggle({
  on,
  onPress,
}: {
  on: boolean;
  onPress: () => void;
}) {
  const { t, dark } = useTheme();
  const x = useRef(new Animated.Value(on ? 20 : 0)).current;

  React.useEffect(() => {
    Animated.timing(x, {
      toValue: on ? 20 : 0,
      duration: 190,
      useNativeDriver: true,
    }).start();
  }, [on, x]);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 50,
        height: 30,
        borderRadius: 999,
        padding: 3,
        backgroundColor: on ? t.sage : t.track,
      }}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: dark && !on ? '#8B857D' : '#fff',
          transform: [{ translateX: x }],
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
  height = 56,
  fontSize = 16,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  /** Onboarding's CTA runs a half-point larger than in-app buttons. */
  fontSize?: number;
}) {
  const { t } = useTheme();
  return (
    <Press
      scale={disabled ? 1 : 0.98}
      haptic={disabled ? false : 'medium'}
      onPress={() => !disabled && onPress()}
      style={[
        {
          height,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 18,
          backgroundColor: disabled ? t.soft : t.coral,
          ...(disabled
            ? {}
            : {
                shadowColor: t.coral,
                shadowOpacity: 0.28,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }),
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize,
          textAlign: 'center',
          color: disabled ? t.lbl : '#fff',
        }}
      >
        {label}
      </Text>
    </Press>
  );
}

export function GhostButton({
  label,
  onPress,
  style,
  height = 52,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  const { t } = useTheme();
  return (
    <Press
      scale={0.97}
      onPress={onPress}
      style={[
        {
          height,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 14,
          backgroundColor: t.faint,
          borderWidth: t.lipWidth,
          borderColor: t.lipColor,
          ...shadowOf(t),
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 15,
          color: t.sub,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Press>
  );
}

/** Circular icon button — back arrows, the theme switch, row trash cans. */
export function IconButton({
  name,
  onPress,
  size = 44,
  iconSize = 19,
  tone = 'faint',
  color,
  style,
}: {
  name: IconName;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  tone?: 'faint' | 'soft' | 'glass';
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const bg = tone === 'soft' ? t.soft : tone === 'glass' ? t.glass : t.faint;
  return (
    <Press
      scale={0.9}
      onPress={onPress}
      hitSlop={6}
      style={[
        {
          width: size,
          height: size,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          borderWidth: tone === 'soft' ? 0 : t.lipWidth,
          borderColor: t.lipColor,
        },
        style,
      ]}
    >
      <Icon name={name} size={iconSize} color={color ?? t.sub} />
    </Press>
  );
}

/** Rounded progress track with an animated fill. */
export function Track({
  pct,
  color,
  height = 6,
  style,
}: {
  pct: number;
  color: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const w = useRef(new Animated.Value(Math.min(Math.max(pct, 0), 100))).current;

  React.useEffect(() => {
    Animated.timing(w, {
      toValue: Math.min(Math.max(pct, 0), 100),
      duration: 340,
      useNativeDriver: false,
    }).start();
  }, [pct, w]);

  return (
    <View
      style={[
        {
          height,
          borderRadius: 999,
          backgroundColor: t.track,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 999,
          backgroundColor: color,
          width: w.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}

/** A status pill: sage when ahead of pace, ochre when behind. */
export function StatPill({
  caption,
  value,
  tone,
}: {
  caption: string;
  value: string;
  tone: 'neutral' | 'good' | 'warn';
}) {
  const { t } = useTheme();
  const bg =
    tone === 'good' ? t.sageBg : tone === 'warn' ? t.ochreBg : t.soft;
  const fg =
    tone === 'good' ? t.sageInk : tone === 'warn' ? t.ochre : t.ink;
  return (
    <View
      style={{
        height: 32,
        paddingHorizontal: 16,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: bg,
      }}
    >
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 12,
          letterSpacing: 1.08,
          textTransform: 'uppercase',
          opacity: 0.72,
          color: fg,
        }}
      >
        {caption}
      </Text>
      <Text style={{ fontFamily: font.semibold, fontSize: 12, color: fg }}>
        {value}
      </Text>
    </View>
  );
}

/**
 * A fixed-column grid.
 *
 * Percentage widths inside a wrapping row never divide cleanly once a `gap` is
 * involved — columns drift a pixel or two and the last row misaligns. Laying
 * rows out explicitly and giving each cell `flex: 1` splits the space exactly,
 * and short final rows are padded so their cells keep the column width.
 */
export function Grid<T>({
  items,
  columns,
  gap = 10,
  renderItem,
}: {
  items: T[];
  columns: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <View style={{ gap }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {row.map((item, c) => (
            <View key={c} style={{ flex: 1 }}>
              {renderItem(item, r * columns + c)}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, k) => (
            <View key={`pad-${k}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * A text field on a frosted surface.
 *
 * Android draws a `TextInput`'s own background as an opaque rectangle inside
 * the rounded frame and adds a platform underline, so a field styled directly
 * shows a white box, a stray line and a doubled border. Here the surface and
 * border belong to a wrapping `Glass`, and the input itself is transparent,
 * borderless and underline-free — which is what web was already doing.
 */
export function Field({
  height = 56,
  radius = 18,
  align = 'left',
  fontSize = 17,
  weight = 'medium',
  accentBorder = false,
  containerStyle,
  style,
  ...input
}: TextInputProps & {
  height?: number;
  radius?: number;
  align?: 'left' | 'center';
  fontSize?: number;
  weight?: 'medium' | 'semibold';
  /** Draws the accent-tinted focus ring used during setup. */
  accentBorder?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();

  return (
    <Glass
      radius={radius}
      style={[
        { height },
        accentBorder
          ? { borderWidth: 1.5, borderColor: t.accent + '66' }
          : null,
        containerStyle,
      ]}
    >
      <TextInput
        // Kills the stock Android underline; the rounded frame is ours.
        underlineColorAndroid="transparent"
        placeholderTextColor={t.lbl}
        {...input}
        style={[
          {
            flex: 1,
            paddingHorizontal: align === 'center' ? 12 : 18,
            paddingVertical: 0,
            backgroundColor: 'transparent',
            borderWidth: 0,
            textAlign: align,
            textAlignVertical: 'center',
            includeFontPadding: false,
            fontFamily: weight === 'semibold' ? font.semibold : font.medium,
            fontSize,
            color: t.ink,
          },
          style,
        ]}
      />
    </Glass>
  );
}
