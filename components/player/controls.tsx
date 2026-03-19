// components/player/controls.tsx — Folio Controls
// ⚠️ Logic unchanged. L&F only.

import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioController } from '../hooks/useAudioController';
import Seeker from './seeker';
import { useAudioPlayerStore } from '../store/audio-player-store';
import SecondaryControls from './secondary-controls/secondary-controls';
import { useTheme } from '@/components/hooks/useTheme';

export default function Controls() {
    const { player, onPlay, rewind, fastForward } = useAudioController();
    const queue = useAudioPlayerStore(s => s.queue);
    const T = useTheme();

    if (!player) {
        console.error("Player object not initialized");
        return;
    }

    return (
        <View style={styles.root}>
            <Seeker player={player} />

            {/* Main transport */}
            <View style={styles.actions}>
                <TouchableOpacity onPress={rewind} activeOpacity={0.7}>
                    <MaterialIcons name="fast-rewind" size={36} color={T.inkMuted} />
                </TouchableOpacity>

                <TouchableOpacity onPress={async () => await onPlay()} activeOpacity={0.7}>
                    <MaterialIcons
                        name={player.playing ? 'pause-circle' : 'play-circle'}
                        size={76}
                        color={T.ink}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={fastForward} activeOpacity={0.7}>
                    <MaterialIcons name="fast-forward" size={36} color={T.inkMuted} />
                </TouchableOpacity>
            </View>

            <SecondaryControls />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    actions: {
        marginVertical: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 36,
    },
});