import { StyleSheet, Text, View, Image } from 'react-native'
import { useAudioPlayerStore } from '../store/audio-player-store'

export default function BookInfo() {
    const currentBook = useAudioPlayerStore(s => s.currentBook)

    if (!currentBook) {
        console.error("error fetching book in book info")
        return (<View>Error loading book</View>)
    }

    return (
        <>
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
        </>
    )
}

const styles = StyleSheet.create({
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
})