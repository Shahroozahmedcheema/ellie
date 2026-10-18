import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BlurTargetProvider } from '@/components/BlurTarget';
import { Loader } from '@/components/Loader';
import { initNotifications } from '@/lib/notifications';
import { Celebration, PopNotice } from '@/components/Overlays';
import { SheetsProvider } from '@/components/SheetsProvider';
import { EllieProvider, useEllie } from '@/store/EllieStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <EllieProvider>
          <ThemeProvider>
            <Shell fontsLoaded={fontsLoaded} />
          </ThemeProvider>
        </EllieProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Shell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { t, dark } = useTheme();
  const { ready } = useEllie();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.ground).catch(() => {});
  }, [t.ground]);

  useEffect(() => {
    initNotifications();
  }, []);

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) {
    return <Loader />;
  }

  return (
    <BlurTargetProvider>
    <SheetsProvider>
      <View style={{ flex: 1, backgroundColor: t.ground }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: t.ground },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="detail/[cat]"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
        <PopNotice />
        <Celebration />
      </View>
    </SheetsProvider>
    </BlurTargetProvider>
  );
}
