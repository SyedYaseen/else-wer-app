import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAudioPlayerStore } from "@/components/store/audio-player-store";
import { FileRow } from "@/data/database/models";
import { formatTime } from "@/utils/formatTime";
import { Dimensions } from "react-native";
import { getFileProgressLcl } from "@/data/database/sync-repo";
import { getFileProgressServer, saveProgress } from "@/data/api/api";
import { getFileProgress } from "@/data/lib/conflict-handling";


const screenHeight = Dimensions.get("window").height;

export default function ChaptersButton() {
    const [show, setShow] = useState(false);
    const files = useAudioPlayerStore(s => s.files)

    return (
        <>
            <TouchableOpacity onPress={() => setShow(true)} style={styles.iconButton}>
                <MaterialIcons name="menu-book" size={28} color="#CCCCCC" />
            </TouchableOpacity>
            <Modal transparent visible={show} animationType="slide">
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.backdrop} onPress={() => setShow(false)} />
                    <View style={styles.bottomSheet}>
                        <Text style={styles.sheetTitle}>Chapters</Text>
                        <FlatList
                            data={files}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => <ChapterText fileRow={item} />}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const ChapterText = ({ fileRow }: { fileRow: FileRow }) => {
    const queue = useAudioPlayerStore(s => s.queue)
    const setQueue = useAudioPlayerStore(s => s.setQueue)
    const files = useAudioPlayerStore(s => s.files)

    if (!queue || queue.length === 0) {
        return (
            <TouchableOpacity style={styles.option}>
                <Text style={styles.optionTextFaded}>{fileRow.file_name}</Text>
            </TouchableOpacity>
        )
    }

    const current = queue && queue[0]
    const player = useAudioPlayerStore(s => s.player)

    const switchChapter = async () => {
        console.log("Swithcing to ", fileRow.file_name)
        if (fileRow.local_path) {
            const newQueue = files?.filter(f => f.file_id >= fileRow.file_id)
            if (newQueue && newQueue.length > 0) {
                const currentFile = queue[0]
                await saveProgress(currentFile.book_id, currentFile.id, player?.currentTime! * 1000, player?.currentTime! > player?.duration! - 5)
                const pos = await getFileProgress(fileRow.book_id, fileRow.id)

                setQueue(newQueue)
                player?.replace(newQueue[0].local_path!)
                player?.seekTo(pos / 1000)
                player?.play()
            }
        }
    }

    return (
        <TouchableOpacity style={styles.option} onPress={switchChapter}>
            <Text style={[
                current.file_id <= fileRow.file_id ? styles.optionText : styles.optionTextFaded,
                current.file_id === fileRow.file_id && styles.currentFileText
            ]}>{fileRow.file_name}  </Text>

            {fileRow.duration && <Text style={[
                current.file_id <= fileRow.file_id ? styles.optionText : styles.optionTextFaded,
                current.file_id === fileRow.file_id && styles.currentFileText
            ]} >{formatTime(fileRow?.duration / 1000)}</Text>
            }
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    iconButton: { padding: 10, alignItems: "center" },
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
        maxHeight: screenHeight / 2, // half the screen
        width: "100%",
        backgroundColor: "#222",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
    },
    sheetTitle: { color: "#fff", fontSize: 18, marginBottom: 10 },
    option: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingVertical: 6
    },
    currentFileText: {
        fontSize: 18,
        fontWeight: "bold" // optional, to emphasize
    },
    optionText: { color: "#fff", fontSize: 16 },
    optionTextFaded: { color: "#fff", opacity: 0.7, fontSize: 16 },


});
