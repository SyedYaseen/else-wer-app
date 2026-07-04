// components/player/secondary-controls/sleep-timer.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from '@/theme';
import { IconButton, BottomSheet } from '@/components/ui';

export default function SleepTimerButton() {
    const T = useTheme();
    const [show, setShow] = useState(false);

    return (
        <>
            <IconButton icon="access-time" size="xl" tone={T.inkMuted} onPress={() => setShow(true)} />

            <BottomSheet visible={show} onClose={() => setShow(false)}>
                <Text style={[styles.sheetTitle, { color: T.ink }]}>Sleep timer</Text>
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
});