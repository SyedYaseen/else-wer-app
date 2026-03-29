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
export const saveProgress = async (
  bookId: number,
  fileId: number,
  progress_ms: number,
  complete: boolean,
) => {
  const isOnline = useNetworkState.getState().isOnline;
  try {
    const tasks = [saveProgressLcl(bookId, fileId, progress_ms, complete)]
    if (isOnline) tasks.push(saveProgressServer(bookId, fileId, progress_ms, complete))

    await Promise.all(tasks);

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

export async function saveProgressServer(
  bookId: number,
  fileId: number,
  position: number,
  complete: boolean
) {
  const isOnline = useNetworkState.getState().isOnline;
  if (!isOnline) return

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
      body
    })

    if (!response.ok) {
      console.error("Server error")
    }
  } catch (e) {
    console.error("Err updating progressToServer", e)
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
