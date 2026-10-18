import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeContext';
import { BlobField } from './BlobField';

/** Height cleared at the bottom so content never hides under the tab bar. */
export const TAB_CLEARANCE = 108;

/**
 * Every screen sits on the same ground: colour wash behind, safe-area padding,
 * and a gentle rise-in so navigation feels like the prototype's `eRise`.
 */
export function Screen({
  children,
  contentStyle,
  scroll = true,
  padBottom = TAB_CLEARANCE,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  padBottom?: number;
}) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rise.setValue(0);
    Animated.timing(rise, {
      toValue: 1,
      duration: 220,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  const body = (
    <Animated.View
      style={{
        // Android only: no opacity in the entry animation.
        //
        // A view with opacity < 1 forces offscreen alpha compositing, and every
        // elevated child inside that layer has its shadow drawn manually rather
        // than by the system shadow pass — which paints a hard rectangle around
        // each card. It clears the instant the animation reaches 1 and the
        // layer is dropped, so it reads as a box flashing then vanishing.
        // The rise alone carries the motion.
        opacity: Platform.OS === 'android' ? 1 : rise,
        transform: [
          {
            translateY: rise.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={[
          {
            paddingHorizontal: 20,
            paddingTop: 2,
            gap: 14,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.ground, overflow: 'hidden' }}>
      <BlobField />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 6,
            paddingBottom: padBottom + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 6,
            paddingBottom: padBottom + insets.bottom,
          }}
        >
          {body}
        </View>
      )}
    </View>
  );
}
