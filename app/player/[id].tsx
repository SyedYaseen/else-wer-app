import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getBook, getFilesForBook } from '@/data/database/audiobook-repo';
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
import { useQuery } from '@tanstack/react-query';
import { Audiobook, FileRow } from '@/data/database/models';

const TAG = '[Player]';

async function loadBookData(bookId: number) {
  const audiobook = await getBook(bookId);
  if (!audiobook) throw new Error(`Book ${bookId} not found`);

  const files = await getFilesForBook(bookId);
  if (!files || files.length === 0) {
    const err = new Error(`Missing files for "${audiobook.title}"`);
    (err as any).noFiles = true;
    throw err;
  }

  const { q, pos } = await getBookProgress(bookId, files);
  return { audiobook, files, q, pos };
}

export default function Player() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = parseInt(id);
  const T = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const player = useAudioPlayerStore(s => s.player);
  const currentBook = useAudioPlayerStore(s => s.currentBook);
  const setCurrentBook = useAudioPlayerStore(s => s.setCurrentBook);
  const setFiles = useAudioPlayerStore(s => s.setFiles);
  const setQueue = useAudioPlayerStore(s => s.setQueue);
  const queue = useAudioPlayerStore(s => s.queue);

  useProgressUpdate(player!);

  // ── Refs for unmount save ────────────────────────────────────────────────
  // Cleanup functions cannot close over React state — they capture the value
  // at mount time and never update. Refs stay current throughout the lifetime.
  const playerRef = useRef(player);
  const currentBookRef = useRef(currentBook);
  const queueRef = useRef(queue);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { currentBookRef.current = currentBook; }, [currentBook]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // Save progress when navigating away from the player
  useEffect(() => {
    return () => {
      const p = playerRef.current;
      const book = currentBookRef.current;
      const q = queueRef.current;
      if (!p || !book || !q?.length) return;
      console.log(`${TAG} unmount save at ${p.currentTime}s`);
      saveProgress(
        book.id as number,
        q[0].id as number,
        p.currentTime * 1000,
        p.currentTime > p.duration - 3,
      ).catch(err => console.error(`${TAG} unmount save failed`, err));
    };
  }, []); // empty deps — cleanup runs only on unmount

  // ── Load book data ────────────────────────────────────────────────────────
  const didSeekRef = useRef(false);
  const shouldFetch = !!player && !!bookId;

  const { isLoading, error, data } = useQuery({
    queryKey: ['player-book', bookId],
    queryFn: () => loadBookData(bookId), // pure — no side effects in queryFn
    enabled: shouldFetch,
    staleTime: 0,        // always re-fetch on mount so progress is fresh
    gcTime: 0,           // evict on unmount so re-opening re-fetches
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!data || !player) return;
    if (didSeekRef.current) return;
    didSeekRef.current = true;

    // Save progress for the previous book only when genuinely switching books
    if (currentBook && currentBook.id !== bookId && queue?.length > 0) {
      saveProgress(
        currentBook.id as number,
        queue[0].id as number,
        player.currentTime * 1000,
        player.currentTime > player.duration - 3,
      ).catch(err => console.error(`${TAG} save-on-switch failed`, err));
    }

    setCurrentBook(data.audiobook);
    setFiles(data.files);
    setQueue(data.q);
    const next = data.q[0];
    if (next?.local_path) {
      player.replace(next.local_path);
      player.seekTo(data.pos / 1000);

      player.setActiveForLockScreen(true, {
        title: currentBook?.title,
        artist: currentBook?.author,
        albumTitle: currentBook?.title,
        artworkUrl: currentBook?.cover_art ?? undefined, // optional
      });

      player.play();
    }
  }, [data]);

  useEffect(() => {
    if (!error) return;
    console.error(`${TAG} load error`, error);
    if ((error as any).noFiles) {
      router.replace(`/book/${bookId}`);
    }
  }, [error]);

  if (!player) return null;

  const containerStyle = [styles.container, { backgroundColor: T.background, paddingTop: insets.top }];

  if (isLoading) {
    return (
      <View style={containerStyle}>
        <Text style={[styles.stateText, { color: T.inkSubtle }]}>Loading…</Text>
      </View>
    );
  }

  if (error && !(error as any).noFiles) {
    return (
      <View style={containerStyle}>
        <Text style={[styles.stateText, { color: T.danger }]}>{(error as Error).message}</Text>
      </View>
    );
  }

  if (!currentBook) {
    return (
      <View style={containerStyle}>
        <Text style={[styles.stateText, { color: T.inkSubtle }]}>Book not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: T.background, paddingTop: insets.top }]}>
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