import { getBookProgressServer } from "@/data/api/api";
import { getBook, getFilesForBook } from "@/data/database/audiobook-repo";
import { getProgressForBookLcl } from "@/data/database/sync-repo";
import { useEffect, useState } from "react";
import { useAudioPlayerStore } from "../store/audio-player-store";

export default function useInitQueue() {
    const { currentBookId, currentBook, setCurrentBook, queue, setQueue, files, setFiles, setInitpos } = useAudioPlayerStore()

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);

    // Load book
    useEffect(() => {
        const loadBook = async () => {
            console.log("loading book")

            if (!currentBookId) {
                setError("Invalid book ID");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const [bookData, bookFiles] = await Promise.all([
                    getBook(currentBookId),
                    getFilesForBook(currentBookId),
                ])

                setCurrentBook(bookData);
                setFiles(bookFiles);
            } catch (err) {
                console.error("Error loading book:", err)
                setError("Failed to load book data.")
            } finally {
                setLoading(false)
            }
        }
        if (currentBookId)
            loadBook()
    }, [currentBookId])

    // Load inital queue
    useEffect(() => {
        const loadQueue = async () => {
            console.log("loading queue and fetching progress")
            let pos = 0

            if (!files || files.length === 0) {
                setError("Missing files")
                console.error("Files not in localdb or files not downloaded")
                return
            }

            if (!currentBook) {
                console.error("Trouble loading selected book")
                return;
            }

            const [progressLcl, progressServer] = await Promise.all([
                getProgressForBookLcl(currentBook.id),
                getBookProgressServer(1, currentBook.id)
            ])

            if (progressLcl.length === 0 && progressServer.length === 0) { // Book start
                setQueue(files)
                return
            }

            // let progLclIncomplete: ProgressRow[] = []
            // let progLclComplete: ProgressRow[] = []

            // let progSrvrIncomplete: ProgressRow[] = []
            // let progSrvrComplete: ProgressRow[] = []

            // progressLcl.forEach(p => p.complete ? progLclComplete.push(p) : progLclIncomplete.push(p))
            // progressServer.forEach(p => p.complete ? progSrvrComplete.push(p) : progSrvrIncomplete.push(p))

            const lclCompleteCount = progressLcl.reduce((prev, curr) =>
                curr.complete ? prev + 1 : prev
                , 0)

            const srvrCompleteCount = progressServer.reduce((prev, curr) =>
                curr.complete ? prev + 1 : prev
                , 0)


            // If book was marked complete - Ideally this shouldnt happen here, but you never know
            if (lclCompleteCount === files.length || srvrCompleteCount === files.length) {
                console.log("Book was marked complete. Starting from beginnig")
                setQueue(files)
                return
            }

            // If only one of the sources have progress for file
            if ((progressLcl.length === 0 && progressServer.length !== 0) || (progressLcl.length !== 0 && progressServer.length === 0)) {
                const validPos = progressLcl.length === 0 ? progressServer : progressLcl

                // get recent update
                const posisiton = validPos.reduce((prev, curr) =>
                    new Date(prev?.updated_at) < new Date(curr?.updated_at) ? prev : curr
                )


                const q = posisiton.complete ? files.filter(f => f.id > posisiton.file_id) : files.filter(f => f.id >= posisiton.file_id)
                // customPlayer.position = pos.complete ? 0 : pos.progress_ms
                pos = posisiton.complete ? 0 : posisiton.progress_ms
                setQueue(q)
                return
            }

            // Find most recent updateon - from all files
            // Handle conflict by comparing both server and lcl updateon

            const lclpos = progressLcl.reduce((prev, curr) =>
                new Date(prev?.updated_at) < new Date(curr?.updated_at) ? prev : curr
            )

            const srvrPos = progressServer.reduce((prev, curr) =>
                new Date(prev?.updated_at) < new Date(curr?.updated_at) ? prev : curr
            )

            const recentPos = new Date(lclpos.updated_at) > new Date(srvrPos.updated_at) ? lclpos : srvrPos
            const q = recentPos.complete ? files.filter(f => f.id > recentPos.file_id) : files.filter(f => f.id >= recentPos.file_id)

            pos = recentPos.complete ? 0 : recentPos.progress_ms
            setQueue(q)

            if (queue && queue.length > 0 && pos !== 0) {
                // player.replace(queue[0].local_path as string)
                setInitpos(pos / 1000)
            }
        }

        if (files && files.length > 0) {
            loadQueue()
        }
    }, [files])

}