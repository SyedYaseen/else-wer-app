import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { getAllBooks, getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioController } from '@/components/hooks/useAudioController';
import Controls from '@/components/player/controls';
import BookInfo from '@/components/player/book-info';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import useInitQueue from '@/components/hooks/useInitQueue';

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    useInitQueue()

    const { player, loading, error } = useAudioController()
    // const setShowMiniPlayer = useAudioPlayerStore(s => s.setShowMiniPlayer)

    const { setShowMiniPlayer, setCurrentBookId, currentBook } = useAudioPlayerStore()

    if (!player) return null;

    useEffect(() => {
        setShowMiniPlayer(false)
    }, [])

    useEffect(() => {
        let isMounted = true;

        if (!id) return;

        if (isMounted) {
            const bookId = parseInt(id);
            setCurrentBookId(bookId)
        }

        return () => { isMounted = false }
    }, [id])


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