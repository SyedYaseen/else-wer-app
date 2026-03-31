import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/hooks/useTheme";
import { scanServerFiles } from "@/data/api/api";
import BookCard from "./book-card";
import { SearchBar } from "./searchbar";
import { useNetworkState } from "../store/network-store";
import { useBookSearch } from "../hooks/useBooksSearch";
import { useLibraryBooks, useInProgressBooks, LIBRARY_KEYS } from "../hooks/useLibraryBooks";
import { InProgressRow } from "./inprogress-row";
import { LibraryHeader } from "./library-header";

const TAG = "[Library]";

const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get("window").width;
const H_PADDING = 16;
const COL_GAP = 10;
export const ITEM_WIDTH =
  (SCREEN_WIDTH - H_PADDING * 2 - COL_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function Library() {
  const T = useTheme();
  const queryClient = useQueryClient();
  const isOnline = useNetworkState(s => s.isOnline);
  const [scanning, setScanning] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  const {
    data: books = [],
    isLoading: booksLoading,
    isError: booksError,
    error: booksErrorDetail,
    refetch: refetchBooks,
    isRefetching,
  } = useLibraryBooks();

  const {
    data: inProgressBooks = [],
    isError: inProgressError,
    refetch: refetchInProgress,
  } = useInProgressBooks();

  // ── Search ──────────────────────────────────────────────────────────────────
  const { query, setQuery, debouncedQuery, filtered, hasQuery } = useBookSearch(books);

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function handleRescan() {
    setScanning(true);
    try {
      console.log(`${TAG} starting server rescan`);
      await scanServerFiles();
      await queryClient.invalidateQueries({ queryKey: LIBRARY_KEYS.books(isOnline) });
      console.log(`${TAG} rescan complete`);
    } catch (err) {
      console.error(`${TAG} rescan failed`, err);
      Alert.alert("Scan Failed", "Could not scan for audiobooks. Check your server connection.");
    } finally {
      setScanning(false);
    }
  }

  async function handleRefresh() {
    console.log(`${TAG} pull-to-refresh`);
    try {
      await Promise.all([refetchBooks(), refetchInProgress()]);
    } catch (err) {
      // Individual query errors are already logged inside the queryFn.
      // React Query surfaces them via isError; we only need to handle
      // unexpected rejections from Promise.all itself here.
      console.error(`${TAG} refresh threw outside queryFn`, err);
    }
  }

  // ── States ───────────────────────────────────────────────────────────────────

  // Hard fetch error with no cached data to fall back on
  if (booksError && !books.length) {
    console.error(`${TAG} rendering error state`, booksErrorDetail);
    return (
      <View style={[styles.root, { backgroundColor: T.background }]}>
        <LibraryHeader bookCount={0} onRescan={handleRescan} isRescanning={scanning} />
        <View style={styles.centreState}>
          <MaterialIcons name="cloud-off" size={52} color={T.inkHairline} />
          <Text style={[styles.stateTitle, { color: T.ink }]}>Couldn't load library</Text>
          <Text style={[styles.stateBody, { color: T.inkSubtle }]}>
            {isOnline
              ? "Check your server connection and try again."
              : "No downloaded books found for offline mode."}
          </Text>
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: T.ink }]}
            onPress={() => refetchBooks()}
            activeOpacity={0.75}
          >
            <MaterialIcons name="refresh" size={18} color={T.background} />
            <Text style={[styles.scanBtnText, { color: T.background }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (booksLoading && !books.length) {
    return (
      <View style={[styles.root, { backgroundColor: T.background }]}>
        <LibraryHeader bookCount={0} onRescan={handleRescan} isRescanning={scanning} />
        <View style={styles.centreState}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      </View>
    );
  }

  if (scanning) {
    return (
      <View style={[styles.root, { backgroundColor: T.background }]}>
        <LibraryHeader bookCount={books.length} onRescan={handleRescan} isRescanning={scanning} />
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

  if (books.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: T.background }]}>
        <LibraryHeader bookCount={0} onRescan={handleRescan} isRescanning={scanning} />
        <View style={styles.centreState}>
          <MaterialIcons name="library-books" size={52} color={T.inkHairline} />
          <Text style={[styles.stateTitle, { color: T.ink }]}>No audiobooks yet</Text>
          <Text style={[styles.stateBody, { color: T.inkSubtle }]}>
            Scan your server to discover audiobooks
          </Text>
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: T.ink }]}
            onPress={handleRescan}
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
      <LibraryHeader bookCount={books.length} onRescan={handleRescan} isRescanning={scanning} />
      <FlatList
        data={filtered}
        keyExtractor={book => book?.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <BookCard book={item} />
          </View>
        )}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Only show in-progress row when NOT searching */}
            {!hasQuery && !inProgressError && (
              <InProgressRow books={inProgressBooks} searchQuery={debouncedQuery} />
            )}
            <SearchBar
              value={query}
              onChange={setQuery}
              resultCount={filtered.length}
              hasQuery={hasQuery}
              style={styles.searchBar}
            />
          </View>
        }
        ListEmptyComponent={
          hasQuery ? (
            <View style={styles.emptySearch}>
              <Text style={[styles.stateTitle, { color: T.ink }]}>No results</Text>
              <Text style={[styles.stateBody, { color: T.inkSubtle }]}>
                Try searching by title, author, or series
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingHorizontal: H_PADDING }]}
        columnWrapperStyle={filtered.length > 0 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
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

  listHeader: {
    gap: 16,
    paddingTop: 16,
  },
  searchBar: {
    marginBottom: 4,
  },

  // ── States ───────────────────────────────────────────────────────────────────
  centreState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 10,
  },
  stateTitle: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 22,
    marginTop: 12,
  },
  stateBody: {
    fontFamily: "DMSans_300Light",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptySearch: {
    paddingTop: 60,
    alignItems: "center",
    gap: 8,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 100,
  },
  scanBtnText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
  },

  // ── Grid ─────────────────────────────────────────────────────────────────────
  listContent: { paddingBottom: 40 },
  columnWrapper: { justifyContent: "space-between", marginBottom: COL_GAP },
  itemContainer: { width: ITEM_WIDTH },
});

export default Library;