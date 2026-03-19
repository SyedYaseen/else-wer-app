// components/player/secondary-controls/chapters.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayerStore } from "@/components/store/audio-player-store";
import { FileRow } from "@/data/database/models";
import { formatTime } from "@/utils/formatTime";
import { getFileProgressLcl } from "@/data/database/sync-repo";
import { getFileProgressServer, saveProgress } from "@/data/api/api";
import { getFileProgress } from "@/data/lib/conflict-handling";
import { useTheme } from '@/components/hooks/useTheme';

const screenHeight = Dimensions.get("window").height;

export default function ChaptersButton() {
    const T = useTheme();
    const [show, setShow] = useState(false);
    const files = useAudioPlayerStore(s => s.files);

    return (
        <>
            <TouchableOpacity onPress={() => setShow(true)} style={styles.iconButton}>
                <MaterialIcons name="menu-book" size={26} color={T.inkMuted} />
            </TouchableOpacity>

            <Modal transparent visible={show} animationType="slide">
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.backdrop} onPress={() => setShow(false)} />
                    <View style={[styles.bottomSheet, { backgroundColor: T.surface, borderTopColor: T.inkHairline }]}>
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
                    </View>
                </View>
            </Modal>
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
            const newQueue = files?.filter(f => f.file_id >= fileRow.file_id);
            if (newQueue && newQueue.length > 0) {
                const currentFile = queue[0];
                await saveProgress(
                    currentFile.book_id,
                    currentFile.id,
                    player?.currentTime! * 1000,
                    player?.currentTime! > player?.duration! - 5,
                );
                const pos = await getFileProgress(fileRow.book_id, fileRow.id);
                setQueue(newQueue);
                player?.replace(newQueue[0].local_path!);
                player?.seekTo(pos / 1000);
                player?.play();
            }
        }
    };

    const isPlayed = current.file_id > fileRow.file_id;
    const isCurrent = current.file_id === fileRow.file_id;

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
    iconButton: { padding: 10, alignItems: 'center' },

    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject },

    bottomSheet: {
        maxHeight: screenHeight * 0.55,
        width: '100%',
        borderTopWidth: 0.5,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 10,
    },
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