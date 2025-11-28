import { View, Text, StyleSheet } from 'react-native'
import { DownloadItem, useDownloadStore } from '@/components/store/download-strore';
import Progress from '@/components/downloads/progress';
import { MaterialIcons } from '@expo/vector-icons';

interface BookGroup {
  bookId: number;
  author: string;
  title: string;
  totalProgress: number;
  totalSize: number;
  status: string;
  files: DownloadItem[];
}

// --- CONSTANTS & THEMING ---
const COLORS = {
  BACKGROUND: '#121212',
  CARD_BACKGROUND: '#1E1E1E',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#B3B3B3',
  BORDER: '#333333',
  PROGRESS_GREEN: '#4CAF50',
  PROGRESS_BLUE: '#2196F3',
};

const groupItemsByBook = (items: Record<string, DownloadItem>): Record<number, BookGroup> => {
  const grouped: Record<number, BookGroup> = {};

  Object.values(items).forEach(item => {
    const id = item.bookId;

    if (!grouped[id]) {
      // Initialize the group if it doesn't exist
      grouped[id] = {
        bookId: id,
        title: item.title,
        author: item.author || 'Unknown Author',
        totalProgress: 0,
        totalSize: 0,
        status: 'pending', // Will be determined below
        files: [],
      };
    }

    grouped[id].totalProgress += item.progress;
    grouped[id].totalSize += item.fileSize;
    grouped[id].files.push(item);
  });

  // Derive overall status for the group
  Object.values(grouped).forEach(group => {
    const isDownloading = group.files.some(f => f.status === 'downloading');
    const isPaused = group.files.some(f => f.status === 'paused');
    const isComplete = group.totalProgress === group.totalSize && group.totalSize > 0;

    if (isComplete) {
      group.status = 'completed';
    } else if (isDownloading) {
      group.status = 'downloading';
    } else if (isPaused) {
      group.status = 'paused';
    } else {
      group.status = 'idle';
    }
  });

  return grouped;
};

const ProgressBar = ({ progressPcnt, status }: { progressPcnt: number, status: string }) => {
  let color = COLORS.PROGRESS_BLUE;
  if (status === 'completed') color = COLORS.PROGRESS_GREEN;
  else if (status === 'paused' || status === 'idle') color = COLORS.TEXT_SECONDARY;

  return (
    <View style={styles.barContainer}>
      <View style={[
        styles.progressBar,
        { width: `${progressPcnt}%`, backgroundColor: color }
      ]} />
    </View>
  );
};

export default function DownloadTab() {
  const items = useDownloadStore(s => s.items) as Record<string, DownloadItem>;

  // Group the files whenever the items change
  const groupedBooks = groupItemsByBook(items);
  const bookList = Object.values(groupedBooks);

  if (bookList.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>No active downloads found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bookList.map(book => {
        const overallPcnt = (book.totalProgress / book.totalSize) * 100;

        return (
          <View key={book.bookId} style={styles.card}>
            <View style={styles.mainContent}>
              {/* Left Side: Book/Author Details */}
              <View style={styles.textDetails}>
                <Text style={styles.bookNameText} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={styles.authorText} numberOfLines={1}>
                  By {book.author}
                </Text>
              </View>

              {/* Right Side: Overall Progress */}
              <View style={styles.progressArea}>
                <Text style={[styles.statusText, { color: COLORS.TEXT_SECONDARY }]}>
                  {book.status.toUpperCase()}
                </Text>
                <Text style={styles.progressText}>
                  {overallPcnt.toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* Full Width Progress Bar (Overall Book Progress) */}
            <ProgressBar progressPcnt={overallPcnt} status={book.status} />
            {/* Optional: Show individual files below the main bar */}
            <View style={styles.fileList}>
              {book.files.map(file => {
                const filePcnt = (file.progress / file.fileSize) * 100;
                return (
                  <View key={file.fileId} style={styles.fileItem}>
                    <MaterialIcons
                      name="book"
                      size={14}
                      color={COLORS.TEXT_SECONDARY}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={styles.fileNameText} numberOfLines={1}>
                      {file.fileName}
                    </Text>
                    <Text style={styles.fileProgressText}>
                      {filePcnt.toFixed(2)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// --- STYLESHEETS ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: COLORS.BACKGROUND,
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
  card: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 10,
    elevation: 2,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  textDetails: {
    flex: 1,
    paddingRight: 10,
  },
  bookNameText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 2,
  },
  // Progress Bar Styles
  barContainer: {
    height: 4,
    width: '100%',
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressArea: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  // File List Styles (for nested files)
  fileList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fileNameText: {
    flex: 1, // Allows file name to take up available space
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  fileProgressText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginLeft: 10,
    fontWeight: '500',
  }
});
