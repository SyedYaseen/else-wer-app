import { fetchBooks, scanServerFiles } from "@/data/api/api";
import { Audiobook, FileRow } from "@/data/database/models";
import { upsertAudiobooks } from "@/data/database/audiobook-repo";
import { useEffect, useState } from "react";
import { FlatList, View, StyleSheet, Dimensions, Button, TouchableOpacity } from "react-native";
import BookCard from './book-card';

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const itemMargin = 10;
const itemWidth = (screenWidth - (numColumns + 1) * itemMargin) / numColumns;

function Library() {
    const [books, setBooks] = useState<Audiobook[]>([]);

    useEffect(() => {
        async function getBooks() {
            const books = await fetchBooks()
            setBooks(books.books)
            await upsertAudiobooks(books.books) // TODO: Avoid resetting book over and over. Move the init scan out of library
        }

        async function scanBooks() {
            await scanServerFiles()
            await getBooks()
        }

        getBooks()
        if (books.length === 0) {
            scanBooks()
        }
    }, [])


    return (
        <View style={{ backgroundColor: "#1C1C1E", paddingTop: 20 }}>
            {books.length > 0 ?
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
                /> :
                null
            }
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
})

export default Library