import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MASCOT } from '@/lib/content';
import { Icon, type IconName } from '@/lib/icons';
import { useEllie } from '@/store/EllieStore';
import { GlassCard } from './GlassCard';
import { useTheme } from '@/theme/ThemeContext';
import { font } from './ui';

const POP_ICON: Record<string, IconName> = {
  budget: 'clock',
  del: 'trash',
  info: 'info',
  add: 'check',
  edit: 'check',
};

/**
 * The transient notice that rises above the tab bar after any change.
 * Mirrors the prototype's `eToast` keyframes: in, hold, out.
 */
export function PopNotice() {
  const { pop } = useEllie();
  const { t, dark } = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = React.useState(pop);

  useEffect(() => {
    if (!pop) return;
    setShown(pop);
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, {
        toValue: 1,
        duration: 160,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.delay(1180),
      Animated.timing(v, {
        toValue: 2,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setShown(null);
    });
  }, [pop, v]);

  if (!shown) return null;

  const hue = t.hue[shown.cat] ?? t.sage;

  return (
    <Animated.View
      pointerEvents="none"
      // Rasterised for the fade: an alpha layer would otherwise draw the card's
      // elevation shadow by hand and show it as a hard box. Baking the subtree
      // into a texture first keeps the shadow correct while it animates.
      renderToHardwareTextureAndroid
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 152,
        zIndex: 34,
        alignItems: 'center',
        opacity: v.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, 1, 0],
        }),
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [14, 0, -6],
            }),
          },
          {
            scale: v.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0.94, 1, 1],
            }),
          },
        ],
      }}
    >
      <GlassCard
        raised
        lift
        radius={20}
        intensity={30}
        style={{
          maxWidth: 330,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 11,
          paddingLeft: 12,
          paddingRight: 16,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: hue,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={POP_ICON[shown.kind] ?? 'check'}
            size={19}
            strokeWidth={2.2}
            color={dark ? '#1A1613' : '#fff'}
          />
        </View>
        <View style={{ flexShrink: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: font.semibold, fontSize: 14.5, color: t.ink }}
          >
            {shown.title}
          </Text>
          {shown.sub ? (
            <Text
              numberOfLines={1}
              style={{ fontFamily: font.regular, fontSize: 12, color: t.sub }}
            >
              {shown.sub}
            </Text>
          ) : null}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

/** Full-screen flourish when a goal is fully funded. */
export function Celebration() {
  const { celebrate, clearCelebrate } = useEllie();
  const { t, dark } = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!celebrate) return;
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: 930,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [celebrate, v, bob]);

  if (!celebrate) return null;

  const sparkColors = [
    t.coral,
    t.sage,
    t.hue.Fun,
    t.hue.Transport,
    t.hue.Shopping,
    t.hue.Home,
  ];

  return (
    <Pressable
      onPress={clearCelebrate}
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 60,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: dark ? 'rgba(26,22,19,0.82)' : 'rgba(247,245,242,0.86)',
        },
      ]}
    >
      <Animated.Image
        source={MASCOT.cheering}
        style={{
          height: 116,
          width: 116,
          resizeMode: 'contain',
          opacity: t.mascotOpacity,
          transform: [
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -7],
              }),
            },
          ],
        }}
      />
      <View style={{ alignItems: 'center', gap: 6, paddingTop: 6 }}>
        {[0, 1].map((i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: i === 0 ? t.sage : t.coral,
              opacity: v.interpolate({
                inputRange: [0, 0.15, 1],
                outputRange: [0.7, 0.55, 0],
              }),
              transform: [
                {
                  scale: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, i === 0 ? 2.4 : 2.1],
                  }),
                },
              ],
            }}
          />
        ))}
        {sparkColors.map((c, i) => (
          <Animated.View
            key={c + i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: -110 + i * 44,
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: c,
              opacity: v.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateY: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -96],
                  }),
                },
              ],
            }}
          />
        ))}
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 13,
            letterSpacing: 1.17,
            textTransform: 'uppercase',
            color: t.sageInk,
          }}
        >
          Goal reached
        </Text>
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 24,
            lineHeight: 30,
            letterSpacing: -0.72,
            color: t.ink,
            textAlign: 'center',
          }}
        >
          {celebrate}
        </Text>
        <Text
          style={{ fontFamily: font.regular, fontSize: 14, color: t.sub }}
        >
          Every rupee of it.
        </Text>
      </View>
    </Pressable>
  );
}
