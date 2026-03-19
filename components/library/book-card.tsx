// components/book-card.tsx — Folio BookCard

import { Audiobook } from "@/data/database/models";
import { Link } from "expo-router";
import { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAudioPlayerStore } from "../store/audio-player-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '@/components/hooks/useTheme';
import { ITEM_WIDTH } from "./index";

function BookCard({ book }: { book: Audiobook }) {
    const T = useTheme();
    const server = useAudioPlayerStore(s => s.server);
    const setServer = useAudioPlayerStore(s => s.setServer);

    useEffect(() => {
        if (!server) {
            (async () => {
                const saved = await AsyncStorage.getItem('server');
                if (saved) setServer(saved);
            })();
        }
    }, [server]);

    return (
        <Link
            href={{
                pathname: `/book/[id]`,
                params: { id: book.id, title: book.title, author: book.author },
            }}
            asChild
        >
            <TouchableOpacity
                style={[styles.card, { backgroundColor: T.surface, borderColor: T.inkHairline }]}
                activeOpacity={0.75}
            >
                {/* Cover art */}
                {server && book.cover_art ? (
                    <Image
                        source={{ uri: `${server}${book.cover_art}` }}
                        style={styles.cover}
                        resizeMode="cover"
                    />
                ) : (
                    // Placeholder when no cover is available
                    <View style={[styles.coverPlaceholder, { backgroundColor: T.surfaceDeep }]}>
                        <Text style={[styles.placeholderInitial, { color: T.inkSubtle }]}>
                            {book.title?.charAt(0).toUpperCase() ?? '?'}
                        </Text>
                    </View>
                )}

                {/* Text details */}
                <View style={styles.details}>
                    <Text style={[styles.title, { color: T.ink }]} numberOfLines={2}>
                        {book.title}
                    </Text>
                    <Text style={[styles.author, { color: T.inkMuted }]} numberOfLines={1}>
                        {book.author}
                    </Text>
                    {book.series ? (
                        <Text style={[styles.series, { color: T.inkSubtle }]} numberOfLines={1}>
                            {book.series}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 0.5,
        overflow: 'hidden',
        marginVertical: 0,
    },

    // Cover
    cover: {
        width: '100%',
        height: ITEM_WIDTH * 1.35,  // portrait ratio
    },
    coverPlaceholder: {
        width: '100%',
        height: ITEM_WIDTH * 1.35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderInitial: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 48,
        opacity: 0.4,
    },

    // Text
    details: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 12,
        gap: 3,
    },
    title: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 13,
        lineHeight: 17,
        textTransform: 'capitalize'
    },
    author: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 11,
        textTransform: 'capitalize'
    },
    series: {
        fontFamily: 'DMSans_300Light',
        fontSize: 10,
        fontStyle: 'italic',
        textTransform: 'capitalize'
    },
});

export default BookCard;