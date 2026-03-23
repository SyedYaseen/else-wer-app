import { fetchBooks, scanServerFiles } from "@/data/api/api";
import { Audiobook } from "@/data/database/models";
import { AudiobookWithProgress, getAllBooks, getLclInProgress, upsertAudiobooks } from "@/data/database/audiobook-repo";
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BookCard from './book-card';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/hooks/useTheme';
import { listInProgressBooksMergeConflicts } from "@/data/lib/conflict-handling";
import { Link } from "expo-router";
import { useAudioPlayerStore } from "../store/audio-player-store";

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
  const [inProgressbooks, setinProgressBooks] = useState<AudiobookWithProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);


  async function getBooks() {
    const preScannedBooks = await getAllBooks()
    if (preScannedBooks && preScannedBooks.length > 0) {
      setBooks(preScannedBooks)
    } else {
      const res = await fetchBooks();
      setBooks(res.books);
      await upsertAudiobooks(res.books);
    }
  }

  async function getBooksInProgress() {
    const inprogress = await listInProgressBooksMergeConflicts()
    if (inprogress && inprogress.length > 0) {
      setinProgressBooks(inprogress)
    }
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

  useEffect(() => { getBooks(); getBooksInProgress(); }, []);

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
        ListHeaderComponent={<InProgressRow books={inProgressbooks} />}
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

function InProgressRow({ books }: { books: AudiobookWithProgress[] }) {
  const T = useTheme();
  if (!books.length) return null;

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: T.ink }]}>Continue Listening</Text>
      <FlatList
        data={books}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={b => b.id.toString()}
        contentContainerStyle={{ gap: 12, paddingRight: H_PADDING, paddingBottom: 25 }}
        renderItem={({ item }) => <InProgressCard book={item} />}
      />
    </View>
  );
}

function InProgressCard({ book }: { book: AudiobookWithProgress }) {
  const T = useTheme();
  const server = useAudioPlayerStore(s => s.server);
  const progress = book.duration ? book.progress_ms / book.duration : 0;
  const CARD_WIDTH = 100;
  const COVER_HEIGHT = CARD_WIDTH * 1.35;

  return (
    <Link href={{ pathname: `/player/[id]`, params: { id: book.id, title: book.title, author: book.author } }} asChild>
      <TouchableOpacity activeOpacity={0.75} style={[styles.inProgressCard, { width: CARD_WIDTH, backgroundColor: T.surface, borderColor: T.inkHairline }]}>
        {server && book.cover_art ? (
          <Image
            source={{ uri: `${server}${book.cover_art}` }}
            style={{ width: CARD_WIDTH, height: COVER_HEIGHT }}
            resizeMode="cover"
          />
        ) : (
          <View style={[{ width: CARD_WIDTH, height: COVER_HEIGHT, alignItems: 'center', justifyContent: 'center', backgroundColor: T.surfaceDeep }]}>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, opacity: 0.4, color: T.inkSubtle }}>
              {book.title?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={{ paddingHorizontal: 7, paddingTop: 7, paddingBottom: 4 }}>
          <Text style={[styles.inProgressTitle, { color: T.ink }]} numberOfLines={2}>
            {book.title}
          </Text>
        </View>
        <View style={[styles.trackBg, { backgroundColor: T.inkHairline }]}>
          <View style={[styles.trackFill, { backgroundColor: T.accent, width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  inProgressTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'capitalize',
  },

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
  // ── Inprogress ───────────────────────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 10
  },
  inProgressList: {
    paddingBottom: 4,
  },
  inProgressCard: {
    borderRadius: 8,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  trackBg: {
    height: 3,
    width: '100%',
  },
  trackFill: {
    height: 3,
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