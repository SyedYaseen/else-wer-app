// app/(tabs)/_layout.tsx — Folio Tab Layout
// Responds to system light / dark mode automatically via useTheme().

import React from 'react';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/hooks/useClientOnlyValue';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/components/hooks/useTheme';

function TabIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
}) {
  return <MaterialIcons name={name} size={22} color={color} />;
}

export default function TabLayout() {
  const T = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),

        // ── Tab bar ──────────────────────────────────────────────────────────
        tabBarStyle: {
          backgroundColor: T.background,
          borderTopWidth: 0.5,
          borderTopColor: T.inkHairline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.inkSubtle,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 10,
          letterSpacing: 0.04,
          marginTop: 2,
        },

        // ── Header ───────────────────────────────────────────────────────────
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
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <TabIcon name="menu-book" color={color} />,
        }}
      />

      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          tabBarIcon: ({ color }) => <TabIcon name="arrow-circle-down" color={color} />,
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="tune" color={color} />,
        }}
      />
    </Tabs>
  );
}