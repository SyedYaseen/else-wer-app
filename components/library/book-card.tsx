import { Audiobook } from "@/data/database/models";
import { Link } from "expo-router";
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAudioPlayerStore } from "../store/audio-player-store";

function BookCard({ book }: { book: Audiobook }) {
    const server = useAudioPlayerStore(s => s.server)
    return (
        <Link
            href={{
                pathname: `/book/[id]`,
                params: {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                },
            }}
            asChild
        >
            <TouchableOpacity style={styles.card}>
                {server && book.cover_art && <Image
                    source={{ uri: `${server}${book.cover_art}` }}
                    style={styles.cover}
                    resizeMode="cover"
                />}
                <View style={styles.details}>
                    <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
                    <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
                    <Text style={styles.series} numberOfLines={1}>{book.series && book.series}</Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        marginVertical: 6,
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
        paddingBottom: 10,
    },
    cover: {
        width: '100%', // Full width of card
        height: 280, // Adjust height as needed
        borderRadius: 6,
        marginBottom: 10, // Space between image and text
    },
    details: {
        width: '100%',
        paddingHorizontal: 8,
    },

    title: {
        fontSize: 16,
        fontWeight: '500',
        color: "#CCCCCC",
        textAlign: 'left',
        marginBottom: 4,
    },
    author: {
        fontSize: 14,
        color: '#CCCCCC',
        textAlign: 'left',
        marginBottom: 4,
    },
    series: {
        fontSize: 13,
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'left',
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    resumeButton: {
        backgroundColor: '#22c55e',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default BookCard