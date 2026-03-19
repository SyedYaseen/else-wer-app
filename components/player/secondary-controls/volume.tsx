// components/player/secondary-controls/volume.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import React, { useState, useRef } from "react";
import { Text, TouchableOpacity, Modal, StyleSheet, UIManager, findNodeHandle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from '@/components/hooks/useTheme';

export default function VolumeButton() {
    const T = useTheme();
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
                onPress={() => { measureButton(); setShow(true); }}
                style={styles.iconButton}
            >
                <MaterialIcons name="volume-up" size={26} color={T.inkMuted} />
            </TouchableOpacity>

            <Modal transparent visible={show} animationType="none">
                <TouchableOpacity style={styles.overlay} onPress={() => setShow(false)} activeOpacity={1}>
                    {anchorPos && (
                        <Text style={[
                            styles.optionText,
                            {
                                color: T.inkMuted,
                                backgroundColor: T.surface,
                                borderColor: T.inkHairline,
                                position: 'absolute',
                                left: anchorPos.x + anchorPos.width / 2 - 50,
                                bottom: (globalThis?.window?.innerHeight || 800) - anchorPos.y + 8,
                            },
                        ]}>
                            Volume slider here
                        </Text>
                    )}
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: { padding: 10, alignItems: 'center' },
    overlay: { flex: 1 },
    optionText: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 13,
        padding: 12,
        borderRadius: 10,
        borderWidth: 0.5,
        width: 140,
        textAlign: 'center',
    },
});