import { create } from 'zustand';
import { AudioPlayer, useAudioPlayer, useAudioPlayerStatus, AudioStatus, AudioSource } from 'expo-audio';
import { Audiobook, FileRow } from '@/data/database/models';

interface AudioPlayerState {
    showMiniPlayer: boolean;
    setShowMiniPlayer: (visible: boolean) => void;

    currentBook: Audiobook | null;
    setCurrentBook: (book: Audiobook | null) => void;

    queue: FileRow[] | null;
    setQueue: (q: FileRow[]) => void;
    popQueue: () => void;
    clearQueue: () => void;

    files: FileRow[] | null;
    setFiles: (f: FileRow[]) => void;
    clearFiles: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set) => ({
    showMiniPlayer: false,
    setShowMiniPlayer: (visible) => set({ showMiniPlayer: visible }),

    currentBook: null,
    setCurrentBook: (book: Audiobook | null) => set({ currentBook: book }),

    queue: null,
    setQueue: (queue: FileRow[]) => set({ queue }),
    popQueue: () => set(({ queue }) => {
        if (!queue || queue.length === 0) return { queue: [] }
        return { queue: queue.slice(1) }
    }),
    clearQueue: () => set({ queue: [] }),

    files: null,
    setFiles: (files: FileRow[]) => set({ files }),
    clearFiles: () => set({ files: null }),
}))
