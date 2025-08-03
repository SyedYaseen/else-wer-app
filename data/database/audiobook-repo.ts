import { getDb } from "./initdb";
import { Audiobook, FileRow } from "./models";


export async function upsertAudiobook(book: Audiobook) {
    const db = await getDb();
    await db.runAsync(
        `INSERT OR REPLACE INTO audiobooks
      (id, author, series, title, cover_art, local_path, metadata, downloaded)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            book.id,
            book.author,
            book.series ?? null,
            book.title,
            book.cover_art ?? null,
            book.local_path ?? null,
            book.metadata ?? null,
            book.downloaded ?? 0,
        ]
    );
}

export async function upsertAudiobooks(books: Audiobook[]) {
    let db = await getDb()

    await db.withTransactionAsync(async () => {
        for (const b of books) {
            await db.runAsync(
                `INSERT OR REPLACE INTO audiobooks
          (id, author, series, title, cover_art, local_path, metadata, downloaded)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    b.id,
                    b.author,
                    b.series ?? null,
                    b.title,
                    b.cover_art ?? null,
                    b.local_path ?? null,
                    b.metadata ?? null,
                    b.downloaded ?? 0,
                ]
            );
        }
    });
}


export async function upsertFiles(files: FileRow[]) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        for (const f of files) {
            await db.runAsync(
                `INSERT OR REPLACE INTO files
          (id, book_id, file_id, file_name, local_path, duration, channels, sample_rate, bitrate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    f.id,
                    f.book_id,
                    f.file_id,
                    f.file_name,
                    f.local_path ?? null,
                    f.duration ?? null,
                    f.channels ?? null,
                    f.sample_rate ?? null,
                    f.bitrate ?? null,
                ]
            );
        }
    });
}


export async function markBookDownloaded(bookId: number, localPath: string) {
    const db = await getDb();
    await db.runAsync(
        `UPDATE audiobooks SET downloaded = 1, local_path = ? WHERE id = ?`,
        [localPath, bookId]
    );
}

export async function getAllBooks(): Promise<Audiobook[]> {
    const db = await getDb();
    try {
        return db.getAllAsync<Audiobook>(`SELECT * FROM audiobooks ORDER BY id ASC`);
    } catch (e) {
        console.log(e)
        return [] as Audiobook[]
    }
}

export async function getBook(bookId: number): Promise<Audiobook | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Audiobook>(
        `SELECT * FROM audiobooks WHERE id = ? LIMIT 1`,
        [bookId]
    );
    return row;
}

export async function getFilesForBook(bookId: number): Promise<FileRow[]> {
    const db = await getDb();
    return db.getAllAsync<FileRow>(
        `SELECT * FROM files WHERE book_id = ? ORDER BY file_name ASC`,
        [bookId]
    );
}

export async function getFile(fileId: number): Promise<FileRow | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<FileRow>(
        `SELECT * FROM files WHERE id = ? LIMIT 1`,
        [fileId]
    );
    return row ?? null;
}

export async function deleteBookDb(bookId: number) {
    try {
        const db = await getDb();
        await db.runAsync(`DELETE FROM files where book_id = ?`, [bookId])
        // await db.runAsync(`DELETE FROM audiobooks WHERE id = ?`, [bookId]);
        // files + progress are deleted via FK cascade
    } catch (e) {
        console.error(e)
    }
}

export async function searchBooks(query: string): Promise<Audiobook[]> {
    const db = await getDb();
    const q = `%${query}%`;
    return db.getAllAsync<Audiobook>(
        `SELECT * FROM audiobooks
     WHERE title LIKE ? OR author LIKE ? OR series LIKE ?
     ORDER BY title ASC`,
        [q, q, q]
    );
}

