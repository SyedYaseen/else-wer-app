import { useNetworkState } from "@/components/store/network-store";
import { getBookProgressServer, getFileProgressServer, getServerInProgress, saveProgress, saveProgressServer } from "../api/api";
import { getInprogressBooks, getLclInProgress } from "../database/audiobook-repo";
import { FileRow, ProgressRow } from "../database/models";
import { getFileProgressLcl, getProgressForBookLcl, saveProgressLcl } from "../database/sync-repo";

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
    // Add a start over button that would remove all rows from progress? But make sure it foesnt affect listening stats
    console.log("Book was marked complete. Starting from beginnig")
    return { q, pos }
  }

  // Find most recent updateon - from all files
  // Handle conflict by comparing both server and lcl updateon
  if (progressLcl.length > 0 && progressServer.length > 0) {

    const lclRecentUpdate = findRecentUpdate(progressLcl)
    const srvRecentUpdate = findRecentUpdate(progressServer)

    const recentUpdate = new Date(lclRecentUpdate.updated_at) > new Date(srvRecentUpdate.updated_at) ? lclRecentUpdate : srvRecentUpdate

    return getQms(recentUpdate, files)
  }

  // If only one of the sources have progress for file
  if (progressLcl.length > 0 || progressServer.length > 0) {
    const validUpdate = progressLcl.length === 0 ? progressServer : progressLcl
    const recentUpdate = findRecentUpdate(validUpdate)

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

function createProgressMap(progress: ProgressRow[]) {
  const progressMap = new Map<number, ProgressRow[]>()
  progress.forEach(p => {
    if (!progressMap.has(p.book_id)) {
      progressMap.set(p.book_id, [p])
    } else {
      progressMap.get(p.book_id)!.push(p)
    }
  })
  return progressMap
}

export async function listInProgressBooksMergeConflicts() {
  try {
    const serverProgress = await getServerInProgress();
    const localProgress = await getLclInProgress();

    const serverMap = createProgressMap(serverProgress)
    const localMap = createProgressMap(localProgress)
    const allBookIds = new Set([...serverMap.keys(), ...localMap.keys()]) as Set<number>

    for (const book_id of allBookIds) {
      try {
        const server = serverMap.get(book_id);
        const local = localMap.get(book_id);

        if (server && local) {
          const lclRecentUpdate = findRecentUpdate(local)
          const srvRecentUpdate = findRecentUpdate(server)

          let recentUpdate: ProgressRow;

          if (new Date(lclRecentUpdate.updated_at) > new Date(srvRecentUpdate.updated_at)) {
            recentUpdate = lclRecentUpdate
            await saveProgressServer(book_id, recentUpdate.file_id, recentUpdate.progress_ms, recentUpdate.complete)
          } else if (new Date(lclRecentUpdate.updated_at) < new Date(srvRecentUpdate.updated_at)) {
            recentUpdate = srvRecentUpdate
            await saveProgressLcl(book_id, recentUpdate.file_id, recentUpdate.progress_ms, recentUpdate.complete);
          }
        } else if (server && !local) {
          const recentUpdate = findRecentUpdate(server)
          await saveProgressLcl(book_id, recentUpdate.file_id, recentUpdate.progress_ms, recentUpdate.complete);
        } else if (!server && local) {
          const recentUpdate = findRecentUpdate(local)
          await saveProgressServer(book_id, recentUpdate.file_id, recentUpdate.progress_ms, recentUpdate.complete);
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

