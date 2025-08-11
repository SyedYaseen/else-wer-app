
import Library from '@/components/library';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1 }}>
        <Library />
      </View>
    </>
  );
}


