import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { getBookProgressServer, saveProgressServer } from '@/data/api/api';
import { getProgressForBookLcl, setFileProgressLcl } from '@/data/database/sync-repo';


export function useAudioController() {
    const player = useAudioPlayer();
    const playerStatus = useAudioPlayerStatus(player);

    const { currentBook, setCurrentBook, queue, setQueue, popQueue, clearQueue, files, setFiles, clearFiles } = useAudioPlayerStore()

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);

    const loadBook = async (id: string) => {
        console.log("loading book")
        const bookId = parseInt(id);

        if (isNaN(bookId)) {
            setError("Invalid book ID");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [bookData, bookFiles] = await Promise.all([
                getBook(bookId),
                getFilesForBook(bookId),
            ])

            setCurrentBook(bookData);
            setFiles(bookFiles);

            if (files && files.length > 0) {
                await loadQueue()
            }
            // await Audio.setAudioModeAsync({
            //     playsInSilentModeIOS: true,
            //     staysActiveInBackground: false,
            // })
        } catch (err) {
            console.error("Error loading book:", err);
            setError("Failed to load book data.");
        } finally {
            setLoading(false);
        }

    }

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

        if (queue && queue.length > 0) {
            player.replace(queue[0].local_path as string)
            player.seekTo(pos / 1000)
        }
    }

    const rewind = () => {
        console.log("Rewind 10s")
    }

    const fastForward = () => {
        console.log("Forward 10s")
    }

    const onPlay = async () => {
        try {
            if (queue && queue.length > 0) {

                if (player.playing) {
                    player.pause()


                    await setFileProgressLcl(
                        currentBook?.id as number,
                        queue[0].id as number,
                        playerStatus.currentTime * 1000,
                    );
                    await saveProgressServer(1, currentBook?.id as number, queue[0].id as number, playerStatus.currentTime * 1000, false)

                    console.log("save compelte")
                } else {
                    console.log(playerStatus)
                    if (!playerStatus.isLoaded) { // Book already exists so just resume
                        player.replace(queue[0].local_path as string)
                        console.log("time at resume", playerStatus.currentTime)
                    }
                    player.play()
                }

                // player.addListener("playbackStatusUpdate", (status) => { console.log(status) })

                // { "currentTime": 7.89900016784668, "didJustFinish": false, "duration": 1034.2919921875, "id": "31544065-4674-4fec-81df-41e826b4d07e", "isBuffering": false, "isLoaded": true, "loop": false, "mute": false, "playbackRate": 1, "playbackState": "ready", "playing": true, "reasonForWaitingToPlay": null, "shouldCorrectPitch": false, "timeControlStatus": "playing" }

            }
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        if (!player) return
        if (!playerStatus?.didJustFinish) return

        console.log("jere", playerStatus)

        popQueue()
        if (queue && queue.length > 0) {
            const next = queue[0];
            if (next?.local_path) {
                player.replace(next.local_path);
                player.play();
            }
            console.log("Save after file complete")
        }


    }, [playerStatus?.didJustFinish])

    return { player, playerStatus, onPlay, loadBook, loading, error, currentBook, fastForward, rewind }
}