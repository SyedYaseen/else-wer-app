import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system";
import { ProgressRow } from '../database/models';
import { saveProgressLcl } from '../database/sync-repo';
import { formatTime } from '@/utils/formatTime';
import { apiFetch } from './fetch-wrapper';
import { Directory } from 'expo-file-system';
import { useNetworkState } from '@/components/store/network-store';

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


export async function getServerBooks() {
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

export async function listFilesRecursively(path: string): Promise<string[]> {
  try {
    const dir = new Directory(path);
    const entries = dir.list();
    const result: string[] = [];

    for (const entry of entries) {
      if (entry instanceof Directory) {
        const sub = await listFilesRecursively(entry.uri);
        result.push(...sub);
      } else {
        result.push(entry.uri);
      }
    }
    return result;
  } catch (e) {
    console.error('Error listing files:', e);
    return [];
  }
}

export async function removeLocalBook(bookId: number) {
  const destDir = FileSystem.Paths.join(FileSystem.Paths.document, "audiobooks", bookId.toString());
  console.log("Dir to delete", destDir)
  try {
    const dir = new FileSystem.Directory(destDir)
    dir.delete()
  } catch (e) {
    console.error(e)
  }
}

export async function removeAllLocalBooks() {
  const destDir = FileSystem.Paths.join(FileSystem.Paths.document, "audiobooks");
  console.log("Deleting all local media", destDir)
  try {
    const dir = new FileSystem.Directory(destDir)
    dir.delete()
  } catch (e) {
    console.error(e)
  }
}

// Sync

// Unified "chapter complete" threshold — a file is considered finished once
// playback is within this many seconds of its end. Kept in one place because
// this used to drift between call sites (some used duration-3, others duration-5).
export const COMPLETION_THRESHOLD_SEC = 3;

// Network calls here have no timeout by default, which can leave callers'
// in-flight guards (e.g. useProgressUpdate's isSavingRef) stuck forever.
const SAVE_PROGRESS_TIMEOUT_MS = 8000;

export function isFileComplete(currentTimeSec: number, durationSec: number) {
  return durationSec > 0 && currentTimeSec > durationSec - COMPLETION_THRESHOLD_SEC;
}

export const saveProgress = async (
  bookId: number,
  fileId: number,
  progress_ms: number,
  complete: boolean,
) => {
  const isOnline = useNetworkState.getState().isOnline;
  try {

    await saveProgressLcl(bookId, fileId, progress_ms, complete)
    if (isOnline) await saveProgressServer(bookId, fileId, progress_ms, complete)

    console.log(
      "Saved progress",
      bookId,
      fileId,
      formatTime(progress_ms / 1000),
      complete,
    );
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}

// Shared shape for the common "save at current position, complete decided by
// the unified threshold" call — dedupes what used to be copy-pasted per call site.
export const saveProgressSec = async (
  bookId: number,
  fileId: number,
  currentTimeSec: number,
  durationSec: number,
) => saveProgress(bookId, fileId, currentTimeSec * 1000, isFileComplete(currentTimeSec, durationSec));

// Books the server has told us it will never accept progress for again (404 —
// book/file no longer exists server-side). Kept in memory only: cleared on
// app restart, so a book that reappears server-side recovers automatically.
// Local saves are unaffected — this only stops the noisy, pointless server
// sync retries for a book that's permanently gone.
const rejectedBookIds = new Set<number>();

export async function saveProgressServer(
  bookId: number,
  fileId: number,
  position: number,
  complete: boolean
) {
  const isOnline = useNetworkState.getState().isOnline;
  if (!isOnline) return
  if (rejectedBookIds.has(bookId)) return

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SAVE_PROGRESS_TIMEOUT_MS);

  try {
    const body = JSON.stringify({
      book_id: bookId,
      file_id: fileId,
      progress_ms: Math.floor(position),
      complete: Boolean(complete),
    })

    const response = await apiFetch("/update_progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    })

    if (response.status === 404) {
      rejectedBookIds.add(bookId);
      console.error(`Server no longer recognizes book ${bookId} — stopping server sync for it this session`);
    } else if (!response.ok) {
      console.error("Server error")
    }
  } catch (e) {
    console.error("Err updating progressToServer", e)
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getServerInProgress() {
  const isOnline = useNetworkState.getState().isOnline;
  if (!isOnline) return [] as ProgressRow[]
  try {
    const res = await apiFetch(
      "/list_inprogress"
    )

    if (!res.ok) return [] as ProgressRow[]

    return await res.json()
  }
  catch {
    return [] as ProgressRow[]
  }
}

export async function getFileProgressServer(bookId: number, fileId: number) {
  const isOnline = useNetworkState.getState().isOnline;
  if (!isOnline) return 0

  const res = await apiFetch(
    `/get_file_progress/${bookId}/${fileId}`
  );
  if (!res.ok) return 0;

  return await res.json();
}

export async function getBookProgressServer(bookId: number) {
  const isOnline = useNetworkState.getState().isOnline;
  if (!isOnline) return [] as ProgressRow[]

  const res = await apiFetch(
    `/get_book_progress/${bookId}`
  );
  if (!res.ok) return [] as ProgressRow[]; // TODO

  return await res.json() as ProgressRow[];
}
