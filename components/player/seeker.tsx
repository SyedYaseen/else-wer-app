// components/player/seeker.tsx — Folio Seeker
// ⚠️ Logic unchanged. L&F only.

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { formatTime } from '@/utils/formatTime';
import { AudioPlayer } from 'expo-audio';
import { useTheme } from '@/components/hooks/useTheme';

export default function Seeker({ player }: { player: AudioPlayer }) {
    const T = useTheme();
    const [seeking, setSeeking] = useState(false);
    const [localTime, setLocalTime] = useState(0);

    return (
        <View style={styles.container}>
            <View style={styles.timeRow}>
                <Text style={[styles.timeText, { color: T.inkSubtle }]}>
                    {formatTime(player.currentTime)}
                </Text>
                <Text style={[styles.timeText, { color: T.inkSubtle }]}>
                    {formatTime(player.duration)}
                </Text>
            </View>

            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={player.duration || 1}
                value={player.currentTime}
                minimumTrackTintColor={T.accent}
                maximumTrackTintColor={T.inkHairline}
                thumbTintColor={T.accent}
                onValueChange={value => { setLocalTime(value); }}
                onSlidingComplete={value => {
                    player.seekTo(value);
                    player.play();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 24,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    timeText: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 12,
        letterSpacing: 0.02,
    },
    slider: {
        width: '100%',
        height: 40,
    },
});