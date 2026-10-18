import React, { useEffect, useRef } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import type { TourTargetKey } from '@/lib/content';

export type TargetRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * The handful of elements the coach marks point at, registered by key.
 *
 * A plain module-level map rather than React context: the tour measures a
 * target at the moment it needs one, so there is no subscription to miss and no
 * provider identity to get wrong. Anchors mount and unmount freely.
 */
const registry = new Map<TourTargetKey, React.RefObject<View | null>>();

/** Measures a registered element in window coordinates. */
export function measureTarget(key: TourTargetKey): Promise<TargetRect | null> {
  return new Promise((resolve) => {
    const node = registry.get(key)?.current;
    if (!node) return resolve(null);
    let settled = false;
    // measureInWindow never calls back for a detached view, so cap the wait.
    const guard = setTimeout(() => {
      if (!settled) resolve(null);
    }, 250);
    node.measureInWindow((x, y, width, height) => {
      settled = true;
      clearTimeout(guard);
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}

/** Wraps an element the tour highlights. */
export function TourAnchor({
  tourKey,
  children,
  ...rest
}: ViewProps & { tourKey: TourTargetKey; children: React.ReactNode }) {
  const ref = useRef<View | null>(null);

  useEffect(() => {
    registry.set(tourKey, ref);
    return () => {
      if (registry.get(tourKey) === ref) registry.delete(tourKey);
    };
  }, [tourKey]);

  return (
    <View
      ref={ref}
      // Native needs this so the view survives to be measured; on web the prop
      // leaks straight through to the DOM.
      {...(Platform.OS === 'web' ? null : { collapsable: false })}
      {...rest}
    >
      {children}
    </View>
  );
}
