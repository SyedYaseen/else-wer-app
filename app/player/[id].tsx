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
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { useAudioController } from '@/components/hooks/useSharedAudioPlayer';

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const { player, playerStatus, onPlay, rewind, fastForward, loadBook, loading, error, currentBook } = useAudioController()

    if (!player) return null;

    useEffect(() => {
        let isMounted = true;
        if (!id) return;

        if (isMounted) {
            loadBook(id)
        }

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
        );
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
                    <Text style={styles.titleText}>{currentBook.title}</Text>
                    <Text style={styles.authorText}>{currentBook.author}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={rewind}>
                    <MaterialIcons name='fast-rewind' size={40} color="#555555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => await onPlay()}>
                    <MaterialIcons
                        name={player.playing ? "pause-circle" : "play-circle"}
                        size={80}
                        color="#555555"
                        style={{ marginRight: 8 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={fastForward}>
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