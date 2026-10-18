import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeContext';

/**
 * The soft colour wash behind every screen. The prototype stacks five blurred
 * radial gradients; here each is an SVG radial gradient that fades to
 * transparent, which reads the same without a blur pass.
 *
 * It measures its own box rather than the window so it always matches the
 * surface it sits behind, and never overflows it.
 */
export function BlobField({ opacity }: { opacity?: number }) {
  const { t } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) =>
      Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1
        ? s
        : { w: width, h: height },
    );
  };

  // The CSS version bleeds past every edge; here the blobs simply overshoot.
  const span = Math.max(size.w, size.h);

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[
        StyleSheet.absoluteFill,
        { overflow: 'hidden', opacity: opacity ?? t.blobOpacity },
      ]}
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            {t.blobs.map((b, i) => (
              <RadialGradient key={i} id={`blob${i}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={b.color} stopOpacity="1" />
                <Stop offset="0.32" stopColor={b.color} stopOpacity="1" />
                <Stop offset="1" stopColor={b.color} stopOpacity="0" />
              </RadialGradient>
            ))}
          </Defs>
          {t.blobs.map((b, i) => (
            <Circle
              key={i}
              cx={b.x * size.w}
              cy={b.y * size.h}
              r={b.r * span * 1.9}
              fill={`url(#blob${i})`}
            />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
