import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { blurSupported, useBlurTarget } from './BlurTarget';
import { shadowOf } from './ui';

export type GlassCardProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius for the card and its frame. */
  radius?: number;
  /** Blur strength where blurring is possible, 1–100. */
  intensity?: number;
  /** The brighter surface, for sheets and bars that sit above content. */
  raised?: boolean;
  /** Drop the highlight lip — used for flush strips. */
  bare?: boolean;
  /** A deeper drop shadow, for surfaces that float. */
  lift?: boolean;
};

/**
 * A frosted surface that degrades honestly.
 *
 * Android can only blur a backdrop efficiently from API 31; below that
 * `expo-blur` silently falls back to a flat translucent view. Layered over an
 * unblurred background that reads as a dingy grey plate rather than glass — and
 * because the fallback is a *child* view, a rounded parent cannot clip it on
 * older Android, so it also shows as a square-cornered box inside the card.
 *
 * So rather than blur badly, older Android gets a clean opaque surface.
 *
 * Two rules make this safe on every Android version:
 *   1. The blur or the fill IS the card — never a layer inside it. A view's own
 *      background and border round reliably everywhere; children clipped to a
 *      rounded parent do not.
 *   2. Nothing is rendered that the platform cannot actually draw.
 */
export function GlassCard({
  children,
  style,
  radius = 24,
  intensity = 40,
  raised = false,
  bare = false,
  lift = false,
}: GlassCardProps) {
  const { t, dark } = useTheme();
  const blurTarget = useBlurTarget();

  // The caller's style comes last so layout, padding and any overrides win.
  const frame: ViewStyle = {
    borderRadius: radius,
    borderWidth: bare ? 0 : t.lipWidth,
    borderColor: t.lipColor,
    ...shadowOf(t, lift),
  };

  if (!blurSupported) {
    // No border: a translucent lip over an opaque fill composites into a
    // brighter ring inset around the surface, which reads as a second box.
    return (
      <View
        style={[
          frame,
          { backgroundColor: raised ? t.solidUp : t.solid, borderWidth: 0 },
          style,
          { borderWidth: 0 },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={dark ? 'dark' : 'light'}
      // Android needs both: a named method, and a target view to sample.
      blurMethod="dimezisBlurViewSdk31Plus"
      blurTarget={blurTarget}
      style={[
        frame,
        // The blur draws to its own bounds; clipping keeps content inside them.
        { overflow: 'hidden' },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

/** True when this device draws a real blur, so callers can adjust copy or tone. */
export const canBlur = blurSupported;

/** Handy for one-off surfaces that are not cards. */
export const isLegacyAndroid =
  Platform.OS === 'android' && Number(Platform.Version) < 31;
