// components/library.tsx — Folio Library

import { fetchBooks, scanServerFiles } from "@/data/api/api";
import { Audiobook } from "@/data/database/models";
import { upsertAudiobooks } from "@/data/database/audiobook-repo";
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BookCard from './book-card';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/hooks/useTheme';

const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 16;
const COL_GAP = 10;
export const ITEM_WIDTH =
  (SCREEN_WIDTH - H_PADDING * 2 - COL_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function Library() {
  const T = useTheme();
  const insets = useSafeAreaInsets();

  const [books, setBooks] = useState<Audiobook[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function getBooks() {
    const res = await fetchBooks();
    setBooks(res.books);
    await upsertAudiobooks(res.books);
  }

  async function scanBooks() {
    setScanning(true);
    try {
      await scanServerFiles();
      await getBooks();
    } catch (err) {
      console.error('Error scanning books:', err);
    } finally {
      setScanning(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await getBooks();
    } catch (err) {
      console.error('Error refreshing books:', err);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { getBooks(); }, []);

  // ── Shared page header (title + subtitle row) ─────────────────────────────
  const PageHeader = (
    <View style={[
      styles.pageHeader,
      {
        paddingTop: insets.top + 16,
        paddingHorizontal: H_PADDING,
        borderBottomColor: T.inkHairline,
        backgroundColor: T.background,
      },
    ]}>
      <View style={styles.pageTitleRow}>
        <View>
          <Text style={[styles.pageTitle, { color: T.ink }]}>Library</Text>
          <Text style={[styles.pageSubtitle, { color: T.inkSubtle }]}>
            Your audiobook collection
          </Text>
        </View>
        {books.length > 0 && (
          <TouchableOpacity
            style={[styles.rescanBtn, { borderColor: T.inkHairline }]}
            onPress={scanBooks}
            activeOpacity={0.6}
          >
            <MaterialIcons name="refresh" size={14} color={T.accent} />
            <Text style={[styles.rescanBtnText, { color: T.accent }]}>Rescan</Text>
          </TouchableOpacity>
        )}
      </View>
      {books.length > 0 && (
        <Text style={[styles.countText, { color: T.inkSubtle }]}>
          {books.length} {books.length === 1 ? 'audiobook' : 'audiobooks'}
        </Text>
      )}
    </View>
  );

  // ── Scanning ──────────────────────────────────────────────────────────────
  if (scanning) {
    return (
      <View style={[styles.root, { backgroundColor: T.background }]}>
        {PageHeader}
        <View style={styles.centreState}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={[styles.stateTitle, { color: T.ink }]}>Scanning library</Text>
          <Text style={[styles.stateBody, { color: T.inkSubtle }]}>
            Looking for audiobooks on your server
          </Text>
        </View>
      </View>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (books.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: T.background }]}>
        {PageHeader}
        <View style={styles.centreState}>
          <MaterialIcons name="library-books" size={52} color={T.inkHairline} />
          <Text style={[styles.stateTitle, { color: T.ink }]}>No audiobooks yet</Text>
          <Text style={[styles.stateBody, { color: T.inkSubtle }]}>
            Scan your server to discover audiobooks
          </Text>
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: T.ink }]}
            onPress={scanBooks}
            activeOpacity={0.75}
          >
            <MaterialIcons name="search" size={18} color={T.background} />
            <Text style={[styles.scanBtnText, { color: T.background }]}>
              Scan for audiobooks
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Grid ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: T.background }]}>
      {PageHeader}
      <FlatList
        data={books}
        keyExtractor={book => book?.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <BookCard book={item} />
          </View>
        )}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: H_PADDING }]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={T.accent}
            colors={[T.accent]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Page header ─────────────────────────────────────────────────────────────
  pageHeader: {
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    gap: 6,
  },
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pageTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    lineHeight: 36,
  },
  pageSubtitle: {
    fontFamily: 'DMSans_300Light',
    fontSize: 13,
    marginTop: 2,
  },
  countText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.04,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 0.5,
    marginBottom: 2,
  },
  rescanBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // ── States ───────────────────────────────────────────────────────────────────
  centreState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  stateTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    marginTop: 12,
  },
  stateBody: {
    fontFamily: 'DMSans_300Light',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 100,
  },
  scanBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },

  // ── Grid ─────────────────────────────────────────────────────────────────────
  listContent: { paddingTop: 16, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: COL_GAP },
  itemContainer: { width: ITEM_WIDTH },
});

export default Library;