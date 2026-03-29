// app/book/[id].tsx — Folio Book Details
import LoadingSpinner from '@/components/common/loading-spinner';
import { fetchFileMetaFromServer, removeLocalBook as removeDownloadedBook } from '@/data/api/api';
import { deleteBookDb, getLocalBooks, getBook, getFilesForBook, markBookDownloaded, upsertFiles } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Audiobook, FileRow } from '@/data/database/models';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDownloadStore } from '@/components/store/download-strore';
import { Directory, Paths } from 'expo-file-system';
import Progress from '@/components/downloads/progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/hooks/useTheme';
import { File } from 'expo-file-system';
import { useQuery, useQueryClient } from '@tanstack/react-query';
type BookParams = {
  id: string;
  title: string;
  author: string;
};

export default function BookDetails() {
  const { id, title, author } = useLocalSearchParams<BookParams>();
  const bookId = parseInt(id);
  // const [book, setBook] = useState<Audiobook>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const startDownload = useDownloadStore((s) => s.startDownload);
  const downloadProgress = useDownloadStore((s) => s.bookProgress[bookId]);
  const setBookSz = useDownloadStore((s) => s.setBookSz);
  const resetDownload = useDownloadStore((s) => s.resetDownload);
  const server = useAudioPlayerStore((s) => s.server);
  const setServer = useAudioPlayerStore((s) => s.setServer);

  // ── theme + safe area (L&F only) ─────────────────────────────────────────
  const T = useTheme();
  const insets = useSafeAreaInsets();

  // GetData
  const { data: book, isLoading: isBookLoading, error: bookErr } = useQuery({
    queryKey: ['bookRows', bookId],
    queryFn: () => getBook(bookId),
  });

  const { data: files, isLoading: isFilesLoading, error: filesErr } = useQuery({
    queryKey: ['files', bookId],
    queryFn: () => getFilesForBook(bookId),
  });

  // DerivedState
  const isDownloaded = useMemo(() => {
    if (!files || files.length === 0) return false;
    return files.every(f => f.local_path && new File(f.local_path).exists);
  }, [files]);

  const isDownloading = useMemo(() => {
    if (!downloadProgress) return false;
    return downloadProgress.currentProgress > 0 &&
      downloadProgress.currentProgress < downloadProgress.totalSize;
  }, [downloadProgress]);

  // TODO: Is this server setting necessary? Currently pulls cover art from server, refactor later to avoid this
  useEffect(() => {
    if (!server) {
      (async () => {
        const savedServer = await AsyncStorage.getItem("server");
        if (savedServer) setServer(savedServer);
      })();
    }
  }, [server]);

  const handleDownload = async () => {
    setBookSz(bookId, book?.book_size)
    const { data: fileRows, count }: { data: FileRow[], count: number } = await fetchFileMetaFromServer(bookId);

    for (const f of fileRows) {
      f.local_path = await startDownload({ bookId: f.book_id, fileId: f.file_id, fileName: f.file_name, fileSize: f.file_size, author: book?.author, title: book?.title });
      console.log("local path from book details", f);
    }

    await upsertFiles(fileRows);

    markBookDownloaded(
      bookId,
      Paths.join(Paths.document, 'audiobooks', bookId.toString())
    );

    queryClient.invalidateQueries({ queryKey: ['files', bookId] });
  };

  const handleDelete = async () => {
    try {
      await deleteBookDb(bookId);
      await removeDownloadedBook(bookId);
      resetDownload(bookId);

      queryClient.invalidateQueries({ queryKey: ['files', bookId] });
    } catch (err) {
      console.error(`Failed to delete ${bookId}:`, err);
    }
  };

  const handlePlay = async () => {
    router.push(`/player/${id}`);
  };

  // if (isBookLoading || isFilesLoading) {
  //   return <LoadingSpinner />;
  // }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={[styles.container, { backgroundColor: T.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Cover */}
        <View style={styles.coverContainer}>
          {server && book?.cover_art && (
            <Image
              source={{ uri: `${server}${book?.cover_art}` }}
              style={styles.coverImage}
            />
          )}
          {/* Back button overlaid on cover, clears notch */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={[styles.backBtnPill, { backgroundColor: T.background + 'CC' }]}>
              <MaterialIcons name="arrow-back" size={18} color={T.ink} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Title + actions row */}
        <View style={[styles.header, { borderBottomColor: T.inkHairline }]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.titleText, { color: T.ink }]}>{title}</Text>
            <Text style={[styles.authorText, { color: T.inkMuted }]}>{author}</Text>
          </View>
          <View style={styles.actions}>
            {isDownloading && (
              <Progress bookId={bookId} />
            )}

            <TouchableOpacity onPress={handleDownload}
              disabled={isDownloaded || isDownloading}
            >
              <MaterialIcons name='download' size={32} color={T.accent} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlay} disabled={!isDownloaded} >
              <MaterialIcons name='play-circle' size={32} color={T.accent} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} disabled={!isDownloaded}>
              <MaterialIcons name='delete' size={32} color={T.danger} />
            </TouchableOpacity>

          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionTitle, { color: T.ink }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: T.inkMuted }]}>
            The Hobbit is set in Middle-earth and follows home-loving Bilbo Baggins, the titular hobbit who joins the wizard Gandalf and the thirteen dwarves of Thorin's Company on a quest to reclaim the dwarves' home and treasure from the dragon Smaug.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Cover
  coverContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    flex: 1,
    width: undefined,
    height: undefined,
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
  },
  backBtnPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header row
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  titleText: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
    textTransform: 'capitalize'
  },
  authorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    textTransform: 'capitalize'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Description
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  descriptionTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 18,
    marginBottom: 6,
  },
  descriptionText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
});