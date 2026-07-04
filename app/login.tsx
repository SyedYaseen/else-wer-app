// app/login.tsx — Folio Login
// Built on the shared components/ui primitive layer — see DESIGN_SYSTEM.md.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { login } from '@/data/api/api';
import { useTheme } from '@/theme';
import { Button, Card, Pill } from '@/components/ui';

// ── Dev toggle data ───────────────────────────────────────────────────────────

const SERVERS = [
  'http://192.168.1.10:3000',
  'http://192.168.1.4:3000',
];

const CREDS = [
  { username: 'admin', password: 'admin' },
  { username: 'pappu', password: 'pappu' },
];

// ── Stateless input row ───────────────────────────────────────────────────────

type InputRowProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  showPassword?: boolean;
  onToggleShow?: () => void;
};

function InputRow({
  label, value, onChangeText, placeholder,
  secureTextEntry, autoCapitalize, icon,
  showPassword, onToggleShow,
}: InputRowProps) {
  const T = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: T.inkSubtle }]}>{label}</Text>
      <View style={[
        styles.inputRow,
        { backgroundColor: T.surface, borderColor: T.inkHairline },
      ]}>
        <MaterialIcons name={icon} size={16} color={T.inkSubtle} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: T.ink }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.inkSubtle}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          autoComplete="off"
        />
        {secureTextEntry && onToggleShow && (
          <Pressable onPress={onToggleShow} hitSlop={12}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={16}
              color={T.inkSubtle}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function Login() {
  const T = useTheme();
  const router = useRouter();
  const setServerStore = useAudioPlayerStore(s => s.setServer);

  const [server, setServer] = useState(SERVERS[0]);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverIndex, setServerIndex] = useState(0);
  const [credsIndex, setCredsIndex] = useState(0);

  // ── Dev helpers ─────────────────────────────────────────────────────────────
  const toggleServer = () => {
    const next = (serverIndex + 1) % SERVERS.length;
    setServerIndex(next);
    setServer(SERVERS[next]);
  };

  const toggleCreds = () => {
    const next = (credsIndex + 1) % CREDS.length;
    setCredsIndex(next);
    setUsername(CREDS[next].username);
    setPassword(CREDS[next].password);
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await login(server, username, password);

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('server', server + '/api');
      setServerStore(server + '/api');
      router.replace('/');
    } catch (err: any) {
      console.error('Failed to connect:', server, err);
      setError(err.message ?? 'Unable to connect. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: T.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Wordmark ── */}
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: T.ink }]}>Else Wer</Text>
        </View>

        {/* ── Form card ── */}
        <Card style={{ borderRadius: T.radius.xl, padding: T.space.xl, gap: T.space.lg }}>

          <InputRow
            label="Server address"
            icon="dns"
            value={server}
            onChangeText={setServer}
            placeholder="http://192.168.1.x:3000"
            autoCapitalize="none"
          />

          <InputRow
            label="Username"
            icon="person-outline"
            value={username}
            onChangeText={setUsername}
            placeholder="username"
            autoCapitalize="none"
          />

          <InputRow
            label="Password"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            showPassword={showPass}
            onToggleShow={() => setShowPass(v => !v)}
            autoCapitalize="none"
          />

          {error ? (
            <View style={[
              styles.errorBox,
              { backgroundColor: T.danger + '14', borderColor: T.danger + '44' },
            ]}>
              <MaterialIcons name="error-outline" size={14} color={T.danger} />
              <Text style={[styles.errorText, { color: T.danger }]}>{error}</Text>
            </View>
          ) : null}

          <Button label="Sign in" onPress={handleLogin} loading={loading} />
        </Card>

        {/* ── Dev toggles ── */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <View style={styles.devRow}>
              <Pill icon="swap-horiz" label="Toggle server" onPress={toggleServer} />
              <Pill icon="swap-horiz" label="Toggle creds" onPress={toggleCreds} />
            </View>
            <Text style={[styles.devHint, { color: T.inkSubtle }]}>{server}</Text>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  wordmark: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 52,
    lineHeight: 56,
    marginBottom: 8,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    paddingVertical: 0,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  devSection: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
  },
  devRow: {
    flexDirection: 'row',
    gap: 10,
  },
  devHint: {
    fontFamily: 'DMSans_300Light',
    fontSize: 10,
    letterSpacing: 0.04,
  },
});