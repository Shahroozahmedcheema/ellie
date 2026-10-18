import { Slot } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { TabBar } from '@/components/TabBar';
import { Tour } from '@/components/Tour';
import { useTheme } from '@/theme/ThemeContext';

export default function TabsLayout() {
  const { t } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.ground }}>
      <Slot />
      <TabBar />
      <Tour />
    </View>
  );
}
