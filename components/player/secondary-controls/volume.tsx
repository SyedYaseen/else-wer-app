// components/player/secondary-controls/volume.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from '@/theme';
import { IconButton, BottomSheet } from '@/components/ui';

export default function VolumeButton() {
    const T = useTheme();
    const [show, setShow] = useState(false);

    return (
        <>
            <IconButton icon="volume-up" size="xl" tone={T.inkMuted} onPress={() => setShow(true)} />

            <BottomSheet visible={show} onClose={() => setShow(false)}>
                <Text style={[styles.sheetTitle, { color: T.ink }]}>Volume</Text>
                <Text style={[styles.placeholder, { color: T.inkSubtle }]}>Volume slider here</Text>
            </BottomSheet>
        </>
    );
}

const styles = StyleSheet.create({
    sheetTitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        marginBottom: 10,
    },
    placeholder: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 13,
    },
});