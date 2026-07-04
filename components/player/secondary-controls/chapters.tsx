// components/player/secondary-controls/chapters.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayerStore } from "@/components/store/audio-player-store";
import { FileRow } from "@/data/database/models";
import { formatTime } from "@/utils/formatTime";
import { getFileProgressLcl } from "@/data/database/sync-repo";
import { getFileProgressServer, saveProgressSec } from "@/data/api/api";
import { getFileProgress } from "@/data/lib/conflict-handling";
import { useTheme } from '@/theme';
import { IconButton, BottomSheet, useDisclosure } from '@/components/ui';

const screenHeight = Dimensions.get("window").height;

export default function ChaptersButton() {
    const T = useTheme();
    const { visible, open, close } = useDisclosure();
    const files = useAudioPlayerStore(s => s.files);

    return (
        <>
            <IconButton icon="menu-book" size="xl" color={T.inkMuted} onPress={open} />

            <BottomSheet
                visible={visible}
                onClose={close}
                style={{
                    maxHeight: screenHeight * 0.55,
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    paddingBottom: 32,
                }}
            >
                <View style={[styles.sheetHandle, { backgroundColor: T.inkHairline }]} />
                <Text style={[styles.sheetTitle, { color: T.ink }]}>Chapters</Text>
                <FlatList
                    data={files}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => <ChapterRow fileRow={item} />}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => (
                        <View style={[styles.separator, { backgroundColor: T.inkHairline }]} />
                    )}
                />
            </BottomSheet>
        </>
    );
}

const ChapterRow = ({ fileRow }: { fileRow: FileRow }) => {
    const T = useTheme();
    const queue = useAudioPlayerStore(s => s.queue);
    const setQueue = useAudioPlayerStore(s => s.setQueue);
    const files = useAudioPlayerStore(s => s.files);
    const player = useAudioPlayerStore(s => s.player);

    if (!queue || queue.length === 0) {
        return (
            <TouchableOpacity style={styles.chapterRow}>
                <Text style={[styles.chapterName, { color: T.inkSubtle }]}>{fileRow.file_name}</Text>
            </TouchableOpacity>
        );
    }

    const current = queue[0];

    const switchChapter = async () => {
        console.log("Switching to ", fileRow.file_name);
        if (fileRow.local_path) {
            const newQueue = files?.filter(f => f.id >= fileRow.id);
            if (newQueue && newQueue.length > 0) {
                const currentFile = queue[0];
                const currentTime = player?.currentTime ?? 0;
                const duration = player?.duration ?? 0;
                // setQueue before the awaits below so app/player/[id].tsx's
                // queueRef (used by its unmount-save effect) doesn't stay stale
                // for the duration of the network round trip if unmounted mid-await.
                setQueue(newQueue);
                await saveProgressSec(
                    currentFile.book_id,
                    currentFile.id,
                    currentTime,
                    duration,
                );
                const pos = await getFileProgress(fileRow.book_id, fileRow.id);
                player?.replace(newQueue[0].local_path!);
                player?.seekTo(pos / 1000);
                player?.play();
            }
        }
    };

    const isPlayed = current.id > fileRow.id;
    const isCurrent = current.id === fileRow.id;

    return (
        <TouchableOpacity style={styles.chapterRow} onPress={switchChapter}>
            {/* Active indicator */}
            <View style={[
                styles.activeBar,
                { backgroundColor: isCurrent ? T.accent : 'transparent' },
            ]} />

            <View style={styles.chapterMeta}>
                <Text style={[
                    styles.chapterName,
                    { color: isPlayed ? T.inkSubtle : T.ink },
                    isCurrent && { fontFamily: 'DMSans_500Medium', color: T.ink },
                ]} numberOfLines={1}>
                    {fileRow.file_name}
                </Text>
                {fileRow.duration ? (
                    <Text style={[styles.chapterDuration, { color: T.inkSubtle }]}>
                        {formatTime(fileRow.duration / 1000)}
                    </Text>
                ) : null}
            </View>

            {isCurrent && (
                <MaterialIcons name="volume-up" size={14} color={T.accent} style={styles.nowIcon} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
    },
    sheetTitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        marginBottom: 12,
    },

    separator: { height: 0.5, marginLeft: 16 },

    chapterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeBar: {
        width: 3,
        height: 32,
        borderRadius: 2,
        marginRight: 12,
    },
    chapterMeta: {
        flex: 1,
        gap: 2,
    },
    chapterName: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 14,
    },
    chapterDuration: {
        fontFamily: 'DMSans_300Light',
        fontSize: 11,
    },
    nowIcon: {
        marginLeft: 8,
    },
});