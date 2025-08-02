import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { Audiobook, FileRow, } from '@/data/database/models';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/components/hooks/useAudioplayer';
import { Audio } from "expo-av";
import { getProgressForBookLcl } from '@/data/database/sync-repo';
import { getBookProgressServer } from '@/data/api/api';

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const bookId = parseInt(id)
    const [book, setBook] = useState<Audiobook | null>(null)
    const [files, setFiles] = useState<FileRow[]>()

    const player = useAudioPlayer()

    useEffect(() => {
        getBook(bookId).then(book => setBook(book))
        getFilesForBook(bookId).then(files => setFiles(files))

        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        });
    }, [id])

    if (book === null) return (
        <View style={styles.container}>
            <Text>Error getting book</Text>
        </View>
    )

    const handlePlay = async () => {
        try {


            const lastPosLcl = await getProgressForBookLcl(bookId)

            const lastPosServer = await getBookProgressServer(1, bookId)
            console.log(lastPosLcl, lastPosServer)
        } catch (e) {
            console.log(e)
        }

        // files?.forEach(f => console.log(f.file_id, f.file_name))
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
                    <MaterialIcons name='play-circle' size={80} color="#555555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFastForward}>
                    <MaterialIcons name='fast-forward' size={40} color="#555555" />
                </TouchableOpacity>
            </View>
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