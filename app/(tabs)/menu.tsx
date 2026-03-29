// app/(tabs)/menu.tsx — Folio Settings Screen
// Theme toggle uses useThemeToggle() — three options: System / Light / Dark.

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getServerBooks, logout, removeAllLocalBooks, scanServerFiles } from '@/data/api/api';
import { resetDb } from '@/data/database/utils';
import { upsertAudiobooks } from '@/data/database/audiobook-repo';
import { useTheme, useThemeToggle, Theme, ColorMode } from '@/components/hooks/useTheme';

// ── Segmented control for theme selection ─────────────────────────────────────

const MODES: { value: ColorMode; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { value: 'light', label: 'Light', icon: 'light-mode' },
  { value: 'system', label: 'System', icon: 'brightness-auto' },
  { value: 'dark', label: 'Dark', icon: 'dark-mode' },
];

function ThemeSegmentedControl({ T }: { T: Theme }) {
  const { colorMode, setColorMode } = useThemeToggle();

  return (
    <View style={[
      styles.segmentTrack,
      { backgroundColor: T.surfaceDeep, borderColor: T.inkHairline },
    ]}>
      {MODES.map((mode, i) => {
        const active = colorMode === mode.value;
        return (
          <Pressable
            key={mode.value}
            onPress={() => setColorMode(mode.value)}
            style={[
              styles.segment,
              active && [styles.segmentActive, { backgroundColor: T.surface, borderColor: T.inkHairline }],
              i < MODES.length - 1 && !active && styles.segmentDivider,
            ]}
          >
            <MaterialIcons
              name={mode.icon}
              size={15}
              color={active ? T.accent : T.inkSubtle}
            />
            <Text style={[
              styles.segmentLabel,
              { color: active ? T.ink : T.inkSubtle },
            ]}>
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── MenuItem ──────────────────────────────────────────────────────────────────

type MenuItemProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle: string;
  onPress?: () => void;
  tint?: string;
  isLast?: boolean;
  T: Theme;
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
};

function MenuItem({
  icon, title, subtitle, onPress,
  tint, isLast, T, toggle,
}: MenuItemProps) {
  const iconTint = tint ?? T.ink;

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { borderBottomColor: T.inkHairline },
        isLast && styles.menuItemLast,
      ]}
      onPress={onPress}
      activeOpacity={toggle ? 1 : 0.55}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconTint + '18' }]}>
        <MaterialIcons name={icon} size={18} color={iconTint} />
      </View>

      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, { color: T.ink }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: T.inkMuted }]}>{subtitle}</Text>
      </View>

      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onValueChange}
          trackColor={{ false: T.inkHairline, true: T.accent + 'AA' }}
          thumbColor={toggle.value ? T.accent : T.inkSubtle}
          ios_backgroundColor={T.inkHairline}
        />
      ) : (
        <MaterialIcons name="chevron-right" size={18} color={T.inkSubtle} />
      )}
    </TouchableOpacity>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  title, children, T,
}: {
  title: string;
  children: React.ReactNode;
  T: Theme;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: T.inkSubtle }]}>{title}</Text>
      <View style={[styles.sectionCard, {
        backgroundColor: T.surface,
        borderColor: T.inkHairline,
      }]}>
        {children}
      </View>
    </View>
  );
}

// ── Appearance row (label + control stacked inside the card) ──────────────────

function AppearanceRow({ T }: { T: Theme }) {
  return (
    <View style={[styles.appearanceRow, { borderBottomColor: T.inkHairline }]}>
      <View style={styles.appearanceTop}>
        <View style={[styles.iconWrap, { backgroundColor: T.accent + '18' }]}>
          <MaterialIcons name="palette" size={18} color={T.accent} />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, { color: T.ink }]}>Colour scheme</Text>
          <Text style={[styles.menuSubtitle, { color: T.inkMuted }]}>
            Choose light, dark, or follow system
          </Text>
        </View>
      </View>
      <ThemeSegmentedControl T={T} />
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
      style={[styles.container, { backgroundColor: T.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Appearance ── */}
      <Section title="Appearance" T={T}>
        <AppearanceRow T={T} />
        <MenuItem
          icon={activeMode === 'dark' ? 'dark-mode' : 'light-mode'}
          title="Current scheme"
          subtitle={activeMode === 'dark' ? 'Dark mode active' : 'Light mode active'}
          T={T}
          tint={T.inkSubtle}
          isLast
          // purely informational — no onPress needed
          onPress={undefined}
        />
      </Section>

      {/* ── Sync & Connection ── */}
      <Section title="Sync & Connection" T={T}>
        <MenuItem
          icon="sync"
          title="Sync Library"
          subtitle="Scan server for new audiobook files"
          onPress={handleSyncDatabase}
          tint={T.accent}
          T={T}
        />
        <MenuItem
          icon={isOnline ? 'cloud-done' : 'cloud-off'}
          title="Server connection"
          subtitle={isOnline ? 'Connected — tap to go offline' : 'Offline — tap to reconnect'}
          tint={isOnline ? T.sage : T.inkMuted}
          T={T}
          isLast
          toggle={{ value: isOnline, onValueChange: handleToggleOnline }}
        />
      </Section>

      {/* ── Library ── */}
      <Section title="Library" T={T}>
        <MenuItem
          icon="folder-open"
          title="Local Files"
          subtitle="Browse downloaded audiobooks"
          onPress={() => console.log('Showing local files...')}
          tint={T.accent}
          T={T}
          isLast
        />
      </Section>

      {/* ── Storage ── */}
      <Section title="Storage" T={T}>
        <MenuItem
          icon="delete-sweep"
          title="Delete Downloads"
          subtitle="Remove downloaded files only"
          onPress={handleDeleteDownloads}
          tint={T.warning}
          T={T}
        />
        <MenuItem
          icon="restore"
          title="Reset Database"
          subtitle="Delete all data and start fresh"
          onPress={handleResetDatabase}
          tint={T.danger}
          T={T}
          isLast
        />
      </Section>

      {/* ── Account ── */}
      <Section title="Account" T={T}>
        <MenuItem
          icon="logout"
          title="Log Out"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          tint={T.danger}
          T={T}
          isLast
        />
      </Section>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  section: { marginTop: 28 },
  sectionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.14,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  // Appearance row — stacked layout
  appearanceRow: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  appearanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Segmented control
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 3,
    marginLeft: 46,   // aligns with text after the icon column
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  segmentActive: {
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentDivider: {
    // subtle visual separation between inactive segments
  },
  segmentLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.02,
  },

  // Menu item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  menuItemLast: { borderBottomWidth: 0 },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontFamily: 'DMSans_300Light',
    fontSize: 12,
  },
});