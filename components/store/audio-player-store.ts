import { create } from 'zustand';
import { Audiobook, FileRow } from '@/data/database/models';
import { AudioPlayer } from 'expo-audio';

interface AudioPlayerState {
    server: string | null;
    setServer: (server: string) => void;

    player: AudioPlayer | null;
    setPlayer: (player: AudioPlayer) => void;

    currentBook: Audiobook | null;
    setCurrentBook: (book: Audiobook | null) => void;

    // Bumped every setCurrentBook call. Lets stale async continuations (e.g. a
    // saveProgress().then() started before a book switch) detect they resolved
    // after the book changed and bail instead of clobbering the new book's state.
    bookLoadSeq: number;

    queue: FileRow[] | null;
    setQueue: (q: FileRow[]) => void;
    popQueue: () => void;
    clearQueue: () => void;

    initPos: number | null;
    setInitpos: (initPos: number) => void;

    files: FileRow[] | null;
    setFiles: (f: FileRow[]) => void;
    clearFiles: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set) => ({
    server: null,
    setServer: (server) => set({ server }),

    player: null,
    setPlayer: (player: AudioPlayer) => set({ player }),

    currentBook: null,
    setCurrentBook: (book: Audiobook | null) => set((s) => ({ currentBook: book, bookLoadSeq: s.bookLoadSeq + 1 })),

    bookLoadSeq: 0,

    queue: null,
    setQueue: (queue: FileRow[]) => set({ queue }),
    popQueue: () => set(({ queue }) => {
        if (!queue || queue.length === 0) return { queue: [] }
        return { queue: queue.slice(1) }
    }),
    clearQueue: () => set({ queue: [] }),

    initPos: 0,
    setInitpos: (initPos) => set({ initPos }),

    files: null,
    setFiles: (files: FileRow[]) => set({ files }),
    clearFiles: () => set({ files: null }),
}))
