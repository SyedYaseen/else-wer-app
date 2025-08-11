import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router';
import { getAllBooks, getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import Controls from '@/components/player/controls';
import BookInfo from '@/components/player/book-info';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { saveProgress } from '@/data/api/api';
import { useProgressUpdate } from '@/components/hooks/useProgressUpdate';
import { getBookProgress } from '@/data/lib/conflict-handling';
export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const bookId = parseInt(id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const player = useAudioPlayerStore(s => s.player)
    useProgressUpdate(player!)

    const currentBook = useAudioPlayerStore(s => s.currentBook)
    const setCurrentBook = useAudioPlayerStore(s => s.setCurrentBook)
    const setFiles = useAudioPlayerStore(s => s.setFiles)
    const setQueue = useAudioPlayerStore(s => s.setQueue)
    const queue = useAudioPlayerStore(s => s.queue)

    if (!player) return null;

    useEffect(() => {
        /*
        1. Loads book if id from queryParam changes
        2. Save current playing (if playing) to server
        3. Loads queue for new book, handles conflicts
        4. Sets Queue for next iteration
        5. Starts playing
        */
        const savePreviousBookProgress = async () => {
            // console.log("Book switched from: ", currentBook && currentBook.title)
            // console.log("Saving previous progress", currentBook.title, formatTime(player?.currentTime), "\n")
            // console.log(queue && queue[0].id, queue[0].file_name)
            // console.log(" ")
            if (queue && queue.length > 0) {
                await saveProgress(
                    currentBook?.id as number,
                    queue[0].id as number,
                    player?.currentTime * 1000,
                    player.currentTime > player.duration - 3
                )
            }
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

                console.log("Building queue for", bookData.title)
                console.log(" ")
                const { q, pos } = await getBookProgress(bookId, files)

                setQueue(q)
                const next = q[0];
                if (next?.local_path) {
                    player?.replace(next.local_path);
                    player.seekTo(pos / 1000)
                    player?.play()
                }
            } catch (err) {
                console.error("Error loading book:", err)
                setError("Failed to load book data.")
            } finally {
                setLoading(false)
            }
        }

        if (currentBook && currentBook.id !== bookId) {
            savePreviousBookProgress()
        }

        if (!currentBook || currentBook.id !== bookId) {
            console.log("Load book: ", bookId)
            console.log(" ")
            loadBook()
        }
    }, [bookId])

    // console.log("Plyer q len", queue?.length)

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
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <BookInfo currentBook={currentBook} />
                <Controls />
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#FFF',
    }
})