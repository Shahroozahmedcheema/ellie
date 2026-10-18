import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Press, font, shadowOf } from './ui';

export const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'] as const;
export type Key = (typeof KEYS)[number];

const ROWS: Key[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['000', '0', 'del'],
];

/** Applies a keypad press to a digit string, capped at 7 digits. */
export function pressDigits(current: string, key: Key): string {
  if (key === 'del') return current.slice(0, -1);
  if (key === '000') return current ? (current + '000').slice(0, 7) : current;
  return (current + key).replace(/^0+/, '').slice(0, 7);
}

export function Keypad({
  onPress,
  glass = true,
  dimModifiers = true,
}: {
  onPress: (key: Key) => void;
  /** The setup flow uses lighter, shorter keys. */
  glass?: boolean;
  /** Fade 000 and delete. The onboarding income pad keeps all keys equal. */
  dimModifiers?: boolean;
}) {
  const { t } = useTheme();

  // Laid out as explicit rows of three. Wrapping with percentage widths plus a
  // gap leaves the columns a fraction out on some widths; `flex: 1` inside a
  // fixed row divides the space exactly, every time.
  return (
    <View style={{ gap: 9 }}>
      {ROWS.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 9 }}>
          {row.map((k) => {
            // The prototype dims 000/delete on the add and amount pads only;
            // the onboarding income pad styles all twelve keys alike.
            const dim = dimModifiers && (k === 'del' || k === '000');
            return (
              <Press
                key={k}
                scale={0.93}
                haptic="selection"
                onPress={() => onPress(k)}
                accessibilityRole="button"
                accessibilityLabel={k === 'del' ? 'Delete' : k}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: glass ? 18 : 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: dim ? t.faint : t.glass,
                  borderWidth: t.lipWidth,
                  borderColor: t.lipColor,
                  ...shadowOf(t),
                }}
              >
                <Text
                  style={{
                    fontFamily: font.medium,
                    fontSize: glass ? 21 : 20,
                    color: dim ? t.sub : t.ink,
                  }}
                >
                  {k === 'del' ? '⌫' : k}
                </Text>
              </Press>
            );
          })}
        </View>
      ))}
    </View>
  );
}
