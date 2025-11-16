import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware"
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
    status: DownloadStatus
    progress: number
    localPath?: string
    error?: string | null
}


export interface DownloadState {
    queue: DownloadItem[],
    activeDownload: { fileId: number, start: number, end: number, retry: number, pct: number } | null,
    items: Record<string, DownloadItem>
    downloadManager?: DownloadManagerApi | null,

    addToQueue: (payload: { bookId: number, fileId: number }) => void
    setProgress: (bookId: number, fileId: number, progress: number) => void,
    setManagerRef: (m: DownloadManagerApi) => void
    startDownload: (payload: { bookId: number; fileId: number; }) => Promise<string | null>
    setStatus: (bookId: number, fileId: number, status: DownloadStatus, err?: string | null) => void
    setLocalPath: (bookId: number, fileId: number, path: string) => void
}

export const useDownloadStore = create<DownloadState>()(subscribeWithSelector((set, get) => ({
    queue: [],
    items: {},
    activeDownload: null,
    progress: null,
    downloadManager: null,
    addToQueue: ({ bookId, fileId }) => set((s) => {
        const key = `${bookId}_${fileId}`
        if (s.items[key]) return s
        const item: DownloadItem = {
            bookId,
            fileId,
            status: 'pending',
            progress: 0,
            localPath: undefined,
            error: null,
        }
        return { queue: [...s.queue, item], items: { ...s.items, [key]: item } }
    }),

    setProgress: (bookId, fileId, progress) =>
        set((s) => {
            const key = `${bookId}_${fileId}`
            const item = s.items[key]
            if (!item) return s
            const updated = { ...item, progress }
            return { items: { ...s.items, [key]: updated } }
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
})))