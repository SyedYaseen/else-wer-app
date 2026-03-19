// app/book/[id].tsx — Folio Book Details
import LoadingSpinner from '@/components/common/loading-spinner';
import { fetchFileMetaFromServer, removeLocalBook as removeDownloadedBook } from '@/data/api/api';
import { deleteBookDb, getAllBooks, getBook, getFilesForBook, markBookDownloaded, upsertFiles } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Audiobook, FileRow } from '@/data/database/models';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDownloadStore } from '@/components/store/download-strore';
import { Paths } from 'expo-file-system';
import Progress from '@/components/downloads/progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/hooks/useTheme';

type BookParams = {
  id: string;
  title: string;
  author: string;
};

export default function BookDetails() {
  const { id, title, author } = useLocalSearchParams<BookParams>();
  const bookId = parseInt(id);
  const [book, setBook] = useState<Audiobook>();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const router = useRouter();

  const startDownload = useDownloadStore((s) => s.startDownload);
  const bookProgress = useDownloadStore((s) => s.bookProgress);
  const setBookProgress = useDownloadStore((s) => s.setBookProgress);
  const server = useAudioPlayerStore((s) => s.server);
  const setServer = useAudioPlayerStore((s) => s.setServer);

  // ── theme + safe area (L&F only) ─────────────────────────────────────────
  const T = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!server) {
      (async () => {
        const savedServer = await AsyncStorage.getItem("server");
        if (savedServer) setServer(savedServer);
      })();
    }
  }, [server]);

  // Load book - Do not use global state. Use that only for player
  useEffect(() => {
    getBook(bookId).then(b => {
      if (b) {
        setBook(b);

        const currBookProg = bookProgress[bookId];
        if (!currBookProg) {
          setBookProgress(bookId, b?.book_size);
        } else {
          if (currBookProg.currentProgress < currBookProg.totalSize) {
            setIsDownloading(true);
          }
        }
      }
    });

    getFilesForBook(bookId).then(res => {
      if (res.length > 0) {
        setIsDownloaded(true);
        setIsDownloading(false);
      }
    });
  }, [bookId]);

  const handleDownload = async () => {
    try {
      // await handleDelete()
    } catch (Err) {
      console.warn("Failed to delete book");
    }

    setIsDownloading(true);
    const { data: fileRows, count }: { data: FileRow[], count: number } = await fetchFileMetaFromServer(bookId);

    for (const f of fileRows) {
      f.local_path = await startDownload({ bookId: f.book_id, fileId: f.file_id, fileName: f.file_name, fileSize: f.file_size, author: book?.author, title: book?.title });
      console.log("local path from book details", f);
    }

    await upsertFiles(fileRows);

    try {
      markBookDownloaded(bookId, Paths.join(Paths.document, "audiobooks", bookId.toString()).toString());
      setIsDownloaded(true);
    } catch (err) {
      console.error(`Failed to download ${bookId}:`, err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBookDb(bookId);
      await removeDownloadedBook(bookId);
      setBookProgress(bookId, book?.book_size);
      setIsDownloaded(false);
    } catch (err) {
      console.error(`Failed to delete ${bookId}:`, err);
    }
  };

  const handlePlay = async () => {
    router.push(`/player/${id}`);
  };

  // ─────────────────────────────────────────────────────────────────────────

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

            {!isDownloaded && !isDownloading &&
              <TouchableOpacity onPress={handleDownload}>
                <MaterialIcons name='download' size={32} color={T.accent} />
              </TouchableOpacity>
            }
            {!isDownloading && isDownloaded &&
              <TouchableOpacity onPress={handlePlay}>
                <MaterialIcons name='play-circle' size={32} color={T.accent} />
              </TouchableOpacity>
            }
            {isDownloaded &&
              <TouchableOpacity onPress={handleDelete}>
                <MaterialIcons name='delete' size={32} color={T.danger} />
              </TouchableOpacity>
            }
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
  },
  authorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
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