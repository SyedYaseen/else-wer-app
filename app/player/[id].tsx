import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getBook, getFilesForBook } from '@/data/database/audiobook-repo';
import Controls from '@/components/player/controls';
import BookInfo from '@/components/player/book-info';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import { saveProgressSec } from '@/data/api/api';
import { useProgressUpdate } from '@/components/hooks/useProgressUpdate';
import { getBookProgress } from '@/data/lib/conflict-handling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { IconButton } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { Audiobook, FileRow } from '@/data/database/models';
import { AudioPlayer } from 'expo-audio';

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
  // Gate here: `player` is null until useInitPlayer's async audio-mode setup
  // resolves (cold start / deep link). PlayerContent's hooks (useProgressUpdate
  // in particular) require a non-null player, so it must not mount until then.
  const player = useAudioPlayerStore(s => s.player);
  const T = useTheme();
  const insets = useSafeAreaInsets();

  if (!player) {
    return (
      <View style={[styles.container, { backgroundColor: T.background, paddingTop: insets.top }]}>
        <Text style={[styles.stateText, { color: T.inkSubtle }]}>Loading…</Text>
      </View>
    );
  }

  return <PlayerContent player={player} />;
}

function PlayerContent({ player }: { player: AudioPlayer }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = parseInt(id);
  const T = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const currentBook = useAudioPlayerStore(s => s.currentBook);
  const setCurrentBook = useAudioPlayerStore(s => s.setCurrentBook);
  const setFiles = useAudioPlayerStore(s => s.setFiles);
  const setQueue = useAudioPlayerStore(s => s.setQueue);
  const queue = useAudioPlayerStore(s => s.queue);

  useProgressUpdate(player);

  // ── Refs for unmount save ────────────────────────────────────────────────
  // Cleanup functions cannot close over React state — they capture the value
  // at mount time and never update. Refs stay current throughout the lifetime.
  const playerRef = useRef(player);
  const currentBookRef = useRef(currentBook);
  const queueRef = useRef(queue);
  // Only set once applyBook actually completes a load for this bookId — guards
  // against the unmount-save firing with stale refs from a previous mount when
  // this mount's load never ran (e.g. threw `noFiles` and bounced immediately).
  const loadedRef = useRef(false);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { currentBookRef.current = currentBook; }, [currentBook]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // Save progress when navigating away from the player
  useEffect(() => {
    return () => {
      const p = playerRef.current;
      const book = currentBookRef.current;
      const q = queueRef.current;
      if (!loadedRef.current || !p || !book || !q?.length) return;
      console.log(`${TAG} unmount save at ${p.currentTime}s`);
      saveProgressSec(
        book.id as number,
        q[0].id as number,
        p.currentTime,
        p.duration,
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

    const applyBook = async () => {
      if (currentBook && currentBook.id !== bookId && queue && queue?.length > 0) {
        saveProgressSec(
          currentBook.id as number,
          queue[0].id as number,
          player.currentTime,
          player.duration,
        ).catch(err => console.error(`${TAG} save-on-switch failed`, err));
      }

      setCurrentBook(data.audiobook);
      setFiles(data.files);
      setQueue(data.q);
      loadedRef.current = true;

      const next = data.q[0];
      if (!next?.local_path) return;

      player.replace(next.local_path);   // wait for the source to actually load
      await player.seekTo(data.pos / 1000);

      player.setActiveForLockScreen(true, {
        title: data.audiobook.title,           // <- data.audiobook, not the stale currentBook
        artist: data.audiobook.author,
        albumTitle: data.audiobook.title,
        artworkUrl: data.audiobook.cover_art ?? undefined,
      });

      player.play();
    };

    applyBook();
  }, [data]);

  useEffect(() => {
    if (!error) return;
    console.error(`${TAG} load error`, error);
    if ((error as any).noFiles) {
      router.replace(`/book/${bookId}`);
    }
  }, [error]);

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
        <IconButton
          icon="keyboard-arrow-down"
          size="xl"
          color={T.inkMuted}
          onPress={() => router.back()}
          style={styles.backBtn}
        />
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
