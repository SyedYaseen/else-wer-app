import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { getAllBooks, getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { Audiobook, FileRow, } from '@/data/database/models';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/components/hooks/useAudioplayer';
import { Audio } from "expo-av";
import { getProgressForBookLcl } from '@/data/database/sync-repo';
import { getBookProgressServer } from '@/data/api/api';
import { getDb } from '@/data/database/initdb';

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [book, setBook] = useState<Audiobook | null>(null)
    const [files, setFiles] = useState<FileRow[]>([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const player = useAudioPlayer()

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

        if (isMounted)
            loadData();

        return () => { isMounted = false }
    }, [id]);


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
    // if (!book) {
    //     return (
    //         <View style={styles.container}>
    //             <Text>Book not found.</Text>
    //             <TouchableOpacity onPress={async () => {
    //                 console.log("Running diagnostics...");

    //                 // 1. Check database connection
    //                 try {
    //                     const db = await getDb();
    //                     console.log("Database connection:", db ? "OK" : "FAILED");
    //                 } catch (e) {
    //                     console.log("Database connection error:", e);
    //                 }

    //                 // 2. Check if table exists
    //                 try {
    //                     const db = await getDb();
    //                     const tables = await db.getAllAsync(
    //                         "SELECT name FROM sqlite_master WHERE type='table'"
    //                     );
    //                     console.log("Tables in database:", tables);
    //                 } catch (e) {
    //                     console.log("Table check error:", e);
    //                 }

    //                 // 3. Check if any books exist
    //                 try {
    //                     const allBooks = await getAllBooks();
    //                     console.log("All books in database:", allBooks);
    //                 } catch (e) {
    //                     console.log("Get all books error:", e);
    //                 }
    //             }}>
    //                 <Text>Run Diagnostics</Text>
    //             </TouchableOpacity>
    //         </View>
    //     );
    // }

    const handlePlay = async () => {
        try {
            if (files.length === 0) {
                console.error("Files not in localdb or files not downloaded")
            }

            const lastPosLcl = await getProgressForBookLcl(book.id)
            const lastPosServer = await getBookProgressServer(1, book.id)

            // if (lastPosLcl.length === 0 && lastPosServer.length === 0) { // Book start
            const firstFile = files[0]
            await player.playUri(firstFile.local_path as string, firstFile.book_id, firstFile.id, firstFile.file_id, 0);
            // } 
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