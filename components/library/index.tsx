import { fetchBooks, scanServerFiles } from "@/data/api/api";
import { Audiobook } from "@/data/database/models";
import { upsertAudiobooks } from "@/data/database/audiobook-repo";
import { FlatList, View, StyleSheet, Dimensions, RefreshControl, Text, TouchableOpacity } from "react-native";
import BookCard from './book-card';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const itemMargin = 10;
const itemWidth = (screenWidth - (numColumns + 1) * itemMargin) / numColumns;

function Library() {
  const [books, setBooks] = useState<Audiobook[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function getBooks() {
    const books = await fetchBooks();
    setBooks(books.books);
  }

  async function scanBooks() {
    setScanning(true);
    try {
      await scanServerFiles();
      await getBooks();
    } catch (error) {
      console.error('Error scanning books:', error);
    } finally {
      setScanning(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await getBooks();
    } catch (error) {
      console.error('Error refreshing books:', error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    getBooks();
  }, []);

  // Empty state with scan button
  if (books.length === 0 && !scanning) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="library-books" size={80} color="#666" />
          <Text style={styles.emptyTitle}>No Audiobooks Found</Text>
          <Text style={styles.emptySubtitle}>
            Scan your server to discover audiobooks
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={scanBooks}
          >
            <MaterialIcons name="search" size={24} color="#FFF" />
            <Text style={styles.scanButtonText}>Scan for Audiobooks</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Scanning state
  if (scanning) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialIcons name="sync" size={80} color="#1DB954" />
          <Text style={styles.emptyTitle}>Scanning...</Text>
          <Text style={styles.emptySubtitle}>
            Looking for audiobooks on your server
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={(book) => book?.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <BookCard book={item} />
          </View>
        )}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DB954"
            colors={['#1DB954']}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {books.length} {books.length === 1 ? 'Audiobook' : 'Audiobooks'}
            </Text>
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={scanBooks}
            >
              <MaterialIcons name="refresh" size={20} color="#1DB954" />
              <Text style={styles.rescanButtonText}>Rescan</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
  },
  rescanButtonText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
  },
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
