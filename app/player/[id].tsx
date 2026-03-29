import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getLocalBooks, getBook, getFilesForBook } from '@/data/database/audiobook-repo';
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

  const shouldFetch = !!player && !!bookId && (!currentBook || currentBook.id !== bookId);

  const { isLoading, error, data } = useQuery({
    queryKey: ['player-book', bookId],
    queryFn: async () => {
      // Save progress for the previously playing book before switching
      if (currentBook && !!queue && queue?.length > 0) {
        await saveProgress(
          currentBook.id as number,
          queue[0].id as number,
          player!.currentTime * 1000,
          player!.currentTime > player!.duration - 3,
        );
      }
      return loadBookData(bookId);
    },
    enabled: shouldFetch,
  });

  useEffect(() => {
    if (!error) return;
    if ((error as any).noFiles) {
      router.replace(`/book/${bookId}`);
    }
  }, [error]);

  useEffect(() => {
    if (!data || !player) return;
    setCurrentBook(data.audiobook);
    setFiles(data.files);
    setQueue(data.q);
    const next = data.q[0];
    if (next?.local_path) {
      player.replace(next.local_path);
      player.seekTo(data.pos / 1000);
      player.play();
    }
  }, [data]);

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