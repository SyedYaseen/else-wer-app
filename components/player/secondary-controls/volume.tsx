// components/player/secondary-controls/volume.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import React from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from '@/theme';
import { IconButton, BottomSheet, useDisclosure } from '@/components/ui';

export default function VolumeButton() {
    const T = useTheme();
    const { visible, open, close } = useDisclosure();

    return (
        <>
            <IconButton icon="volume-up" size="xl" color={T.inkMuted} onPress={open} />

            <BottomSheet visible={visible} onClose={close}>
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