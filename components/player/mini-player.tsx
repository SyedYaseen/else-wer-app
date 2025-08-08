import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioController } from '../hooks/useAudioController';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { API_URL } from '@/data/api/api';
import { router, usePathname } from "expo-router";
import PlayButton from './play-button';
export default function MiniPlayer() {


    const { player, onPlay } = useAudioController()
    const currentBook = useAudioPlayerStore(s => s.currentBook)

    const progress =
        player.duration > 0 ? player.currentTime / player.duration : 0;

    const pathname = usePathname();
    if (pathname.startsWith("/player/"))
        return null


    return (
        <Pressable onPress={() => router.push(`/player/${currentBook?.id}`)} >
            <View style={styles.container}>
                {/* Left - Cover */}
                <Image
                    source={{
                        uri: `${API_URL}${currentBook?.cover_art}`
                    }}
                    style={styles.cover}
                />

                {/* Middle - Title */}
                <View style={styles.textContainer}>
                    <Text numberOfLines={1} style={styles.title}>{currentBook?.title}</Text>
                </View>

                {/* Right - Controls */}
                {/* <TouchableOpacity onPress={onPlay} style={styles.playButton}>
                    <Ionicons
                        name={player.playing ? "pause" : "play"}
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity> */}
                <PlayButton player={player} />
                {/* Progress Bar */}
                <View style={styles.progressBackground}>
                    <View style={[styles.progressFill, { flex: progress }]} />
                    <View style={{ flex: 1 - progress }} />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        backgroundColor: '#222',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        position: 'relative'
    },
    cover: {
        width: 40,
        height: 40,
        borderRadius: 4
    },
    textContainer: {
        flex: 1,
        marginHorizontal: 8
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center'
    },
    progressBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        flexDirection: 'row',
        backgroundColor: '#555'
    },
    progressFill: {
        backgroundColor: '#1DB954'
    }
});
