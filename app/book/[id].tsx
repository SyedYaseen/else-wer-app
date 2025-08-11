import LoadingSpinner from '@/components/common/loading-spinner';
import { ROOT } from '@/constants/constants';
import { API_URL, downloadAndUnzip, fetchFileMetaFromServer, listFilesRecursively, removeLocalBook as removeDownloadedBook } from '@/data/api/api';
import { deleteBookDb, getBook, getFilesForBook, markBookDownloaded, upsertFiles } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router'
import { Audiobook, FileRow } from '@/data/database/models';

type BookParams = {
    id: string;
    title: string;
    author: string;
};

export default function BookDetails() {
    const { id, title, author } = useLocalSearchParams<BookParams>();
    const bookId = parseInt(id);
    const [book, setBook] = useState<Audiobook>();
    const [isDownloading, setIsDownloading] = useState(false)
    const [isDownloaded, setIsDownloaded] = useState(false)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const router = useRouter()

    // Load book - Do not use global state. Use that only for player
    useEffect(() => {
        getBook(bookId).then(b => {
            if (b?.cover_art)
                setBook(b)
        })
        getFilesForBook(bookId).then(res => {
            if (res.length > 0)
                setIsDownloaded(true)
        })
    }, [bookId])


    const handleDownload = async () => {
        try {
            await handleDelete()

            setIsDownloading(true);
            const { data: fileRows, count }: { data: FileRow[], count: number } = await fetchFileMetaFromServer(bookId)

            const { localFilePaths } = await downloadAndUnzip(bookId);

            fileRows?.forEach(fr => {
                fr.local_path = localFilePaths.find(f => fr.file_name && f.endsWith(fr.file_name))
            })

            await upsertFiles(fileRows)
            markBookDownloaded(bookId, `${ROOT}${bookId}/`)
            setIsDownloaded(true)
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
                        uri: `${API_URL}${book?.cover_art}`
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