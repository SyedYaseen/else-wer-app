import { StyleSheet, Text, View, Image, Dimensions } from 'react-native'
import { useAudioPlayerStore } from '../store/audio-player-store'
import { API_URL } from '@/data/api/api'
import { Audiobook } from '@/data/database/models';


const { width, height } = Dimensions.get("window");

export default function BookInfo({ currentBook }: { currentBook: Audiobook }) {
    const files = useAudioPlayerStore(s => s.files)
    const queue = useAudioPlayerStore(s => s.queue)
    const fileCount = files?.length || 0
    const qCount = queue?.length || 0

    if (!currentBook) {
        console.error("error fetching book in book info")
        return (<View>Error loading book</View>)
    }
    const coverUri = `${API_URL}${currentBook?.cover_art}`;

    return (
        <View style={styles.container}>
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
            <Text style={styles.titleText}>{currentBook.title}</Text>
            <Text style={styles.authorText}>{currentBook.author}</Text>
            <Text style={styles.chapterText}>
                Chapter {fileCount - qCount + 1} of {fileCount}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        padding: 20,
    },
    coverImage: {
        width: width * 0.7,
        height: width * 0.9,
        resizeMode: "contain",
        borderRadius: 12,
    },
    titleText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#CCCCCC",
        textAlign: "center",
    },
    authorText: {
        fontSize: 18,
        fontWeight: "300",
        color: "#CCCCCC",
        marginTop: 6,
    },
    chapterText: {
        fontSize: 14,
        fontWeight: "300",
        color: "#CCCCCC",
        marginTop: 4,
    },
});