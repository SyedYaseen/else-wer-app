import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { AudiobookWithProgress } from "@/data/database/audiobook-repo";
import { useTheme } from "@/components/hooks/useTheme";
import { useAudioPlayerStore } from "../store/audio-player-store";
import { HighlightedText } from "./searchbar";

const H_PADDING = 16;

interface InProgressRowProps {
    books: AudiobookWithProgress[];
    searchQuery?: string;
}

export function InProgressRow({ books, searchQuery = "" }: InProgressRowProps) {
    const T = useTheme();
    if (!books.length) return null;

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: T.ink }]}>Continue Listening</Text>
            <FlatList
                data={books}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={b => b.id.toString()}
                contentContainerStyle={{ gap: 12, paddingRight: H_PADDING, paddingBottom: 25 }}
                renderItem={({ item }) => (
                    <InProgressCard book={item} searchQuery={searchQuery} />
                )}
            />
        </View>
    );
}

interface InProgressCardProps {
    book: AudiobookWithProgress;
    searchQuery?: string;
}

function InProgressCard({ book, searchQuery = "" }: InProgressCardProps) {
    const T = useTheme();
    const server = useAudioPlayerStore(s => s.server);
    const progress = book.duration ? book.progress_ms / book.duration : 0;
    const CARD_WIDTH = 100;
    const COVER_HEIGHT = CARD_WIDTH * 1.35;

    return (
        <Link
            href={{
                pathname: `/player/[id]`,
                params: { id: book.id, title: book.title, author: book.author },
            }}
            asChild
        >
            <TouchableOpacity
                activeOpacity={0.75}
                style={[
                    styles.card,
                    { width: CARD_WIDTH, backgroundColor: T.surface, borderColor: T.inkHairline },
                ]}
            >
                {server && book.cover_art ? (
                    <Image
                        source={{ uri: `${server}${book.cover_art}` }}
                        style={{ width: CARD_WIDTH, height: COVER_HEIGHT }}
                        resizeMode="cover"
                    />
                ) : (
                    <View
                        style={[
                            styles.coverPlaceholder,
                            { width: CARD_WIDTH, height: COVER_HEIGHT, backgroundColor: T.surfaceDeep },
                        ]}
                    >
                        <Text style={[styles.coverInitial, { color: T.inkSubtle }]}>
                            {book.title?.charAt(0).toUpperCase() ?? "?"}
                        </Text>
                    </View>
                )}
                <View style={styles.cardBody}>
                    <HighlightedText
                        text={book.title ?? ""}
                        query={searchQuery}
                        style={[styles.cardTitle, { color: T.ink }]}
                        highlightColor={T.accent + "33"}
                        highlightTextColor={T.accent}
                    />
                </View>
                <View style={[styles.trackBg, { backgroundColor: T.inkHairline }]}>
                    <View
                        style={[
                            styles.trackFill,
                            { backgroundColor: T.accent, width: `${Math.min(progress * 100, 100)}%` },
                        ]}
                    />
                </View>
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 4,
    },
    sectionTitle: {
        fontFamily: "DMSerifDisplay_400Regular",
        fontSize: 20,
        lineHeight: 24,
        marginBottom: 10,
    },
    card: {
        borderRadius: 8,
        borderWidth: 0.5,
        overflow: "hidden",
    },
    coverPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    coverInitial: {
        fontFamily: "DMSerifDisplay_400Regular",
        fontSize: 32,
        opacity: 0.4,
    },
    cardBody: {
        paddingHorizontal: 7,
        paddingTop: 7,
        paddingBottom: 4,
    },
    cardTitle: {
        fontFamily: "DMSerifDisplay_400Regular",
        fontSize: 11,
        lineHeight: 15,
        textTransform: "capitalize",
    },
    trackBg: {
        height: 3,
        width: "100%",
    },
    trackFill: {
        height: 3,
    },
});