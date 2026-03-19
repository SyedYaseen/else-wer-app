// components/hooks/useInitPlayer.ts

import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { useEffect } from 'react';

export default function useInitPlayer() {
    const player = useAudioPlayer();
    const setPlayer = useAudioPlayerStore(s => s.setPlayer);

    useEffect(() => {
        const init = async () => {
            try {
                // expo-audio props — note: singular interruptionMode, shouldPlayInBackground
                await setAudioModeAsync({
                    playsInSilentMode: true,   // keep playing when iOS silent switch is on
                    shouldPlayInBackground: true,   // background playback on both platforms
                    interruptionMode: 'doNotMix',
                });

                console.log('Audio player init — background mode enabled');
            } catch (err) {
                console.error('Failed to set audio mode:', err);
            }

            // Always set the player regardless of audio mode success
            setPlayer(player);
        };

        init();
    }, [player]);
}