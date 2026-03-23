import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system";
import { ProgressRow } from '../database/models';
import { setFileProgressLcl } from '../database/sync-repo';
import { formatTime } from '@/utils/formatTime';
import { apiFetch } from './fetch-wrapper';
import { Directory } from 'expo-file-system';

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
      complete: Boolean(complete),
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

export async function listInProgressServer() {
  const res = await apiFetch(
    "/list_inprogress"
  )

  if (!res.ok) return [] as ProgressRow[]

  return await res.json()
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
