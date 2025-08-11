
import Library from '@/components/library';
import { logout } from '@/data/api/api';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={async () => await logout(router)}>
        <MaterialIcons name="logout" size={40} color="#FFF" />
      </TouchableOpacity>
      <Library />
    </View>
  );
}


