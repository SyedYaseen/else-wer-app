// components/player/book-info.tsx — Folio BookInfo
// ⚠️ Logic unchanged. L&F only.

import { StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { Audiobook } from '@/data/database/models';
import { useTheme } from '@/components/hooks/useTheme';

const { width } = Dimensions.get('window');

export default function BookInfo({ currentBook }: { currentBook: Audiobook }) {
    const T = useTheme();
    const files = useAudioPlayerStore(s => s.files);
    const queue = useAudioPlayerStore(s => s.queue);
    const server = useAudioPlayerStore(s => s.server);

    const fileCount = files?.length || 0;
    const qCount = queue?.length || 0;

    if (!currentBook) {
        console.error("error fetching book in book info");
        return <View><Text style={{ color: T.danger }}>Error loading book</Text></View>;
    }

    const coverUri = `${server}${currentBook?.cover_art}`;

    return (
        <View style={styles.container}>
            {/* Cover */}
            <View style={[styles.coverShadow, { shadowColor: T.accent }]}>
                <Image source={{ uri: coverUri }} style={styles.coverImage} />
            </View>

            {/* Text */}
            <View style={styles.textBlock}>
                <Text style={[styles.titleText, { color: T.ink }]} numberOfLines={2}>
                    {currentBook.title}
                </Text>
                <Text style={[styles.authorText, { color: T.inkMuted }]}>
                    {currentBook.author}
                </Text>
                <Text style={[styles.chapterText, { color: T.inkSubtle }]}>
                    Chapter {fileCount - qCount + 1} of {fileCount}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    coverShadow: {
        borderRadius: 14,
        shadowOpacity: 0.2,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        marginBottom: 28,
    },
    coverImage: {
        width: width * 0.68,
        height: width * 0.68,
        resizeMode: 'cover',
        borderRadius: 14,
    },
    textBlock: {
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 16,
    },
    titleText: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 24,
        lineHeight: 28,
        textAlign: 'center',
    },
    authorText: {
        fontFamily: 'DMSans_300Light',
        fontSize: 15,
        textAlign: 'center',
    },
    chapterText: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 12,
        textAlign: 'center',
        letterSpacing: 0.04,
        marginTop: 2,
    },
});