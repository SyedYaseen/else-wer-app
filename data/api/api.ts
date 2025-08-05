import { BooksResponse } from '@/app/(tabs)';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";
import { ProgressRow } from '../database/models';

const API_URL = "http://192.168.1.3:3000/api";

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
    await AsyncStorage.removeItem('serverUrl');
    navigation.replace('Login');
}


// Books
export async function scanServerFiles() {
    await fetch(`${API_URL}/scan_files`)
}


export async function fetchBooks(): Promise<BooksResponse> {
    await scanServerFiles()
    const res = await fetch(`${API_URL}/list_books`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
}

export async function fetchFileMetaFromServer(id: number) {
    const res = await fetch(`${API_URL}/file_metadata/${id}`);
    const data = await res.json()
    return data;
}

const ROOT = FileSystem.documentDirectory + "audiobooks/";

export async function downloadAndUnzip(bookId: number) {
    const zipPath = `${ROOT}${bookId}.zip`;
    const destPath = `${ROOT}${bookId}/`;
    const url = `${API_URL}/download_book/${bookId}`

    // Ensure "books" directory exists
    await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });

    console.log("Downloading:", url, "->", zipPath);
    await FileSystem.downloadAsync(url, zipPath);

    console.log("Unzipping:", zipPath, "->", destPath);
    await unzip(zipPath, destPath);
    await FileSystem.deleteAsync(zipPath, { idempotent: false })
    const files = await listFilesRecursively(destPath);
    console.log("Downloaded", files?.length ?? 0)
    return { dir: destPath, files };
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

export async function saveProgressServer(userId: number, bookId: number, fileId: number, position: number, complete: boolean) {
    try {
        await fetch(`${API_URL}/update_progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, book_id: bookId, file_id: fileId, progress_ms: position, complete: complete }),
        })
    }
    catch (e) {
        console.error("Err updaing progressToServer", e)
    }
}

export async function getFileProgressServer(userId: number, bookId: number, fileId: number) {
    const res = await fetch(
        `${API_URL}/get_file_progress/${userId}/${bookId}/${fileId}`
    );
    if (!res.ok) return 0;

    const data = await res.json();
    return data.progress_time_marker ?? 0;
}


export async function getBookProgressServer(userId: number, bookId: number) {
    const res = await fetch(
        `${API_URL}/get_book_progress/${userId}/${bookId}`
    );
    if (!res.ok) return [] as ProgressRow[]; // TODO

    return await res.json() as ProgressRow[];
}