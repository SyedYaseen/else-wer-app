import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
export default function BookDetails() {
    const { id, title, author } = useLocalSearchParams();

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
                    <Text style={styles.titleText}>{title}</Text>
                    <Text style={styles.authorText}>{author}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => console.log("Downloading...")}>
                        <MaterialIcons name='download' size={40} color="#555555" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => console.log("Playing...")}>
                        <MaterialIcons name='play-circle' size={40} color="#555555" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => console.log("Completed...")}>
                        <MaterialIcons name='check-circle' size={40} color="#555555" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.descriptionText}>
                    The Hobbit is set in Middle-earth and follows home-loving Bilbo Baggins, the titular hobbit who joins the wizard Gandalf and the thirteen dwarves of Thorin's Company on a quest to reclaim the dwarves' home and treasure from the dragon Smaug.
                </Text>
            </View>
        </View>
    );
};

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 5,
        paddingBottom: 15,
        paddingHorizontal: 16,
    },
    titleContainer: {
        flex: 1,
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
        flexDirection: 'row',
        gap: 12,
    },
    descriptionContainer: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    descriptionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
    },
});