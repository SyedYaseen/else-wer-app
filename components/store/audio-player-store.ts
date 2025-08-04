import { create } from 'zustand';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus, AudioStatus, AudioSource } from 'expo-audio';

interface AudioPlayerState {
    player: AudioPlayer | null;
    setPlayer: (player: AudioPlayer) => void,
    playerStatus: AudioStatus | null,
    setStatus: (status: AudioStatus) => void,
}

export const useAudioPlayerStore = create<AudioPlayerState>((set) => ({
    player: null,
    playerStatus: null,
    setPlayer: (player) => set({ player }),
    setStatus: (status) => set({ playerStatus: status })

}))
