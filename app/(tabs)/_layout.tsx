// app/(tabs)/_layout.tsx — Folio Tab Layout

import React from 'react';
import { Tabs, usePathname } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useClientOnlyValue } from '@/components/hooks/useClientOnlyValue';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/hooks/useTheme';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import MiniPlayer from '@/components/player/mini-player';

const TABS = [
  { name: 'index', label: 'Library', icon: 'menu-book' },
  { name: 'downloads', label: 'Downloads', icon: 'arrow-circle-down' },
  { name: 'menu', label: 'Settings', icon: 'tune' },
] as const;

// ── Flat tab bar ──────────────────────────────────────────────────────────────

function FlatTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const T = useTheme();
  const insets = useSafeAreaInsets();
  const currentBook = useAudioPlayerStore(s => s.currentBook);
  const pathname = usePathname();
  const showMini = !!currentBook && !pathname.startsWith('/player/');

  return (
    <View style={{ backgroundColor: T.background }}>
      {showMini && <MiniPlayer />}

      {/* Hairline top border */}
      <View style={[styles.border, { backgroundColor: T.inkHairline }]} />

      {/* Tab row */}
      <View style={[
        styles.tabRow,
        { backgroundColor: T.background, paddingBottom: insets.bottom || 12 },
      ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <MaterialIcons
                name={tab.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                size={22}
                color={isFocused ? T.accent : T.inkSubtle}
              />
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? T.accent : T.inkSubtle },
                isFocused && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const T = useTheme();

  return (
    <Tabs
      tabBar={props => <FlatTabBar {...props} />}
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: T.background,
          borderBottomWidth: 0.5,
          borderBottomColor: T.inkHairline,
          elevation: 0,
          shadowOpacity: 0,
        } as any,
        headerTitleStyle: {
          fontFamily: 'DMSerifDisplay_400Regular',
          fontSize: 20,
          color: T.ink,
        },
        headerTintColor: T.ink,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Library', headerShown: false }}
      />
      <Tabs.Screen
        name="downloads"
        options={{ title: 'Downloads' }}
      />
      <Tabs.Screen
        name="menu"
        options={{ title: 'Settings' }}
      />
      <Tabs.Screen
        name="book/[id]"
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  border: {
    height: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  tabLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    letterSpacing: 0.04,
  },
  tabLabelActive: {
    fontFamily: 'DMSans_500Medium',
  },
});