import { getDb } from "./initdb";
import { ProgressRow } from "./models";


export async function setFileProgressLcl(bookId: number, fileId: number, progressMs: number, complete: boolean) {
    const db = await getDb();
    try {
        await db.runAsync(
            `INSERT INTO progress (book_id, file_id, progress_ms, complete, updated_at)
     VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(file_id, book_id) DO UPDATE SET
       progress_ms = excluded.progress_ms,
       complete = excluded.complete,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
            [bookId, fileId, progressMs, complete ? 1 : 0]
        );
    } catch (e) { console.error(e) }
}
export async function setFileProgressBatch(items: { bookId: number, fileId: number; progressMs: number }[]) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        for (const { bookId, fileId, progressMs } of items) {
            await db.runAsync(
                `INSERT INTO progress (book_id, file_id, progress_ms, updated_at)
         VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT(file_id) DO UPDATE SET
           progress_ms = excluded.progress_ms,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
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
