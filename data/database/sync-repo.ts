import { getDb } from "./initdb";
import { ProgressRow } from "./models";


export async function setFileProgress(bookId: number, fileId: number, progressMs: number) {
    const db = await getDb();
    try {
        await db.runAsync(
            `INSERT INTO progress (book_id, file_id, progress_ms, last_updated)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(file_id, book_id) DO UPDATE SET
       progress_ms = excluded.progress_ms,
       last_updated = CURRENT_TIMESTAMP`,
            [bookId, fileId, progressMs]
        );
    } catch (e) { console.error(e) }
}
export async function setFileProgressBatch(items: { bookId: number, fileId: number; progressMs: number }[]) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        for (const { bookId, fileId, progressMs } of items) {
            await db.runAsync(
                `INSERT INTO progress (book_id, file_id, progress_ms, last_updated)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(file_id) DO UPDATE SET
           progress_ms = excluded.progress_ms,
           last_updated = CURRENT_TIMESTAMP`,
                [bookId, fileId, progressMs]
            );
        }
    });
}

export async function getProgressForBookLcl(bookId: number) {
    const db = await getDb();
    return db.getAllAsync<
        ProgressRow
    >(
        `SELECT  book_id, file_id, progress_ms, complete, updated_at
     FROM progress     
     WHERE book_id = ?`,
        [bookId]
    );
}

export async function getFileProgress(bookId: number, fileId: number): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ progress_ms: number }>(
        `SELECT progress_ms FROM progress WHERE book_id = ? AND file_id = ? LIMIT 1`,
        [bookId, fileId]
    );
    return row?.progress_ms ?? 0;
}
