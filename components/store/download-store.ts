import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage, subscribeWithSelector } from "zustand/middleware"
export type DownloadManagerApi = {
  enqueue: (item: { bookId: number; fileId: number; fileName?: string }) => Promise<string | null>
  startQueue?: () => Promise<void>
  pause?: (bookId: number) => void
  resume?: (bookId: number) => void
}

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'failed' | 'complete'

export type DownloadItem = {
  bookId: number
  fileId: number
  fileName: string
  fileSize: number
  author: string
  title: string
  status: DownloadStatus
  progress: number
  localPath?: string
  error?: string | null
}

export interface BookProgressData {
  totalSize: number;         // e.g., the total file size in bytes
  currentProgress: number;   // e.g., the current position in bytes
}

type BookProgress = Record<number, BookProgressData>;

export interface DownloadState {
  queue: DownloadItem[]
  items: Record<string, DownloadItem>
  downloadManager?: DownloadManagerApi | null
  bookProgress: BookProgress
  setBookSz: (bookId: number, totalSize?: number) => void
  resetDownload: (bookId: number) => void,
  clearAllDownloads: () => void,
  addToQueue: (payload: { bookId: number, fileId: number, fileName: string, fileSize: number }) => void
  setProgress: (bookId: number, fileId: number, progress: number) => void,
  setManagerRef: (m: DownloadManagerApi) => void
  startDownload: (payload: { bookId: number; fileId: number; fileName: string, fileSize: number }) => Promise<string | null>
  setStatus: (bookId: number, fileId: number, status: DownloadStatus, err?: string | null) => void
  setLocalPath: (bookId: number, fileId: number, path: string) => void
}

export const useDownloadStore = create<DownloadState>()(subscribeWithSelector(

  persist((set, get) => ({
    queue: [],
    items: {},
    progress: null,
    bookProgress: {},
    downloadManager: null,
    addToQueue: ({ bookId, fileId, fileName, fileSize, author, title }) => set((s) => {
      const key = `${bookId}_${fileId}`
      if (s.items[key]) return s
      const item: DownloadItem = {
        bookId,
        fileId,
        fileName,
        fileSize,
        author,
        title,
        status: 'pending',
        progress: 0,
        localPath: undefined,
        error: null,
      }
      return { queue: [...s.queue, item], items: { ...s.items, [key]: item } }
    }),

    setProgress: (bookId, fileId, progress) =>
      set((s) => {
        const key = `${bookId}_${fileId}`;
        const item = s.items[key];
        if (!item) return s;

        const updatedItems = {
          ...s.items,
          [key]: { ...item, progress: item.progress + progress }, // absolute, not accumulated
        };

        const overallBookProgress = {
          ...s.bookProgress,
          [bookId]: { ...s.bookProgress[bookId], currentProgress: (s.bookProgress[bookId].currentProgress ?? 0) + progress }
        }

        return {
          items: updatedItems,
          bookProgress: overallBookProgress
        };
      }),

    setBookSz: (bookId, totalSize) => set((s) => {
      if (!bookId) return s;
      if (!totalSize) return s;

      return {
        bookProgress: {
          ...s.bookProgress,
          [bookId]: { currentProgress: 0, totalSize }
        }
      };
    }),

    resetDownload: (bookId) => set((s) => {
      if (!bookId) return s;

      const key = `${bookId}_`;
      const updatedItems = { ...s.items }

      Object.keys(s.items).forEach(k => {
        if (k.startsWith(key)) {
          delete updatedItems[k]
        }
      })

      const updatedBookProgress = { ...s.bookProgress }
      delete updatedBookProgress[bookId]

      return {
        items: updatedItems,
        bookProgress: updatedBookProgress
      };
    }),

    clearAllDownloads: () => set((s) => {
      return {
        queue: [],
        items: {},
        bookProgress: {}
      };
    }),

    setManagerRef: (m) => set(() => ({ downloadManager: m })),

    setStatus: (bookId, fileId, status, err = null) =>
      set((s) => {
        const key = `${bookId}_${fileId}`
        const item = s.items[key]
        if (!item) return s

        const updated = { ...item, status, error: err }
        return { items: { ...s.items, [key]: updated } }
      }),

    setLocalPath: (bookId, fileId, path) =>
      set((s) => {
        const key = `${bookId}_${fileId}`
        const item = s.items[key]
        if (!item) return s
        const updated = { ...item, localPath: path }
        return { items: { ...s.items, [key]: updated } }
      }),

    startDownload: async (payload) => {
      const store = get()
      const m = store.downloadManager
      if (!m) throw new Error('Download manager not initialized')
      // enqueue + let manager handle processing
      store.addToQueue({ ...payload })
      return m.enqueue(payload)
    },
  }), {
    name: "download-store-v1",
    storage: createJSONStorage(() => AsyncStorage),
    // Don't persist the manager ref — it's a class instance
    partialize: (state) => ({
      items: state.items,
      bookProgress: state.bookProgress,
      queue: state.queue,
    }),
  })
))
