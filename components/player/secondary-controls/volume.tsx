import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, UIManager, findNodeHandle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function VolumeButton() {
    const [show, setShow] = useState(false);
    const [anchorPos, setAnchorPos] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const btnRef = useRef(null);

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
                    setShow(true);
                }}
                style={styles.iconButton}
            >
                <MaterialIcons name="volume-up" size={28} color="#555" />
            </TouchableOpacity>

            <Modal transparent visible={show} animationType="none">
                <TouchableOpacity style={styles.overlay} onPress={() => setShow(false)} activeOpacity={1}>
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
                            <Text style={styles.optionText}>Volume Slider Here</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: { padding: 10, alignItems: "center" },
    overlay: { flex: 1 },
    popover: { backgroundColor: "#222", borderRadius: 8, padding: 6, width: 100 },
    optionText: { color: "#fff", fontSize: 16 },
});
