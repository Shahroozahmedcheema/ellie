import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';

import { MASCOT } from '@/lib/content';
import { useTheme } from '@/theme/ThemeContext';
import { BlobField } from './BlobField';
import { font } from './ui';

/**
 * The first thing anyone sees, and it has to hold for a moment without looking
 * broken. Picks up where the native splash leaves off — same ground, same
 * mascot — so the handover reads as one screen settling rather than two.
 */
export function Loader({ caption }: { caption?: string }) {
  const { t } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [spin, bob, enter]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.ground,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <BlobField />

      <Animated.View
        style={{
          alignItems: 'center',
          opacity: enter,
          transform: [
            {
              scale: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1],
              }),
            },
          ],
        }}
      >
        <View
          style={{
            width: 132,
            height: 132,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* One arc sweeping the accent, echoing the spending ring. */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 116,
              height: 116,
              borderRadius: 999,
              borderWidth: 4,
              borderColor: t.coral + '22',
              borderTopColor: t.coral,
              borderRightColor: t.coral + '88',
              transform: [
                {
                  rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          />
          <Animated.Image
            source={MASCOT.logo}
            style={{
              width: 78,
              height: 78,
              resizeMode: 'contain',
              opacity: t.mascotOpacity,
              transform: [
                {
                  translateY: bob.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
            }}
          />
        </View>

        <Text
          style={{
            marginTop: 22,
            fontFamily: font.semibold,
            fontSize: 20,
            letterSpacing: -0.4,
            color: t.ink,
          }}
        >
          Ellie
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: font.regular,
            fontSize: 13,
            color: t.sub,
          }}
        >
          {caption ?? 'Getting your cycle ready…'}
        </Text>
      </Animated.View>
    </View>
  );
}
