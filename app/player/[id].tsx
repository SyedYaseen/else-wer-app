import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getAllBooks, getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import Controls from '@/components/player/controls';
import BookInfo from '@/components/player/book-info';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { saveProgress } from '@/data/api/api';
import { useProgressUpdate } from '@/components/hooks/useProgressUpdate';
import { getBookProgress } from '@/data/lib/conflict-handling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/hooks/useTheme';

export default function Player() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = parseInt(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const player = useAudioPlayerStore(s => s.player);
  useProgressUpdate(player!);

  const currentBook = useAudioPlayerStore(s => s.currentBook);
  const setCurrentBook = useAudioPlayerStore(s => s.setCurrentBook);
  const setFiles = useAudioPlayerStore(s => s.setFiles);
  const setQueue = useAudioPlayerStore(s => s.setQueue);
  const queue = useAudioPlayerStore(s => s.queue);

  // L&F
  const T = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!player) return null;

  useEffect(() => {
    const savePreviousBookProgress = async () => {
      if (queue && queue.length > 0) {
        await saveProgress(
          currentBook?.id as number,
          queue[0].id as number,
          player?.currentTime * 1000,
          player.currentTime > player.duration - 3,
        );
      }
    };

    const loadBook = async () => {
      if (!bookId) {
        setError("Invalid book ID");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const bookData = await getBook(bookId);

        if (!bookData) {
          setError(`BookId: ${bookId} not found on db`);
          console.error(`BookId: ${bookId} not found on db`);
          return;
        }

        const files = await getFilesForBook(bookId);

        if (!files || files.length === 0) {
          setError(`Missing files for ${bookData?.title}`);
          console.error("Files not in localdb or files not downloaded");
          return;
        }

        setCurrentBook(bookData);
        setFiles(files);

        const { q, pos } = await getBookProgress(bookId, files);
        console.log("*** Queue", q);
        setQueue(q);
        const next = q[0];
        console.log("next in q: ", next);
        if (next?.local_path) {
          player?.replace(next.local_path);
          player.seekTo(pos / 1000);
          player?.play();
        }
      } catch (err) {
        console.error("Error loading book:", err);
        setError("Failed to load book data.");
      } finally {
        setLoading(false);
      }
    };

    if (currentBook && currentBook.id !== bookId) savePreviousBookProgress();
    if (!currentBook || currentBook.id !== bookId) {
      console.log("*** Loading new book: ", bookId);
      loadBook();
    }
  }, [bookId]);

  // ── States ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: T.background, paddingTop: insets.top }]}>
        <Text style={[styles.stateText, { color: T.inkSubtle }]}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: T.background, paddingTop: insets.top }]}>
        <Text style={[styles.stateText, { color: T.danger }]}>{error}</Text>
      </View>
    );
  }

  if (!currentBook) {
    return (
      <View style={[styles.container, { backgroundColor: T.background, paddingTop: insets.top }]}>
        <Text style={[styles.stateText, { color: T.inkSubtle }]}>Book not found.</Text>
        <TouchableOpacity onPress={async () => {
          console.log("Get all books");
          try { console.log(await getAllBooks()); } catch (e) { console.log(e); }
        }}>
          <MaterialIcons name='download' size={40} color={T.inkSubtle} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[
        styles.container,
        { backgroundColor: T.background, paddingTop: insets.top },
      ]}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="keyboard-arrow-down" size={28} color={T.inkMuted} />
        </TouchableOpacity>

        <BookInfo currentBook={currentBook} />
        <Controls />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  stateText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
});