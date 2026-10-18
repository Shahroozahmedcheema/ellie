import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeContext';

/**
 * The bottom sheet used by the amount editor, the add flow and new goals.
 * Slides up over a blurred scrim, exactly as `eSheet` does in the prototype.
 */
export function Sheet({
  open,
  onClose,
  children,
  scroll = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const { t, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(y, {
          toValue: 0,
          duration: 240,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(y, {
          toValue: 1,
          duration: 190,
          easing: Easing.bezier(0.4, 0, 1, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, mounted, y, fade]);

  if (!mounted) return null;

  const Body = scroll ? ScrollView : View;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: dark
                    ? 'rgba(10,8,7,0.62)'
                    : 'rgba(247,245,242,0.78)',
                },
              ]}
            />
          </Pressable>
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '92%',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            overflow: 'hidden',
            // No lip on Android: a translucent border over the fill below
            // composites into a brighter ring along the top edge.
            borderTopWidth: Platform.OS === 'android' ? 0 : t.lipWidth,
            borderColor: t.lipColor,
            // Android will not clip the fill layers below to these rounded top
            // corners, so on Android the surface is this view's own background
            // — the one fill that always rounds correctly.
            backgroundColor: Platform.OS === 'android' ? t.solid : undefined,
            shadowColor: '#000',
            shadowOpacity: dark ? 0.5 : 0.12,
            shadowRadius: 34,
            shadowOffset: { width: 0, height: -10 },
            elevation: 24,
            transform: [
              {
                translateY: y.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 700],
                }),
              },
            ],
          }}
        >
          {Platform.OS === 'android' ? null : (
            <>
              <LinearGradient
                colors={t.sheetStops}
                start={{ x: 0.18, y: 0 }}
                end={{ x: 0.82, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: dark
                      ? 'rgba(26,22,19,0.86)'
                      : 'rgba(247,245,242,0.72)',
                  },
                ]}
              />
            </>
          )}
          <Body
            style={{ maxHeight: '100%' }}
            contentContainerStyle={
              scroll
                ? {
                    padding: 20,
                    paddingTop: 14,
                    paddingBottom: 26 + insets.bottom,
                    gap: 16,
                  }
                : undefined
            }
            {...(scroll ? { showsVerticalScrollIndicator: false } : {})}
          >
            <View
              style={
                scroll
                  ? { gap: 16 }
                  : {
                      padding: 20,
                      paddingTop: 14,
                      paddingBottom: 26 + insets.bottom,
                      gap: 16,
                    }
              }
            >
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 44,
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: t.track,
                  }}
                />
              </View>
              {children}
            </View>
          </Body>
        </Animated.View>
      </View>
    </Modal>
  );
}
