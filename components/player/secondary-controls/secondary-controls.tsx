// components/player/secondary-controls/secondary-controls.tsx — Folio
// ⚠️ Logic unchanged. L&F only.

import { View, StyleSheet } from 'react-native';
import ChaptersButton from './chapters';
import PlaybackSpeedButton from './playback-speed';
import SleepTimerButton from './sleep-timer';
import VolumeButton from './volume';
import { useTheme } from '@/components/hooks/useTheme';

export default function SecondaryControls() {
    const T = useTheme();

    return (
        <View style={[
            styles.bottomBar,
            { borderTopColor: T.inkHairline },
        ]}>
            <PlaybackSpeedButton />
            <SleepTimerButton />
            <VolumeButton />
            <ChaptersButton />
        </View>
    );
}

const styles = StyleSheet.create({
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
        borderTopWidth: 0.5,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
});