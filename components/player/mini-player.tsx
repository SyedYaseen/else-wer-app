// components/player/mini-player.tsx — Folio MiniPlayer
// ⚠️ Logic unchanged from original. L&F only.

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useAudioController } from '../hooks/useAudioController';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/components/hooks/useTheme';

export default function MiniPlayer() {
    const { player, onPlay } = useAudioController();
    const currentBook = useAudioPlayerStore(s => s.currentBook);
    const server = useAudioPlayerStore(s => s.server);
    const T = useTheme();

    const progress =
        player.duration > 0 ? player.currentTime / player.duration : 0;

    const pathname = usePathname();
    if (pathname.startsWith('/player/')) return null;

    return (
        <Pressable onPress={() => router.push(`/player/${currentBook?.id}`)}>
            <View style={[styles.container, { backgroundColor: T.surface, borderTopColor: T.inkHairline }]}>

                {/* Cover */}
                {server && currentBook?.cover_art && (
                    <Image
                        source={{ uri: `${server}${currentBook?.cover_art}` }}
                        style={styles.cover}
                    />
                )}

                {/* Title */}
                <View style={styles.textContainer}>
                    <Text numberOfLines={1} style={[styles.title, { color: T.ink }]}>
                        {currentBook?.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.author, { color: T.inkSubtle }]}>
                        {currentBook?.author}
                    </Text>
                </View>

                {/* Play / Pause */}
                <TouchableOpacity onPress={async () => await onPlay()} hitSlop={8}>
                    <MaterialIcons
                        name={player.playing ? 'pause-circle' : 'play-circle'}
                        size={36}
                        color={T.accent}
                        style={styles.playIcon}
                    />
                </TouchableOpacity>

                {/* Progress bar — pinned to bottom */}
                <View style={[styles.progressBackground, { backgroundColor: T.inkHairline }]}>
                    <View style={[styles.progressFill, { flex: progress, backgroundColor: T.accent }]} />
                    <View style={{ flex: 1 - progress }} />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderTopWidth: 0.5,
        position: 'relative',
    },
    cover: {
        width: 42,
        height: 42,
        borderRadius: 6,
    },
    textContainer: {
        flex: 1,
        marginHorizontal: 12,
        gap: 2,
    },
    title: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 14,
        lineHeight: 17,
    },
    author: {
        fontFamily: 'DMSans_300Light',
        fontSize: 11,
    },
    playIcon: {
        marginRight: 4,
    },
    progressBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        flexDirection: 'row',
    },
    progressFill: {},
});