// app/_layout.tsx — Folio Root Layout

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/components/hooks/useColorScheme';
import { initDb } from '@/data/database/initdb';
import useInitPlayer from '@/components/hooks/useInitPlayer';
import MiniPlayer from '@/components/player/mini-player';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { View, StyleSheet } from 'react-native';
import { DownloadManager } from '@/data/lib/download-manager';
import { useDownloadStore } from '@/components/store/download-strore';
import { ThemeProvider, useTheme } from '@/components/hooks/useTheme';

// ── Folio font imports from expo-google-fonts ─────────────────────────────────
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // ── Folio fonts ───────────────────────────────────────────────────────────
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

// ── ThemedStack — must be inside ThemeProvider to call useTheme() ─────────────

function ThemedStack() {
  const T = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: T.background,
        },
        headerTitleStyle: {
          fontFamily: 'DMSerifDisplay_400Regular',
          fontSize: 18,
          color: T.ink,
        },
        headerTintColor: T.ink,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: T.background,
          borderTopWidth: 0.5,
          borderTopColor: T.inkHairline,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="player/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

// ── RootLayoutNav ─────────────────────────────────────────────────────────────

function RootLayoutNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useInitPlayer();

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        console.log("Database initialized!");
      } catch (err) {
        console.error("DB init error:", err);
      }
    })();

    const manager = new DownloadManager();
    useDownloadStore.getState().setManagerRef(manager as any);

    return () => {
      // cleanup if necessary
    };
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token && pathname !== '/login') {
        router.replace('/login');
      }
      setChecking(false);
    };
    checkToken();
  }, [pathname]);

  if (checking) return null;

  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});