import { getBookProgressServer, getFileProgressServer } from "../api/api";
import { FileRow, ProgressRow } from "../database/models";
import { getFileProgressLcl, getProgressForBookLcl } from "../database/sync-repo";

export interface BookProgressResult {
    q: FileRow[];
    pos: number;
}

export async function getBookProgress(
    bookId: number,
    files: FileRow[]
): Promise<BookProgressResult> {
    // Returns q, pos
    let q = files
    let pos = 0
    let progressLcl = await getProgressForBookLcl(bookId)
    let progressServer = await getBookProgressServer(bookId)

    const lclCompleteCount = completeCount(progressLcl)
    const srvrCompleteCount = completeCount(progressServer)

    if (lclCompleteCount === files.length || srvrCompleteCount === files.length) {
        console.log("Book was marked complete. Starting from beginnig")
        return { q, pos }
    }

    // If only one of the sources have progress for file
    if ((progressLcl.length === 0 && progressServer.length !== 0) || (progressLcl.length !== 0 && progressServer.length === 0)) {
        const validUpdate = progressLcl.length === 0 ? progressServer : progressLcl

        // get recent update
        const recentUpdate = findRecentUpdate(validUpdate)

        return getQms(recentUpdate, files)
    }

    // Find most recent updateon - from all files
    // Handle conflict by comparing both server and lcl updateon
    if (progressLcl.length > 0 && progressServer.length > 0) {

        const lclRecentUpdate = findRecentUpdate(progressLcl)
        const srvRecentUpdate = findRecentUpdate(progressServer)

        const recentUpdate = new Date(lclRecentUpdate.updated_at) > new Date(srvRecentUpdate.updated_at) ? lclRecentUpdate : srvRecentUpdate



        // console.log("===== Conflcit block =====")
        // console.log(lclpos.book_id)
        // console.log("lcl file", lclpos.file_id, lclpos.complete ? "complete" : "pending", formatTime(lclpos.progress_ms), lclpos.updated_at, "\n\n")
        // console.log("srv file", srvrPos.file_id, srvrPos.complete ? "complete" : "pending", formatTime(srvrPos.progress_ms), srvrPos.updated_at, "\n\n")
        // console.log("rec file", recentPos.file_id, recentPos.complete ? "complete" : "pending", formatTime(recentPos.progress_ms), recentPos.updated_at, "\n\n")
        // // console.log("rec", recentPos, new Date(lclpos.updated_at), new Date(srvrPos.updated_at), new Date(lclpos.updated_at) > new Date(srvrPos.updated_at))
        // console.log("Latest pos", formatTime(pos))
        // console.log("===== Conflcit block end =====")

        return getQms(recentUpdate, files)

    }

    return { q, pos }
}

function completeCount(progress: ProgressRow[]) {
    return progress.reduce((prev, curr) =>
        curr.complete ? prev + 1 : prev
        , 0)
}

function findRecentUpdate(progress: ProgressRow[]) { // TODO: Simplify this by getting only recent update for book
    return progress.reduce((prev, curr) =>
        new Date(prev?.updated_at) > new Date(curr?.updated_at) ? prev : curr
    )
}

function getQms(recentUpdate: ProgressRow, files: FileRow[]) {
    let q = recentUpdate.complete ? files.filter(f => f.id > recentUpdate.file_id) : files.filter(f => f.id >= recentUpdate.file_id);

    let pos = recentUpdate.complete ? 0 : recentUpdate.progress_ms;

    return { q, pos }
}

export async function getFileProgress(bookId: number, fileId: number) {
    try {
        const [progLcl, progSrvr] = await Promise.all(
            [getFileProgressLcl(bookId, fileId),
            getFileProgressServer(bookId, fileId)
            ])
        console.log(progLcl, progSrvr)
        if (!progLcl && !progSrvr) {
            return 0
        }
        else if (progLcl && progSrvr) {
            const recentUpdate = new Date(progLcl.updated_at) > new Date(progSrvr.updated_at) ? progLcl : progSrvr

            return recentUpdate.complete ? 0 : recentUpdate.progress_ms;
        }
        else {
            const recentUpdate = progLcl ? progLcl : progSrvr
            return recentUpdate.complete ? 0 : recentUpdate.progress_ms;
        }
    } catch (e) {
        console.error(e)
        return 0
    }
}