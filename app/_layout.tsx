import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/components/hooks/useColorScheme';
import { initDb } from '@/data/database/initdb';
import useInitPlayer from '@/components/hooks/useInitPlayer';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import MiniPlayer from '@/components/player/mini-player';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { View, StyleSheet } from 'react-native';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  // const tabBarHeight = useBottomTabBarHeight();
  const tabBarHeight = 84;
  const currentBook = useAudioPlayerStore(s => s.currentBook)
  useInitPlayer()

  useEffect(() => {
    (async () => {
      try {
        // await resetDb()
        // await AsyncStorage.clear()
        await initDb();
        console.log("Database initialized!");
      } catch (err) {
        console.error("DB init error:", err);
      }
    })();

  }, [])

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

  if (checking) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="book/[id]" />
      </Stack>

      {/* {currentBook && (
        <View style={[styles.miniPlayerWrapper, { bottom: tabBarHeight }]}>
          <MiniPlayer />
        </View>
      )} */}

    </ThemeProvider>
  );
}
const styles = StyleSheet.create({
  miniPlayerWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
