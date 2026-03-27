import { getBookProgressServer, getFileProgressServer, getServerInProgress, saveProgressServer } from "../api/api";
import { getInprogressBooks, getLclInProgress } from "../database/audiobook-repo";
import { FileRow, ProgressRow } from "../database/models";
import { getFileProgressLcl, getProgressForBookLcl, setFileProgressLcl } from "../database/sync-repo";

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
    // TODO: Fix logic incase of single file books. E.g Children of Ruin
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

export async function listInProgressBooksMergeConflicts() {
  try {
    console.log("This that")
    const serverProgress = await getServerInProgress();
    console.log("Srv prog: == ", serverProgress)
    const localProgress = await getLclInProgress();
    console.log("Lcl prog: == ", localProgress)

    const serverMap = new Map(serverProgress.map(p => [p.book_id, p]));
    const localMap = new Map(localProgress.map(p => [p.book_id, p]));
    const allBookIds = new Set([...serverMap.keys(), ...localMap.keys()]) as Set<number>

    for (const book_id of allBookIds) {
      try {
        const server = serverMap.get(book_id) as ProgressRow;
        const local = localMap.get(book_id) as ProgressRow;

        if (server && local) {
          const serverWins = new Date(server.updated_at).getTime() > new Date(local.updated_at).getTime();
          if (serverWins) {
            await setFileProgressLcl(book_id, server.file_id, server.progress_ms, server.complete);
          } else {
            await saveProgressServer(book_id, local.file_id, local.progress_ms, local.complete);
          }
        } else if (local && !server) {
          await saveProgressServer(book_id, local.file_id, local.progress_ms, local.complete);
        } else if (server && !local) {
          await setFileProgressLcl(book_id, server.file_id, server.progress_ms, server.complete);
        }
      } catch (bookErr) {
        console.warn(`Merge failed for book ${book_id}, skipping`, bookErr);
        // continue to next book_id
      }
    }



    return await getInprogressBooks();
  }
  catch (ex) {
    console.error("Failed", ex)
  }
}