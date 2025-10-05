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