// hooks/useAuthGate.ts
//
// Runs once on app start. Decides whether the user goes to the library
// or the login screen based on stored credentials and network state.
//
// Rules:
//   offline mode + token present  → library (skip server entirely)
//   online mode  + token present  → try a lightweight server ping,
//                                   on success → library
//                                   on failure → library anyway (graceful degradation)
//                                   no token   → login
//   no token (either mode)        → login

import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkState } from '@/components/store/network-store';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';

type AuthState = 'loading' | 'authed' | 'unauthed';

export function useAuthGate() {
    const [authState, setAuthState] = useState<AuthState>('loading');
    const router = useRouter();
    const segments = useSegments();

    const isOnline = useNetworkState(s => s.isOnline);
    const setServer = useAudioPlayerStore(s => s.setServer);

    useEffect(() => {
        let cancelled = false;

        async function check() {
            try {
                const [token, server] = await AsyncStorage.multiGet(['token', 'server']);
                const storedToken = token[1];
                const storedServer = server[1];

                if (!storedToken) {
                    // No credentials at all — must log in
                    if (!cancelled) setAuthState('unauthed');
                    return;
                }

                // Restore server into store regardless of mode
                if (storedServer) {
                    setServer(storedServer);
                }

                if (!isOnline) {
                    // Offline mode: trust the stored token, go straight to library
                    if (!cancelled) setAuthState('authed');
                    return;
                }

                // Online mode: do a lightweight ping to verify the token is still valid.
                // We don't block the user if the server is unreachable — just let them in
                // with a stale token. Your API layer will surface auth errors naturally.
                try {
                    if (storedServer) {
                        const res = await fetch(`${storedServer}/ping`, {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${storedToken}` },
                            signal: AbortSignal.timeout(4000), // don't hang forever
                        });

                        if (res.status === 401) {
                            // Token is definitively invalid
                            await AsyncStorage.multiRemove(['token', 'server']);
                            if (!cancelled) setAuthState('unauthed');
                            return;
                        }
                    }
                } catch {
                    // Server unreachable — still let the user into the library.
                    // They'll get errors when they actually try to stream/sync.
                }

                if (!cancelled) setAuthState('authed');
            } catch {
                // Storage failure — safest to send to login
                if (!cancelled) setAuthState('unauthed');
            }
        }

        check();
        return () => { cancelled = true; };
        // Re-run if the user flips online/offline mode while on the loading screen
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    // Handle navigation side-effects separately so the hook stays pure
    useEffect(() => {
        if (authState === 'loading') return;

        const inAuthGroup = segments[0] === 'login';

        if (authState === 'unauthed' && !inAuthGroup) {
            router.replace('/login');
        } else if (authState === 'authed' && inAuthGroup) {
            router.replace('/');
        }
    }, [authState, segments, router]);

    return authState;
}