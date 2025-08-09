import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { getAllBooks, getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import Controls from '@/components/player/controls';
import BookInfo from '@/components/player/book-info';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { getProgressForBookLcl, setFileProgressLcl } from '@/data/database/sync-repo';
import { getBookProgressServer, saveProgressServer } from '@/data/api/api';
import { useUpdateQueue } from '@/components/hooks/useInitQueue';

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const bookId = parseInt(id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const player = useAudioPlayerStore(s => s.player)
    useUpdateQueue(player!)
    // const playerStatus = useAudioPlayerStatus(player)

    const currentBook = useAudioPlayerStore(s => s.currentBook)
    const setCurrentBook = useAudioPlayerStore(s => s.setCurrentBook)
    const setFiles = useAudioPlayerStore(s => s.setFiles)
    const setQueue = useAudioPlayerStore(s => s.setQueue)
    const setInitpos = useAudioPlayerStore(s => s.setInitpos)
    const queue = useAudioPlayerStore(s => s.queue)

    if (!player) return null;

    useEffect(() => {
        if (currentBook && currentBook.id !== bookId && queue && queue.length > 0) {
            (async () => {
                console.log("Saving current playing book progress", currentBook.title, player?.currentTime * 1000)
                await setFileProgressLcl(
                    currentBook?.id as number,
                    queue[0].id as number,
                    player?.currentTime * 1000 || player?.duration * 1000,
                    player.currentTime > player.duration - 3
                );
                await saveProgressServer(1, currentBook?.id as number, queue[0].file_id as number, Math.floor(player.currentTime * 1000), player.currentTime > player.duration - 3)
            })()
        }

        const loadBook = async () => {
            if (!bookId) {
                setError("Invalid book ID");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const bookData = await getBook(bookId)
                if (!bookData) {
                    setError(`BookId: ${bookId} not found on db`)
                    console.error(`BookId: ${bookId} not found on db`)
                    return
                }

                const files = await getFilesForBook(bookId)
                if (!files || files.length === 0) {
                    setError(`Missing files for ${bookData?.title}`)
                    console.error("Files not in localdb or files not downloaded")
                    return
                }

                setCurrentBook(bookData);
                setFiles(files)

                console.log("Fetching progress and building queue")
                let pos = 0

                let progressLcl = await getProgressForBookLcl(bookId)
                let progressServer = await getBookProgressServer(1, bookId)

                // No progress - Start book
                if (progressLcl.length === 0 && progressServer.length === 0) {
                    setQueue(files)
                    return
                }

                const lclCompleteCount = progressLcl.reduce((prev, curr) =>
                    curr.complete ? prev + 1 : prev
                    , 0)

                const srvrCompleteCount = progressServer.reduce((prev, curr) =>
                    curr.complete ? prev + 1 : prev
                    , 0)

                console.log(progressServer)

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
                    const position = validPos.reduce((prev, curr) =>
                        new Date(prev?.updated_at) > new Date(curr?.updated_at) ? prev : curr
                    )

                    const q = position.complete ? files.filter(f => f.id > position.file_id) : files.filter(f => f.id >= position.file_id)

                    pos = position.complete ? 0 : position.progress_ms
                    setQueue(q)
                    setInitpos(pos / 1000)
                    return
                }

                // Find most recent updateon - from all files
                // Handle conflict by comparing both server and lcl updateon
                if (progressLcl.length > 0 && progressServer.length > 0) {

                    const lclpos = progressLcl.reduce((prev, curr) =>
                        new Date(prev?.updated_at) > new Date(curr?.updated_at) ? prev : curr
                    )

                    const srvrPos = progressServer.reduce((prev, curr) =>
                        new Date(prev?.updated_at) > new Date(curr?.updated_at) ? prev : curr
                    )

                    const recentPos = new Date(lclpos.updated_at) > new Date(srvrPos.updated_at) ? lclpos : srvrPos
                    const q = recentPos.complete ? files.filter(f => f.id > recentPos.file_id) : files.filter(f => f.id >= recentPos.file_id)

                    pos = recentPos.complete ? 0 : recentPos.progress_ms

                    console.log("===== Conflcit block =====")
                    console.log("lcl", lclpos)
                    console.log("srv", srvrPos)
                    console.log("rec", recentPos, new Date(lclpos.updated_at), new Date(srvrPos.updated_at), new Date(lclpos.updated_at) > new Date(srvrPos.updated_at))
                    console.log("latest pos", pos)
                    console.log("===== Conflcit block end =====")

                    if (q && q.length > 0) {
                        setQueue(q)
                        setInitpos(pos / 1000)
                    }
                }
            } catch (err) {
                console.error("Error loading book:", err)
                setError("Failed to load book data.")
            } finally {
                setLoading(false)
            }
        }
        if (bookId) {
            console.log("effect running on", bookId)
            loadBook()
        }
    }, [bookId])

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    if (!currentBook) {
        return (
            <View style={styles.container}>
                <Text>Book not found.</Text>
                <TouchableOpacity onPress={async () => {
                    console.log("Get all books")
                    try {
                        console.log(await getAllBooks())
                    } catch (e) {
                        console.log(e)
                    }
                }}>
                    <MaterialIcons name='download' size={40} color="#555555" />
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <BookInfo />
            <Controls />
            <TouchableOpacity onPress={async () => console.log(await getProgressForBookLcl(bookId))}>
                <MaterialIcons name='face-2' size={40} />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#FFF',
    }
})