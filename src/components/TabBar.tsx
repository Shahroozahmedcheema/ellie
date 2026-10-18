import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';

import { Icon, type IconName } from '@/lib/icons';
import {
  ANDROID_BLUR_METHOD,
  scrimBlurSupported,
  useBlurTarget,
} from './BlurTarget';
import { useTheme } from '@/theme/ThemeContext';
import type { AddMode } from './AddSheet';
import { useSheets } from './SheetsProvider';
import { TourAnchor } from './TourTargets';
import { Glass, font } from './ui';

import type { TourTargetKey } from '@/lib/content';

const TABS: {
  route: string;
  label: string;
  icon: IconName;
  tourKey?: TourTargetKey;
}[] = [
  { route: '/home', label: 'Home', icon: 'tabHome' },
  {
    route: '/activity',
    label: 'Activity',
    icon: 'tabActivity',
    tourKey: 'tabActivity',
  },
  { route: '/plan', label: 'Plan', icon: 'tabPlan', tourKey: 'tabPlan' },
  {
    route: '/settings',
    label: 'Settings',
    icon: 'tabSettings',
    tourKey: 'tabSettings',
  },
];

const FAB_ACTIONS: {
  label: string;
  mode: AddMode;
  icon: IconName;
  dx: number;
  dy: number;
}[] = [
  { label: 'Type', mode: 'manual', icon: 'keyboard', dx: -104, dy: -62 },
  { label: 'Say', mode: 'voice', icon: 'micSmall', dx: 0, dy: -104 },
  { label: 'Scan', mode: 'scan', icon: 'camera', dx: 104, dy: -62 },
];

export function TabBar() {
  const { t, dark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { openAdd } = useSheets();
  const blurTarget = useBlurTarget();
  const [open, setOpen] = useState(false);

  const fan = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fan, {
        toValue: open ? 1 : 0,
        duration: open ? 260 : 180,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(spin, {
        toValue: open ? 1 : 0,
        duration: 190,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, fan, spin]);

  const bottom = Math.max(insets.bottom, 12) + 10;

  return (
    <>
      {open ? (
        // Full-screen, so it can blur for real on every native version. The
        // Pressable also swallows every touch, so the screen behind is inert
        // while the actions are open — tapping anywhere just closes them.
        <Pressable
          onPress={() => setOpen(false)}
          style={[StyleSheet.absoluteFill, { zIndex: 12 }]}
        >
          {scrimBlurSupported ? (
            <BlurView
              intensity={72}
              tint={dark ? 'dark' : 'light'}
              blurMethod={ANDROID_BLUR_METHOD}
              blurTarget={blurTarget}
              style={StyleSheet.absoluteFill}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: dark
                      ? 'rgba(26,22,19,0.28)'
                      : 'rgba(255,255,255,0.30)',
                  },
                ]}
              />
            </BlurView>
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: dark
                    ? 'rgba(26,22,19,0.66)'
                    : 'rgba(255,255,255,0.72)',
                },
              ]}
            />
          )}
        </Pressable>
      ) : null}

      <View
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom,
          height: 66,
          zIndex: open ? 16 : 10,
        }}
      >
        {open ? null : (
          <Glass
            tone="glassUp"
            radius={999}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 66,
            }}
          />
        )}

        <View
          style={{
            height: 66,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 30,
          }}
        >
          {TABS.slice(0, 2).map((tab) => (
            <TabButton
              key={tab.route}
              {...tab}
              active={pathname === tab.route}
              muted={open}
              onPress={() => router.replace(tab.route as never)}
            />
          ))}
          <View style={{ width: 56 }} />
          {TABS.slice(2).map((tab) => (
            <TabButton
              key={tab.route}
              {...tab}
              active={pathname === tab.route}
              muted={open}
              onPress={() => router.replace(tab.route as never)}
            />
          ))}
        </View>

        {FAB_ACTIONS.map((action, i) => (
          <Animated.View
            key={action.mode}
            pointerEvents={open ? 'auto' : 'none'}
            // See Overlays: the discs are elevated and this fades them.
            renderToHardwareTextureAndroid
            style={{
              position: 'absolute',
              left: '50%',
              marginLeft: -32,
              top: -27,
              width: 64,
              alignItems: 'center',
              gap: 5,
              zIndex: 17,
              opacity: fan,
              transform: [
                {
                  translateX: fan.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, action.dx],
                  }),
                },
                {
                  translateY: fan.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, action.dy],
                  }),
                },
                {
                  scale: fan.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            }}
          >
            <Pressable
              onPress={() => {
                setOpen(false);
                openAdd(action.mode);
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.28,
                shadowRadius: 26,
                shadowOffset: { width: 0, height: 10 },
                elevation: 10,
              }}
            >
              <Icon
                name={action.icon}
                size={24}
                strokeWidth={1.8}
                color="#1C1B1A"
              />
            </Pressable>
            <View
              style={{
                height: 22,
                paddingHorizontal: 9,
                borderRadius: 999,
                backgroundColor: t.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 10.5,
                  letterSpacing: 0.42,
                  color: t.ground,
                }}
              >
                {action.label}
              </Text>
            </View>
          </Animated.View>
        ))}

        <TourAnchor
          tourKey="fab"
          style={{
            position: 'absolute',
            left: '50%',
            marginLeft: -30,
            top: -22,
            zIndex: 18,
          }}
        >
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel="Log an expense"
        >
          <Animated.View
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              backgroundColor: t.coral,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: t.coral,
              shadowOpacity: 0.36,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
              transform: [
                {
                  rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
                {
                  scale: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.04],
                  }),
                },
              ],
            }}
          >
            <Icon name="plus" size={24} strokeWidth={1.9} color="#fff" />
          </Animated.View>
        </Pressable>
        </TourAnchor>
      </View>
    </>
  );
}

function TabButton({
  label,
  icon,
  active,
  muted,
  onPress,
  tourKey,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  muted: boolean;
  onPress: () => void;
  tourKey?: TourTargetKey;
}) {
  const { t } = useTheme();
  const scale = useRef(new Animated.Value(active ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: active ? 1 : 0.6,
      duration: 210,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [active, scale]);

  const body = (
    <Pressable
      onPress={onPress}
      disabled={muted}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={{
        width: 56,
        alignItems: 'center',
        gap: 3,
        opacity: muted ? 0.45 : 1,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -9,
          width: 56,
          height: 48,
          borderRadius: 999,
          backgroundColor: t.soft,
          opacity: active ? 1 : 0,
          transform: [{ scale }],
        }}
      />
      <Icon
        name={icon}
        size={19}
        strokeWidth={1.6}
        color={active ? t.coral : t.lbl}
      />
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 11,
          color: active ? t.coral : t.lbl,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  if (!tourKey) return body;
  return <TourAnchor tourKey={tourKey}>{body}</TourAnchor>;
}
