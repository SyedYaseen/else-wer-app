import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { login } from '@/data/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Pressable, StyleSheet, TextInput, View, Text } from 'react-native';

export default function Login() {
    const router = useRouter();
    const [server, setServer] = useState('http://192.168.1.3:3000'); // TODO: replace with global store
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin');
    const setServerStore = useAudioPlayerStore(s => s.setServer)
    const handleLogin = async () => {
        try {
            const data = await login(server, username, password)

            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('server', server + "/api");
            setServerStore(server + "/api")

            router.replace('/');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const setServerVal = () => {
        setServer((server) => {
            if (server === "http://192.168.1.3:3000") return "http://192.168.1.12:3000"
            else return "http://192.168.1.3:3000"
        })
    }

    const setCreds = () => {
        setUsername((user) => {
            if (user === "valerie") {
                setPassword("admin")
                return "admin"
            }

            else {
                setPassword("mypassword")
                return "valerie"
            }
        })
    }

    return (
        <View style={styles.container}>
            <Pressable style={{ padding: 10, backgroundColor: "#1c1c1e" }} onPress={setServerVal}>
                <Text style={{ color: "#FFF" }}>Toggle server</Text>
            </Pressable>
            <Pressable style={{ padding: 10, backgroundColor: "#1c1c1e" }} onPress={setCreds}>
                <Text style={{ color: "#FFF" }}>Toggle Creds</Text>
            </Pressable>
            <TextInput placeholder="Server Address" value={server} onChangeText={setServer} style={styles.input} />
            <TextInput placeholder="Email" value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

            <Button title="Login" onPress={handleLogin} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1, justifyContent: 'center' },
    input: { borderWidth: 1, marginBottom: 12, padding: 10, borderRadius: 5, color: '#FFFFFF' }
})
