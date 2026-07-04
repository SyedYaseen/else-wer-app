// app/(tabs)/menu.tsx — Folio Settings Screen
// Theme toggle uses useThemeToggle() — three options: System / Light / Dark.
// Built on the shared components/ui primitive layer — see DESIGN_SYSTEM.md.

import {
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getServerBooks, logout, removeAllLocalBooks, scanServerFiles } from '@/data/api/api';
import { resetDb } from '@/data/database/utils';
import { upsertAudiobooks } from '@/data/database/audiobook-repo';
import { useTheme, useThemeToggle, ColorMode } from '@/theme';
import { ListSection, ListRow, SegmentedControl, SegmentOption, Text } from '@/components/ui';

// ── Appearance row (label + control stacked inside the card) ──────────────────

const MODES: SegmentOption<ColorMode>[] = [
  { value: 'light', label: 'Light', icon: 'light-mode' },
  { value: 'system', label: 'System', icon: 'brightness-auto' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode' },
];

function AppearanceRow() {
  const T = useTheme();
  const { colorMode, setColorMode } = useThemeToggle();

  return (
    <View
      style={{
        paddingHorizontal: T.space.md + 2,
        paddingTop: T.space.md + 1,
        paddingBottom: T.space.md + 2,
        borderBottomWidth: 0.5,
        borderBottomColor: T.inkHairline,
        gap: T.space.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: T.space.md }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: T.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: T.accent + '18',
          }}
        >
          <MaterialIcons name="palette" size={T.icon.md} color={T.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: T.font.sans.medium, fontSize: T.font.size.md, color: T.ink, marginBottom: 2 }}>
            Colour scheme
          </Text>
          <Text style={{ fontFamily: T.font.sans.light, fontSize: T.font.size.base, color: T.inkMuted }}>
            Choose light, dark, or follow system
          </Text>
        </View>
      </View>
      <SegmentedControl
        options={MODES}
        value={colorMode}
        onChange={setColorMode}
        style={{ marginLeft: 46 }}
      />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MenuTab() {
  const T = useTheme();
  const { activeMode } = useThemeToggle();
  const [isOnline, setIsOnline] = useState(true);

  const handleSyncDatabase = () =>
    Alert.alert('Sync Library', 'Scan server for new audiobook files?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sync',
        onPress: async () => {
          await scanServerFiles();
          const books = await getServerBooks();
          await upsertAudiobooks(books.books);
        },
      },
    ]);

  const handleToggleOnline = (next: boolean) => {
    if (!next) {
      Alert.alert('Go Offline', 'Disconnect from server?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go Offline', onPress: () => setIsOnline(false) },
      ]);
    } else {
      try {
        setIsOnline(true);
      } catch {
        Alert.alert('Connection Failed', 'Unable to connect to server.');
      }
    }
  };

  const handleDeleteDownloads = () =>
    Alert.alert(
      'Delete Downloads',
      'Remove all downloaded files? Your library data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await removeAllLocalBooks(); } },
      ],
    );

  const handleResetDatabase = () =>
    Alert.alert(
      'Reset Database',
      'This will delete all data and reset the app. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => { await resetDb(); } },
      ],
    );

  const handleLogout = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(router); } },
    ]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: T.background }}
      contentContainerStyle={{ paddingHorizontal: T.space.lg, paddingTop: T.space.sm, paddingBottom: T.space.xxl + 8 }}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Appearance ── */}
      <ListSection title="Appearance">
        <AppearanceRow />
        <ListRow
          icon={activeMode === 'dark' ? 'dark-mode' : 'light-mode'}
          title="Current scheme"
          subtitle={activeMode === 'dark' ? 'Dark mode active' : 'Light mode active'}
          tint={T.inkSubtle}
          isLast
        />
      </ListSection>

      {/* ── Sync & Connection ── */}
      <ListSection title="Sync & Connection">
        <ListRow
          icon="sync"
          title="Sync Library"
          subtitle="Scan server for new audiobook files"
          onPress={handleSyncDatabase}
          tint={T.accent}
        />
        <ListRow
          icon={isOnline ? 'cloud-done' : 'cloud-off'}
          title="Server connection"
          subtitle={isOnline ? 'Connected — tap to go offline' : 'Offline — tap to reconnect'}
          tint={isOnline ? T.sage : T.inkMuted}
          isLast
          toggle={{ value: isOnline, onValueChange: handleToggleOnline }}
        />
      </ListSection>

      {/* ── Library ── */}
      <ListSection title="Library">
        <ListRow
          icon="folder-open"
          title="Local Files"
          subtitle="Browse downloaded audiobooks"
          onPress={() => console.log('Showing local files...')}
          tint={T.accent}
          isLast
        />
      </ListSection>

      {/* ── Storage ── */}
      <ListSection title="Storage">
        <ListRow
          icon="delete-sweep"
          title="Delete Downloads"
          subtitle="Remove downloaded files only"
          onPress={handleDeleteDownloads}
          tint={T.warning}
        />
        <ListRow
          icon="restore"
          title="Reset Database"
          subtitle="Delete all data and start fresh"
          onPress={handleResetDatabase}
          tint={T.danger}
          isLast
        />
      </ListSection>

      {/* ── Account ── */}
      <ListSection title="Account">
        <ListRow
          icon="logout"
          title="Log Out"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          tint={T.danger}
          isLast
        />
      </ListSection>

      <View style={{ height: T.space.xxl + 16 }} />
    </ScrollView>
  );
}
