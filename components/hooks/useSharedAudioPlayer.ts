import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { useAudioPlayerStore } from '../store/audio-player-store';


export function useSharedAudioPlayer() {
    const player = useAudioPlayer();
    const status = useAudioPlayerStatus(player);

    const { setPlayer, setStatus } = useAudioPlayerStore();


    useEffect(() => {
        setPlayer(player);
    }, [player]);

    useEffect(() => {
        setStatus(status);
    }, [status]);

    return { player, status };
}
