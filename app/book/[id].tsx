import { ROOT } from '@/constants/constants';
import { downloadAndUnzip, fetchBookFilesData, listFilesRecursively, removeLocalBook } from '@/data/api';
import { deleteBook, FileRow, getFilesForBook, markBookDownloaded, upsertFiles } from '@/data/db';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';

type BookParams = {
    id: string;
    title: string;
    author: string;
};

export default function BookDetails() {
    const { id, title, author } = useLocalSearchParams<BookParams>();
    const bookId = parseInt(id);
    const [isDownloading, setIsDownloading] = useState(false)
    const [isDownloaded, setIsDownloaded] = useState(false)
    const [files, setFiles] = useState<FileRow[]>()
    useEffect(() => {
        let isMounted = true;

        const fetchFiles = async () => {
            const files = await getFilesForBook(bookId);
            console.log("From db", files)
            if (isMounted && files?.length) {
                setIsDownloaded(true)
            }
        };

        fetchFiles()
        // const fetchFilesFromFs = async () => {
        //     const destPath = `${ROOT}${bookId}/`
        //     console.log(destPath)
        //     const files = await listFilesRecursively(destPath)
        //     if (isMounted && files?.length) {
        //         setIsDownloaded(true)
        //     }
        //     return files
        // }

        // fetchFilesFromFs().then(f => console.log(f))
        return () => { isMounted = false; }
    }, [bookId]);

    const handleDownload = async () => {
        try {
            await handleDelete(bookId)

            setIsDownloading(true);

            const { data } = await fetchBookFilesData(bookId)
            const fileRows: FileRow[] = data
            const { files } = await downloadAndUnzip(bookId);
            fileRows?.map(fr => {
                fr.local_path = files.find(f => fr.file_path && f.endsWith(fr.file_path))
            })

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

    const handleDelete = async (bookId: number) => {
        try {
            await deleteBook(bookId)
            await removeLocalBook(bookId)
            setIsDownloaded(false)
        } catch (err) {
            console.error(`Failed to delete ${bookId}:`, err);
        }
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
                    <Text style={styles.titleText}>{title}</Text>
                    <Text style={styles.authorText}>{author}</Text>
                </View>
                <View style={styles.actions}>
                    {!isDownloaded ?
                        <TouchableOpacity onPress={handleDownload}>
                            <MaterialIcons name='download' size={40} color="#555555" />
                        </TouchableOpacity> :

                        <TouchableOpacity onPress={() => console.log("Playing...")}>
                            <MaterialIcons name='play-circle' size={40} color="#555555" />
                        </TouchableOpacity>}
                    <TouchableOpacity onPress={() => console.log("Completed...")}>
                        <MaterialIcons name='check-circle' size={40} color="#555555" />
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