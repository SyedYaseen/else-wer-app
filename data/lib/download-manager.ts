
import * as FileSystem from 'expo-file-system'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DownloadItem, DownloadState, useDownloadStore } from '@/components/store/download-strore'
import { Buffer } from "buffer";
import { FileHandle, File, Paths } from 'expo-file-system';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function arrayBufferToBinaryStr(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

export class DownloadManager {
  private running = false
  private processing = false
  private queue: { bookId: number; fileId: number }[] = []

  // config
  private CHUNK_SIZE = 1024 * 256 // 256KB
  private CONCURRENCY = 3
  private MAX_RETRIES = 3
  private PROGRESS_PERSIST_MS = 3000 // throttle persisting to AsyncStorage

  private lastPersistAt = 0

  constructor() {
    // Optionally restore queue from AsyncStorage
    this.restoreState().catch(() => { })
  }

  async restoreState() {
    try {
      const raw = await AsyncStorage.getItem('download_queue_v1')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        this.queue = parsed
      }
    } catch (err) {
      console.warn('Failed to restore download queue', err)
    }
  }

  async persistQueue() {
    try {
      await AsyncStorage.setItem('download_queue', JSON.stringify(this.queue))
    } catch (err) {
      console.warn('persistQueue error', err)
    }
  }

  async enqueue(item: { bookId: number; fileId: number }) {
    this.queue.push(item)
    await this.persistQueue()

    if (!this.processing) this.startQueue().catch((e) => console.warn(e))

    return new Promise<string | null>((resolve) => {
      const key = `${item.bookId}_${item.fileId}`

      const unsubscribe = useDownloadStore.subscribe(
        (state) => state.items[key],
        (current: DownloadItem | undefined) => {
          if (!current) return;

          if (current.status === "complete") {
            unsubscribe();
            resolve(current.localPath ?? null);
          }

          if (current.status === "failed") {
            unsubscribe();
            resolve(null);
          }
        }
      )
    })
  }

  private async startQueue() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const next = this.queue.shift()!
      try {
        await this.processOne(next)
      } catch (err) {
        console.warn('processOne failed', err)
      }
      // persist after each item
      await this.persistQueue()
    }

    this.processing = false
  }

  private async processOne(item: { bookId: number; fileId: number; fileName?: string }) {
    const { bookId, fileId, fileName } = item
    const key = `${bookId}_${fileId}`
    const store = useDownloadStore.getState()

    store.setStatus(bookId, fileId, 'downloading')

    try {
      // call chunked downloader which uses concurrency internally
      const localPath = await this.downloadFileInChunks(bookId, fileId, fileName)
      store.setLocalPath(bookId, fileId, localPath)
      store.setStatus(bookId, fileId, 'complete')
      // final persist
      await AsyncStorage.setItem(`download:${key}:localPath`, localPath)
    } catch (err: any) {
      console.warn('download failed for', key, err)
      store.setStatus(bookId, fileId, 'failed', String(err?.message || err))
    }
  }

  // core chunked downloader
  private async downloadFileInChunks(bookId: number, fileId: number, fileName?: string) {
    const store = useDownloadStore.getState()

    const baseUrl = await AsyncStorage.getItem('server')
    const token = await AsyncStorage.getItem('token')
    if (!baseUrl) throw new Error('server not configured')

    const fileUrlBase = `${baseUrl}/download_chunk/${fileId}`

    // HEAD to get size
    const headResp = await fetch(fileUrlBase, { method: 'HEAD', headers: { Authorization: `Bearer ${token}` } })
    const totalSize = Number(headResp.headers.get('content-length') || '0')
    if (!totalSize) throw new Error('Unable to determine file size')

    const newFile = new FileSystem.File(Paths.document, "audiobooks", bookId.toString(), `${fileId}_${fileName}`)
    newFile.create({ intermediates: true, overwrite: true })

    // clear any existing file
    //await FileSystem.writeAsStringAsync(destPath, '', { encoding: FileSystem.EncodingType.UTF8 }).catch(() => { })

    // prepare chunk map

    type Chunk = { index: number; start: number; end: number; retries: number }
    const chunks: Chunk[] = []
    for (let start = 0, idx = 0; start < totalSize; start += this.CHUNK_SIZE, idx++) {
      const end = Math.min(start + this.CHUNK_SIZE - 1, totalSize - 1)
      chunks.push({ index: idx, start, end, retries: 0 })
    }

    const results: (Uint8Array | null)[] = Array(chunks.length).fill(null)

    // downloads a single chunk with retries
    const downloadChunk = async (c: Chunk) => {
      const downloadUrl = `${fileUrlBase}?size=${this.CHUNK_SIZE}&start=${c.start}&end=${c.end}`

      try {
        const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(`bad status ${res.status}`)
        const arrayBuffer = await res.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)

        results[c.index] = bytes
      } catch (err) {
        if (c.retries < this.MAX_RETRIES) {
          c.retries++
          return downloadChunk(c)
        } else {
          throw err
        }
      }
    }

    // worker pool
    let pointer = 0
    const worker = async () => {
      while (pointer < chunks.length) {
        const c = chunks[pointer++] // safe in JS single-threaded model
        await downloadChunk(c)

        // update store progress (throttle persisted writes)
        const received = Math.min((c.end + 1), totalSize)
        const overallReceived = Math.min(received, totalSize) // rough - we rely on results array for final size

        // persist progress occasionally
        const now = Date.now()
        if (now - this.lastPersistAt > this.PROGRESS_PERSIST_MS) {
          this.lastPersistAt = now
          const key = `${bookId}_${fileId}`
          try {
            //await AsyncStorage.setItem(`download:${key}:progress`, String(progress))
          } catch (e) {
            // ignore persistence failures
          }
        }
      }
    }

    // launch workers
    const workers = [] as Promise<void>[]
    const concurrency = Math.min(this.CONCURRENCY, chunks.length)
    for (let i = 0; i < concurrency; i++) workers.push(worker())
    await Promise.all(workers)

    try {
      const fHandle = newFile.open()
      for (let i = 0; i < results.length; i++) {
        fHandle.offset = i * this.CHUNK_SIZE
        if (results[i] !== null) {
          // @ts-ignore Checking for null previously
          fHandle.writeBytes(results[i])
        }
      }
      fHandle.close()
    } catch (err) {
      console.error("Failed to saved downloaded data to device")
    }

    // final verification: check size
    //const info = await FileSystem.getInfoAsync(destPath, { size: true })
    //console.log("file info -=-=: ", info)
    //if (!info.exists || info.size === 0) throw new Error('Final file missing or empty')

    // return local path (file://)
    return Paths.join(Paths.document, "audiobooks", bookId.toString(), `${fileId}_${fileName}`).toString()
  }
}
