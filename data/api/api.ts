import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";
import { ProgressRow } from '../database/models';
import { setFileProgressLcl } from '../database/sync-repo';
import { formatTime } from '@/utils/formatTime';
import { apiFetch } from './fetch-wrapper';

// user login
export async function login(server: string, username: string, password: string) {
  const res = await fetch(`${server}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) throw new Error('Login failed');

  return await res.json();
}

export async function logout(navigation: any) {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('server');
  navigation.replace('Login');
}


// Books
export async function scanServerFiles() {
  await apiFetch("/scan_files")
  await apiFetch("/init_books_from_file_scan_cache")
}


export async function fetchBooks() {
  // await scanServerFiles()
  const res = await apiFetch("/list_books")
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  const books = await res.json();
  // console.log(books)
  return books
}

export async function fetchFileMetaFromServer(id: number) {
  const res = await apiFetch(`/file_metadata/${id}`);
  const data = await res.json()
  return data;
}

const ROOT = FileSystem.documentDirectory + "audiobooks/";


const CHUNK_SIZE = 1024 * 1024 * 3 // 3MB
const CONCURRENCY_LIMIT = 16
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

export async function downloadFileInChunks(bookId: number, fileId: number) {
  const baseUrl = await AsyncStorage.getItem('server')
  const token = await AsyncStorage.getItem('token')
  let fileUrl = `${baseUrl}/download_chunk/${fileId}`;

  const destPath = `${ROOT}${bookId}`;

  // 1️⃣ Get file size first
  const headResp = await fetch(fileUrl, {
    method: "HEAD",
    headers: { Authorization: `Bearer ${token}` },
  });

  const totalSize = Number(headResp.headers.get("content-length")) || 0;

  if (!totalSize) throw new Error("Unable to get file size");

  console.log("Total size from HEAD:", totalSize);

  // 2️⃣ Clear or create the destination file
  await FileSystem.writeAsStringAsync(destPath, "", {
    encoding: FileSystem.EncodingType.UTF8,
  }).catch(err => console.error("Failed to create folder", destPath));

  fileUrl += `?size=${CHUNK_SIZE}`


  // create the download items
  let idx = 0;
  let chunks: { idx: number, start: number, end: number, retry: number }[] = []
  for (let start = 0; start < totalSize; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, totalSize - 1)
    chunks.push({ idx, start, end, retry: 0 })
  }

  const maxRetries = 3

  const results: (string | null)[] = []

  async function download(c: { idx: number, start: number, end: number, retry: number }) {
    let downloadUrl = `${fileUrl}&start=${c.start}&end=${c.end}`

    try {
      const res = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Bad status ${res.status}`);

      const buffer = await res.arrayBuffer();
      const base64Chunk = arrayBufferToBase64(buffer);

      results[c.idx] = base64Chunk;
    } catch (err) {
      if (c.retry < maxRetries) {
        console.warn("Retying chunk", fileUrl, c.idx, c.start, c.end, err)
        c.retry++
        return download(c)
      } else {
        throw new Error(`Failed to download ${fileUrl} idx: ${c.idx}`)
      }
    }

  }

  let pointer = 0;
  async function runWorker(): Promise<void> {
    while (pointer < chunks.length) {
      const chunk = chunks[pointer++]
      await download(chunk)
    }
  }

  let workers = []
  for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
    workers.push(runWorker())
  }

  await Promise.all(workers)

  for (let i = 0; i < results.length; i++) {
    let chunk = results[i]
    if (!chunk) throw new Error(`Missing chunk ${i}`);
    await FileSystem.writeAsStringAsync(destPath, chunk, {
      encoding: FileSystem.EncodingType.Base64,
      // @ts-expect-error: append supported in runtime
      append: true,
    })
  }

  return destPath;
}

export async function downloadAndUnzip(bookId: number) {
  const server = await AsyncStorage.getItem('server')
  const zipPath = `${ROOT}${bookId}.zip`;
  const destPath = `${ROOT}${bookId}/`;
  const url = `${server}/download_book/${bookId}`
  const token = await AsyncStorage.getItem('token')
  // Ensure "books" directory exists
  await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });

  console.log("Downloading:", url, "->", zipPath);
  await FileSystem.downloadAsync(url, zipPath, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  console.log("Unzipping:", zipPath, "->", destPath);
  await unzip(zipPath, destPath);

  await FileSystem.deleteAsync(zipPath, { idempotent: false })
  const filePaths = await listFilesRecursively(destPath);
  console.log("Downloaded", filePaths?.length ?? 0)
  return { dir: destPath, localFilePaths: filePaths };
}

export async function listFilesRecursively(path: string): Promise<string[]> {
  try {
    const entries = await FileSystem.readDirectoryAsync(path);
    const result: string[] = [];
    for (const entry of entries) {
      const fullPath = path + (path.endsWith("/") ? "" : "/") + entry;
      const info = await FileSystem.getInfoAsync(fullPath);
      if (info.isDirectory) {
        const sub = await listFilesRecursively(fullPath + "/");
        result.push(...sub);
      } else {
        result.push(fullPath);
      }
    }
    return result;
  } catch (e) {
    console.error(e)
    return [] as string[]
  }
}

export async function removeLocalBook(bookId: number) {
  const destPath = `${ROOT}${bookId}/`;
  try {
    // await FileSystem.deleteAsync(ROOT, { idempotent: false })
    await FileSystem.deleteAsync(destPath, { idempotent: false })
  } catch (e) {
    console.error(e)
  }
}

// Sync
export const saveProgress = async (
  bookId: number,
  fileId: number,
  progress_ms: number,
  complete: boolean,
) => {
  try {
    await Promise.all([
      setFileProgressLcl(bookId, fileId, progress_ms, complete),
      saveProgressServer(bookId, fileId, progress_ms, complete),
    ]);
    console.log(
      "Saved progress",
      bookId,
      fileId,
      formatTime(progress_ms / 1000),
      complete,
    );
  } catch (error) {
    console.error("Failed to save progress:", error);
    // Optionally rethrow if the caller should handle it
    throw error;
  }
}

export async function saveProgressServer(
  bookId: number,
  fileId: number,
  position: number,
  complete: boolean
) {
  try {
    const body = JSON.stringify({
      book_id: bookId,
      file_id: fileId,
      progress_ms: Math.floor(position),
      complete: complete,
    })

    console.log("Prog body", body)

    const response = await apiFetch("/update_progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    })

    // Add this debug log:
    console.log("Server response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json()
      console.error("Server error:", errorData)
      throw new Error(`Server returned ${response.status}`)
    }
  } catch (e) {
    console.error("Err updating progressToServer", e)
    throw e
  }
}

export async function getFileProgressServer(bookId: number, fileId: number) {
  const res = await apiFetch(
    `/get_file_progress/${bookId}/${fileId}`
  );
  if (!res.ok) return 0;

  return await res.json();
}

export async function getBookProgressServer(bookId: number) {
  const res = await apiFetch(
    `/get_book_progress/${bookId}`
  );
  if (!res.ok) return [] as ProgressRow[]; // TODO

  return await res.json() as ProgressRow[];
}
