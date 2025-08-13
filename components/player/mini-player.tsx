import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useAudioController } from '../hooks/useAudioController';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { router, usePathname } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';

export default function MiniPlayer() {
    const { player, onPlay } = useAudioController()
    const currentBook = useAudioPlayerStore(s => s.currentBook)

    const progress =
        player.duration > 0 ? player.currentTime / player.duration : 0;

    const pathname = usePathname();
    if (pathname.startsWith("/player/"))
        return null
    const server = useAudioPlayerStore(s => s.server)
    return (
        <Pressable onPress={() => router.push(`/player/${currentBook?.id}`)} >
            <View style={styles.container}>
                {/* Left - Cover */}
                {server && currentBook?.cover_art && <Image
                    source={{
                        uri: `${server}${currentBook?.cover_art}`
                    }}
                    style={styles.cover}
                />
                }

                {/* Middle - Title */}
                <View style={styles.textContainer}>
                    <Text numberOfLines={1} style={styles.title}>{currentBook?.title}</Text>
                </View>
                <TouchableOpacity onPress={async () => await onPlay()}>
                    <MaterialIcons
                        name={player.playing ? "pause-circle" : "play-circle"}
                        size={40}
                        color="#555555"
                        style={{ marginRight: 8 }}
                    />
                </TouchableOpacity>
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
