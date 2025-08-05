import { create } from 'zustand';
import { Audiobook, FileRow } from '@/data/database/models';

interface AudioPlayerState {
    initPos: number | null;
    setInitpos: (initPos: number) => void;

    showMiniPlayer: boolean;
    setShowMiniPlayer: (visible: boolean) => void;

    currentBookId: number | null;
    setCurrentBookId: (id: number) => void;

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

    initPos: 0,
    setInitpos: (initPos) => set({ initPos }),

    showMiniPlayer: false,
    setShowMiniPlayer: (visible) => set({ showMiniPlayer: visible }),

    currentBookId: null,
    setCurrentBookId: (id: number) => set({ currentBookId: id }),

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
