import LoadingSpinner from '@/components/common/loading-spinner';
import { fetchFileMetaFromServer, removeLocalBook as removeDownloadedBook } from '@/data/api/api';
import { deleteBookDb, getBook, getFilesForBook, markBookDownloaded, upsertFiles } from '@/data/database/audiobook-repo';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'
import { Audiobook, FileRow } from '@/data/database/models';
import { useAudioPlayerStore } from '@/components/store/audio-player-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDownloadStore } from '@/components/store/download-strore';
import Downloads from '@/components/downloads/downloads';
import { Paths } from 'expo-file-system';
import Progress from '@/components/downloads/progress'
type BookParams = {
  id: string;
  title: string;
  author: string;
};

export default function BookDetails() {
  const { id, title, author } = useLocalSearchParams<BookParams>();
  const bookId = parseInt(id);
  const [book, setBook] = useState<Audiobook>();
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const router = useRouter()

  const startDownload = useDownloadStore((s) => s.startDownload)
  const bookProgress = useDownloadStore((s) => s.bookProgress)
  const setBookProgress = useDownloadStore((s) => s.setBookProgress)
  const server = useAudioPlayerStore((s) => s.server);
  const setServer = useAudioPlayerStore((s) => s.setServer);

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
        setBook(b)

        const currBookProg = bookProgress[bookId]
        if (!currBookProg) {
          setBookProgress(bookId, b?.book_size)
        } else {
          if (currBookProg.currentProgress < currBookProg.totalSize) {
            setIsDownloading(true)
          }
        }
      }
    })

    getFilesForBook(bookId).then(res => {
      if (res.length > 0) {
        setIsDownloaded(true)
        setIsDownloading(false)
      }
    })
  }, [bookId])



  const handleDownload = async () => {
    //try {
    try {
      //  await handleDelete()
    } catch (Err) {
      console.warn("Failed to delete book")
    }

    setIsDownloading(true);
    const { data: fileRows, count }: { data: FileRow[], count: number } = await fetchFileMetaFromServer(bookId)

    //let start = performance.now()

    for (const f of fileRows) {
      f.local_path = await startDownload({ bookId: f.book_id, fileId: f.file_id, fileName: f.file_name, fileSize: f.file_size })
      console.log("local path from book details", f)
    }

    //const end = performance.now();
    //const ms = end - start;
    //console.log(`Time to download === ${ms.toFixed(2)}ms`);

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
      await deleteBookDb(bookId)
      await removeDownloadedBook(bookId)
      setBookProgress(bookId, book?.book_size)
      setIsDownloaded(false)
    } catch (err) {
      console.error(`Failed to delete ${bookId}:`, err);
    }
  }

  const handlePlay = async () => {
    router.push(`/player/${id}`)
  }

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        {server && book?.cover_art && <Image
          source={{
            uri: `${server}${book?.cover_art}`
          }}
          style={styles.coverImage}
        />
        }
      </View>

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.authorText}>{author}</Text>
        </View>
        <View style={styles.actions}>
          {isDownloading && (
            <Progress bookId={bookId} />
          )}
          {!isDownloaded && !isDownloading &&
            <TouchableOpacity onPress={handleDownload}>
              <MaterialIcons name='download' size={40} color="#CCCCCC" />
            </TouchableOpacity>}
          {!isDownloading && isDownloaded &&
            <TouchableOpacity onPress={handlePlay}>
              <MaterialIcons name='play-circle' size={40} color="#CCCCCC" />
            </TouchableOpacity>
          }
          {isDownloaded &&
            <TouchableOpacity onPress={handleDelete}>
              <MaterialIcons name='delete' size={40} color="#CCCCCC" />
            </TouchableOpacity>
          }
        </View>
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.descriptionText}>
          The Hobbit is set in Middle-earth and follows home-loving Bilbo Baggins, the titular hobbit who joins the wizard Gandalf and the thirteen dwarves of Thorin's Company on a quest to reclaim the dwarves' home and treasure from the dragon Smaug.
        </Text>
      </View>
      <Downloads />
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#1C1C1E',
  },
  coverContainer: {
    height: 300,
    width: '100%',
  },
  coverImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCCCCC',
  },
  authorText: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  descriptionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#CCCCCC',
  },
});
