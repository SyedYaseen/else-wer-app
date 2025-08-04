import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { getAllBooks, getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { Audiobook, FileRow, ProgressRow, } from '@/data/database/models';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayerCustomHook } from '@/components/hooks/useAudioplayerCustom';
import { Audio } from "expo-av";
import { getProgressForBookLcl } from '@/data/database/sync-repo';
import { getBookProgressServer } from '@/data/api/api';

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [book, setBook] = useState<Audiobook | null>(null)
    const [files, setFiles] = useState<FileRow[]>([])
    const [queue, setQueue] = useState<FileRow[]>([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const player = useAudioPlayerCustomHook()


    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!id) return;

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

                setBook(bookData);
                setFiles(bookFiles);


                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                })
            } catch (err) {
                console.error("Error loading book:", err);
                setError("Failed to load book data.");
            } finally {
                setLoading(false);
            }
        };

        if (isMounted) {
            loadData()
        }

        return () => { isMounted = false }
    }, [id]);


    useEffect(() => {
        const handleQueue = async () => {

            if (files.length === 0) {
                console.error("Files not in localdb or files not downloaded")
                return
            }
            if (!book) {
                console.error("Trouble loading selected book")
                return;
            }
            const [progressLcl, progressServer] = await Promise.all([
                getProgressForBookLcl(book.id),
                getBookProgressServer(1, book.id)
            ])

            if (progressLcl.length === 0 && progressServer.length === 0) { // Book start
                setQueue(files)
                player.position = 0
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
                const pos = validPos.reduce((prev, curr) =>
                    new Date(prev?.updated_at) < new Date(curr?.updated_at) ? prev : curr
                )


                const q = pos.complete ? files.filter(f => f.id > pos.file_id) : files.filter(f => f.id >= pos.file_id)
                player.position = pos.complete ? 0 : pos.progress_ms
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
            player.position = recentPos.complete ? 0 : recentPos.progress_ms
            setQueue(q)

        }

        if (files.length > 0) {
            handleQueue();
        }
    }, [files])


    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    if (!book) {
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
        );
    }


    const handlePlay = async () => {
        console.log(queue[0], player.position)

        try {
            if (queue.length > 0) {
                await player.playUri(queue[0].local_path as string, queue[0].book_id, queue[0].id, queue[0].file_id, player.position)
            }
        } catch (e) {
            console.log(e)
        }
    }

    const handleRewind = () => {
        console.log("Rewind 10s")
    }

    const handleFastForward = () => {
        console.log("Forward 10s")
    }


    return (
        <View style={styles.container}>
            <View style={styles.coverContainer}>
                <Image
                    source={{
                        uri: 'https://www.thebookdesigner.com/wp-content/uploads/2023/12/The-Hobbit-Book-Cover-Minimalistic-Mountains.png?channel=Organic&medium=Google%20-%20Search'
                    }}
                    style={styles.coverImage}
                />
            </View>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{book.title}</Text>
                    <Text style={styles.authorText}>{book.author}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={handleRewind}>
                    <MaterialIcons name='fast-rewind' size={40} color="#555555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePlay}>
                    <MaterialIcons
                        name={player.isPlaying ? "pause-circle" : "play-circle"}
                        size={80}
                        color="#555555"
                        style={{ marginRight: 8 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFastForward}>
                    <MaterialIcons name='fast-forward' size={40} color="#555555" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={async () => await getAllBooks()}>
                <MaterialIcons name='download' size={40} color="#555555" />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#FFF',
    },
    coverContainer: {
        height: 300,
        width: '100%',
    },
    coverImage: {
        flex: 1,
        width: null,
        height: null,
        resizeMode: 'contain',
    },
    header: {
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 15,
        paddingHorizontal: 16,
    },
    titleContainer: {
        margin: 'auto',
        alignItems: 'center'
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    authorText: {
        fontSize: 18,
        color: '#666',
    },
    actions: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 40,
    },
})