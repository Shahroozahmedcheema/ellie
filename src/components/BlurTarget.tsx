import { BlurTargetView } from 'expo-blur';
import React, { createContext, useContext, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type Ctx = React.RefObject<View | null> | null;

const BlurTargetContext = createContext<Ctx>(null);

/**
 * Marks the content that frosted surfaces blur.
 *
 * On Android, `expo-blur` only blurs what a `BlurTargetView` captures, reached
 * through the `blurTarget` prop — a `BlurView` without one has nothing to
 * sample. iOS and web blur their real backdrop, so there they render the
 * children straight through.
 */
export function BlurTargetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<View | null>(null);

  // Older Expo Go clients bundle a build of expo-blur without this view.
  if (Platform.OS !== 'android' || !BlurTargetView) {
    return (
      <BlurTargetContext.Provider value={null}>
        {children}
      </BlurTargetContext.Provider>
    );
  }

  return (
    <BlurTargetContext.Provider value={ref}>
      {/* `flex: 1`, not absoluteFill — this wraps the whole app, and taking it
          out of normal flow leaves every screen measuring against nothing. */}
      <BlurTargetView ref={ref} style={{ flex: 1 }}>
        {children}
      </BlurTargetView>
    </BlurTargetContext.Provider>
  );
}

/**
 * Whether a real backdrop blur is possible here.
 *
 * Android can only blur efficiently from API 31, and `expo-blur` falls back to
 * a plain translucent view below it. That fallback is a rectangular child which
 * a rounded parent cannot clip on older Android, so on those devices it is
 * better to draw no blur layer at all and let the surface colour carry it.
 */
export const blurSupported =
  Platform.OS === 'ios' ||
  (Platform.OS === 'android' && Number(Platform.Version) >= 31);

/**
 * The blur engine to ask Android for.
 *
 * API 31+ has a cheap RenderNode path. Below that `dimezisBlurView` still
 * blurs, via the older RenderScript route — too costly for a dozen small cards,
 * but fine for the single full-screen scrim that is ever on screen at once.
 */
export const ANDROID_BLUR_METHOD =
  Number(Platform.Version) >= 31
    ? 'dimezisBlurViewSdk31Plus'
    : 'dimezisBlurView';

/**
 * Full-screen blur is safe on every native version.
 *
 * The artifact this codebase kept hitting came from a blur *child* inside a
 * rounded parent, which older Android will not clip. A scrim has no corners to
 * clip to, so it can blur for real even on Android 10.
 */
export const scrimBlurSupported = Platform.OS !== 'web';

/** The target a `BlurView` should sample, or null where none is needed. */
export function useBlurTarget() {
  return useContext(BlurTargetContext) ?? undefined;
}
