// app/(tabs)/downloads.tsx — Folio Downloads Screen
// Built on the shared components/ui primitive layer — see DESIGN_SYSTEM.md.

import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BookProgressData, DownloadItem, useDownloadStore } from '@/components/store/download-store';
import { useTheme, Theme } from '@/theme';
import { Card, Pill, ProgressBar, Text } from '@/components/ui';

// ── Types ────────────────────────────────────────────────────────────────────
interface BookGroup {
  bookId: number;
  author: string;
  title: string;
  totalProgress: number;
  totalSize: number;
  status: string;
  files: DownloadItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const groupItemsByBook = (
  items: Record<string, DownloadItem>,
  overallProgress: Record<number, BookProgressData>
): Record<number, BookGroup> => {
  const grouped: Record<number, BookGroup> = {};

  Object.values(items).forEach(item => {
    const id = item.bookId;
    if (!grouped[id]) {
      grouped[id] = {
        bookId: id,
        title: item.title,
        author: item.author || 'Unknown Author',
        totalProgress: 0,
        totalSize: 0,
        status: 'pending',
        files: [],
      };
    }
    grouped[id].files.push(item);
  });

  Object.values(grouped).forEach(group => {
    const bp = overallProgress[group.bookId];
    group.totalProgress = bp?.currentProgress ?? group.totalProgress;
    group.totalSize = bp?.totalSize ?? group.totalSize;

    const isDownloading = group.files.some(f => f.status === 'downloading');
    const isPaused = group.files.some(f => f.status === 'paused');
    const isComplete =
      group.totalProgress === group.totalSize && group.totalSize > 0;

    if (isComplete) group.status = 'completed';
    else if (isDownloading) group.status = 'downloading';
    else if (isPaused) group.status = 'paused';
    else group.status = 'idle';
  });

  return grouped;
};

const getStatusColor = (status: string, T: Theme): string => {
  switch (status) {
    case 'completed': return T.sage;
    case 'downloading': return T.accent;
    default: return T.inkSubtle;
  }
};

const getStatusTone = (status: string): 'sage' | 'accent' | 'neutral' => {
  switch (status) {
    case 'completed': return 'sage';
    case 'downloading': return 'accent';
    default: return 'neutral';
  }
};

const statusLabel = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

// ── Screen ───────────────────────────────────────────────────────────────────
export default function DownloadTab() {
  const T = useTheme();
  const items = useDownloadStore(s => s.items) as Record<string, DownloadItem>;
  const overallProgress = useDownloadStore(s => s.bookProgress) as Record<number, BookProgressData>
  const clearAllDownloads = useDownloadStore(s => s.clearAllDownloads);
  const bookList = Object.values(groupItemsByBook(items, overallProgress));

  if (bookList.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: T.background }]}>
        <MaterialIcons name="arrow-circle-down" size={40} color={T.inkHairline} />
        <Text style={[styles.emptyTitle, { color: T.ink }]}>No downloads</Text>
        <Text style={[styles.emptyBody, { color: T.inkSubtle }]}>
          Files you download will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.background }}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: T.inkHairline,
            backgroundColor: T.background,
          },
        ]}
      >
        <TouchableOpacity
          onPress={clearAllDownloads}
          disabled={bookList.length === 0}
          style={[
            styles.clearBtn,
            {
              backgroundColor: T.surface,
              borderColor: T.inkHairline,
            },
            {
              opacity: bookList.length === 0 ? 0.4 : 1,
            }
          ]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="clear-all" size={16} color={T.danger} />
          <Text style={[styles.clearText, { color: T.danger }]}>
            Clear all
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={[styles.container, { backgroundColor: T.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {bookList.map(book => {
          const overallPcnt =
            book.totalSize > 0 && !isNaN(book.totalSize)
              ? (book.totalProgress / book.totalSize) * 100
              : 0;
          const spineColor = getStatusColor(book.status, T);

          return (
            <Card key={book.bookId} style={styles.card}>
              {/* ── Header ── */}
              <View style={styles.cardHeader}>
                {/* Status spine */}
                <View style={[styles.spine, { backgroundColor: spineColor }]} />

                <View style={styles.headerText}>
                  <Text
                    style={[styles.bookTitle, { color: T.ink }]}
                    numberOfLines={1}
                  >
                    {book.title}
                  </Text>
                  <Text
                    style={[styles.authorText, { color: T.inkMuted }]}
                    numberOfLines={1}
                  >
                    {book.author}
                  </Text>
                </View>

                {/* Status badge */}
                <Pill label={statusLabel(book.status)} tone={getStatusTone(book.status)} />
              </View>

              {/* ── Overall progress ── */}
              <View style={styles.progressRow}>
                <ProgressBar progress={overallPcnt / 100} tone={spineColor} height={2} style={{ flex: 1 }} />
                <Text style={[styles.progressPcnt, { color: T.inkMuted }]}>
                  {overallPcnt.toFixed(0)}%
                </Text>
              </View>

              {/* ── File list ── */}
              <View style={[styles.fileList, { borderTopColor: T.inkHairline }]}>
                {book.files.map(file => {
                  const filePcnt =
                    file.fileSize > 0
                      ? (file.progress / file.fileSize) * 100
                      : 0;
                  return (
                    <View key={file.fileId} style={styles.fileRow}>
                      <MaterialIcons
                        name="headphones"
                        size={12}
                        color={T.inkSubtle}
                      />
                      <Text
                        style={[styles.fileName, { color: T.inkSubtle }]}
                        numberOfLines={1}
                      >
                        {file.fileName}
                      </Text>
                      <Text style={[styles.filePcnt, { color: T.inkSubtle }]}>
                        {filePcnt.toFixed(0)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View >
  );
}

// ── Styles (layout only — no colour values) ──────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
  },

  clearText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    marginTop: 8,
  },
  emptyBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },

  // Card
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    paddingVertical: 14,
    gap: 12,
  },
  spine: {
    width: 3,
    height: 44,
  },
  headerText: { flex: 1 },
  bookTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 16,
    lineHeight: 20,
  },
  authorText: {
    fontFamily: 'DMSans_300Light',
    fontSize: 12,
    marginTop: 2,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  progressPcnt: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    minWidth: 30,
    textAlign: 'right',
  },

  // File list
  fileList: {
    borderTopWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileName: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
  },
  filePcnt: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
});
