import { useAudioPlayerStore } from "@/components/store/audio-player-store";
import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, UIManager, findNodeHandle } from "react-native";

const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlaybackSpeedButton() {
    const [speed, setSpeed] = useState(1);
    const [showMenu, setShowMenu] = useState(false);
    const [anchorPos, setAnchorPos] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const btnRef = useRef(null);

    const player = useAudioPlayerStore(s => s.player)

    const measureButton = () => {
        const node = findNodeHandle(btnRef.current);
        if (!node) return;
        UIManager.measureInWindow(node, (x, y, width, height) => {
            setAnchorPos({ x, y, width, height });
        });
    };

    return (
        <>
            <TouchableOpacity
                ref={btnRef}
                onPress={() => {
                    measureButton();
                    setShowMenu(true);
                }}
                style={styles.iconButton}
            >
                <Text style={styles.speedText}>{speed}x</Text>
            </TouchableOpacity>

            <Modal transparent visible={showMenu} animationType="none">
                <TouchableOpacity style={styles.overlay} onPress={() => setShowMenu(false)} activeOpacity={1}>
                    {anchorPos && (
                        <View
                            style={[
                                styles.popover,
                                {
                                    position: "absolute",
                                    left: anchorPos.x + anchorPos.width / 2 - 50,
                                    bottom: (globalThis?.window?.innerHeight || 800) - anchorPos.y + 8,
                                },
                            ]}
                        >
                            {speeds.map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.option, s === speed && styles.selectedOption]}
                                    onPress={() => {
                                        setSpeed(s)
                                        player!.shouldCorrectPitch = true;
                                        player?.setPlaybackRate(s)

                                        setShowMenu(false)
                                    }}
                                >
                                    <Text style={[styles.optionText, s === speed && styles.selectedOptionText]}>{s}x</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: { padding: 10, alignItems: "center" },
    speedText: { fontSize: 16, color: "#CCCCCC", fontWeight: "600" },
    overlay: { flex: 1 },
    popover: { backgroundColor: "#222", borderRadius: 8, padding: 6, width: 100 },
    option: { paddingVertical: 6, alignItems: "center" },
    selectedOption: { backgroundColor: "#116FAF", borderRadius: 6 },
    optionText: { color: "#fff", fontSize: 16 },
    selectedOptionText: { fontWeight: "700" },
});
