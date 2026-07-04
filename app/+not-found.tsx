// app/+not-found.tsx — Folio Not Found
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export default function NotFoundScreen() {
  const T = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: T.background }]}>
        <Text style={[styles.title, { color: T.ink }]}>This screen doesn't exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: T.accent }]}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
});
