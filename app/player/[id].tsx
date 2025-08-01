import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { Audiobook, getBook } from '@/data/db';
import { MaterialIcons } from '@expo/vector-icons';

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const bookId = parseInt(id)
    const [book, setBook] = useState<Audiobook | null>(null)

    useEffect(() => {
        getBook(bookId).then(book => setBook(book))
    }, [id])

    if (book === null) return (
        <View style={styles.container}>
            <Text>Error getting book</Text>
        </View>
    )

    const handlePlay = () => {
        console.log("Playing", book.title)
    }

    const handleRewind = () => {
        console.log("Rewind 10s")
    }

    const handleFastForward = () => {
        console.log("Forward 10s")
    }


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
                    <Text style={styles.titleText}>{book.title}</Text>
                    <Text style={styles.authorText}>{book.author}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={handleRewind}>
                    <MaterialIcons name='fast-rewind' size={40} color="#555555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePlay}>
                    <MaterialIcons name='play-circle' size={80} color="#555555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFastForward}>
                    <MaterialIcons name='fast-forward' size={40} color="#555555" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

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
    actions: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#563422',
        flexDirection: 'row',
        gap: 40,
    },
})