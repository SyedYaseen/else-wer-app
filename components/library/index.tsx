import { fetchBooks } from "@/data/api/api";
import { Audiobook, FileRow } from "@/data/database/models";
import { upsertAudiobooks } from "@/data/database/audiobook-repo";
import { useEffect, useState } from "react";
import { FlatList, View, StyleSheet, Dimensions } from "react-native";
import BookCard from './book-card';

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const itemMargin = 10;
const itemWidth = (screenWidth - (numColumns + 1) * itemMargin) / numColumns;

function Library() {
    const [books, setBooks] = useState<Audiobook[]>([]);

    useEffect(() => {
        fetchBooks().then(async (data) => {
            setBooks(data.books);
            await upsertAudiobooks(data.books)
        });

        // Audio.setAudioModeAsync({
        //     playsInSilentModeIOS: true,
        //     staysActiveInBackground: false,
        // });
    }, []);


    return (
        <View style={{ backgroundColor: "#1C1C1E", paddingTop: 20 }}>
            <FlatList
                data={books}
                keyExtractor={(book) => book?.id?.toString()}
                renderItem={({ item }) =>
                    <View style={styles.itemContainer}>
                        <BookCard book={item} />
                    </View>
                }
                numColumns={numColumns}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: 40,
        paddingHorizontal: itemMargin,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: itemMargin,
    },
    itemContainer: {
        width: itemWidth,
    },
});

export default Library