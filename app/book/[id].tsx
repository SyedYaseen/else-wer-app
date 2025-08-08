import LoadingSpinner from '@/components/common/loading-spinner';
import { ROOT } from '@/constants/constants';
import { API_URL, downloadAndUnzip, fetchFileMetaFromServer, getBookProgressServer, listFilesRecursively, removeLocalBook as removeDownloadedBook } from '@/data/api/api';
import { deleteBookDb, getBook, getFilesForBook, markBookDownloaded, upsertFiles } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router'
import { FileRow } from '@/data/database/models';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { getProgressForBookLcl } from '@/data/database/sync-repo';
type BookParams = {
    id: string;
    title: string;
    author: string;
};

export default function BookDetails() {
    const { id, title, author } = useLocalSearchParams<BookParams>();
    const bookId = parseInt(id);
    const { player, currentBookId, setCurrentBookId, currentBook, setCurrentBook, queue, setQueue, files, setFiles, setInitpos } = useAudioPlayerStore()

    const [isDownloading, setIsDownloading] = useState(false)
    const [isDownloaded, setIsDownloaded] = useState(false)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const router = useRouter()

    // const setCurrentBookId = useAudioPlayerStore(s => s.setCurrentBookId)
    // const setFiles = useAudioPlayerStore(s => s.setFiles)
    // const setCurrentBook = useAudioPlayerStore(s => s.setCurrentBook)
    // const currentBook = useAudioPlayerStore(s => s.currentBook)

    // Check for files in fs and check in db

    // useEffect(() => {
    //     let isMounted = true;

    //     const fetchFiles = async () => {
    //         const files = await getFilesForBook(bookId);
    //         if (isMounted && files?.length) {
    //             setIsDownloaded(true)
    //         }
    //     };

    //     fetchFiles()

    //     return () => { isMounted = false; }
    // }, [bookId]);

    // Load book
    useEffect(() => {
        const loadBook = async () => {
            console.log("loading book")
            const bookId = parseInt(id);
            setCurrentBookId(bookId)

            if (!bookId) {
                setError("Invalid book ID");
                setLoading(false);
                return;
            }



            try {
                setLoading(true);
                setError(null);

                const [bookData, files] = await Promise.all([
                    getBook(bookId),
                    getFilesForBook(bookId),
                ])

                setCurrentBook(bookData);

                if (files && files.length) {
                    setFiles(files)
                    setIsDownloaded(true)

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
                        getProgressForBookLcl(bookId),
                        getBookProgressServer(1, bookId)
                    ])

                    if (progressLcl.length === 0 && progressServer.length === 0) { // Book start
                        setQueue(files)
                        return
                    }

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
                        const position = validPos.reduce((prev, curr) =>
                            new Date(prev?.updated_at) < new Date(curr?.updated_at) ? prev : curr
                        )


                        const q = position.complete ? files.filter(f => f.id > position.file_id) : files.filter(f => f.id >= position.file_id)
                        // customPlayer.position = pos.complete ? 0 : pos.progress_ms
                        pos = position.complete ? 0 : position.progress_ms
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

            } catch (err) {
                console.error("Error loading book:", err)
                setError("Failed to load book data.")
            } finally {
                setLoading(false)
            }
        }
        if (id && !player?.playing && !player?.paused)
            loadBook()
    }, [id])




    const handleDownload = async () => {
        try {
            await handleDelete()

            setIsDownloading(true);
            const { data: fileRows, count }: { data: FileRow[], count: number } = await fetchFileMetaFromServer(bookId)

            const { localFilePaths } = await downloadAndUnzip(bookId);

            fileRows?.forEach(fr => {
                fr.local_path = localFilePaths.find(f => fr.file_name && f.endsWith(fr.file_name))
            })

            currentBook!.downloaded = 1
            setCurrentBook(currentBook)
            await upsertFiles(fileRows)
            markBookDownloaded(bookId, `${ROOT}${bookId}/`)
            setIsDownloaded(true)
            setFiles(fileRows)
        } catch (err) {
            console.error(`Failed to download ${bookId}:`, err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteBookDb(bookId)
            await removeDownloadedBook(bookId)
            setIsDownloaded(false)
        } catch (err) {
            console.error(`Failed to delete ${bookId}:`, err);
        }
    }

    const handlePlay = async () => {
        router.push(`/player/${id}`)
    }

    return (
        <View style={styles.container}>
            <View style={styles.coverContainer}>
                <Image
                    source={{
                        uri: `${API_URL}${currentBook?.cover_art}`
                    }}
                    style={styles.coverImage}
                />
            </View>

            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{title}</Text>
                    <Text style={styles.authorText}>{author}</Text>
                </View>
                <View style={styles.actions}>
                    {isDownloading && <LoadingSpinner />}
                    {!isDownloaded && !isDownloading ?
                        <TouchableOpacity onPress={handleDownload}>
                            <MaterialIcons name='download' size={40} color="#555555" />
                        </TouchableOpacity> :

                        <TouchableOpacity onPress={handlePlay}>
                            <MaterialIcons name='play-circle' size={40} color="#555555" />
                        </TouchableOpacity>
                    }
                    {/* <TouchableOpacity onPress={() => console.log("Completed...")}>
                        <MaterialIcons name='check-circle' size={40} color="#555555" />
                    </TouchableOpacity> */}
                    <TouchableOpacity onPress={handleDelete}>
                        <MaterialIcons name='delete' size={40} color="#FF5522" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.descriptionText}>
                    The Hobbit is set in Middle-earth and follows home-loving Bilbo Baggins, the titular hobbit who joins the wizard Gandalf and the thirteen dwarves of Thorin's Company on a quest to reclaim the dwarves' home and treasure from the dragon Smaug.
                </Text>
            </View>
        </View>
    );
};

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 5,
        paddingBottom: 15,
        paddingHorizontal: 16,
    },
    titleContainer: {
        flex: 1,
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
        flexDirection: 'row',
        gap: 12,
    },
    descriptionContainer: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    descriptionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
    },
});