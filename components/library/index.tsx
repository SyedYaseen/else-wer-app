import { fetchBooks } from "@/data/api/api";
import { Audiobook, FileRow } from "@/data/database/models";
import { upsertAudiobooks } from "@/data/database/audiobook-repo";
import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import BookCard from './book-card';

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
        <View style={{ backgroundColor: "#fff", paddingTop: 20 }}>
            <FlatList
                data={books}
                keyExtractor={(book) => book?.id?.toString()}
                renderItem={({ item }) => <BookCard book={item} />}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    )
}

export default Library