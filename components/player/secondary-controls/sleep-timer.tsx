// components/player/secondary-controls/sleep-timer.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from '@/components/hooks/useTheme';

export default function SleepTimerButton() {
    const T = useTheme();
    const [show, setShow] = useState(false);

    return (
        <>
            <TouchableOpacity onPress={() => setShow(true)} style={styles.iconButton}>
                <MaterialIcons name="access-time" size={26} color={T.inkMuted} />
            </TouchableOpacity>

            <Modal transparent visible={show} animationType="slide">
                <TouchableOpacity style={styles.overlay} onPress={() => setShow(false)}>
                    <View style={[styles.bottomSheet, { backgroundColor: T.surface, borderTopColor: T.inkHairline }]}>
                        <Text style={[styles.sheetTitle, { color: T.ink }]}>Sleep timer</Text>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: { padding: 10, alignItems: 'center' },
    overlay: { flex: 1 },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderTopWidth: 0.5,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
    },
    sheetTitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        marginBottom: 10,
    },
});