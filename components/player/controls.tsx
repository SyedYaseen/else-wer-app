import { StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAudioController } from '../hooks/useAudioController'
import Seeker from './seeker'
import { useAudioPlayerStore } from '../store/audio-player-store'
import PlaybackSpeedToggleButton from './secondary-controls/playback-speed'
import { useState } from 'react'
import SecondaryControls from './secondary-controls/secondary-controls'

export default function Controls() {
    const { player, onPlay, rewind, fastForward } = useAudioController()
    const queue = useAudioPlayerStore(s => s.queue)
    const [speed, setSpeed] = useState(1);

    if (!player) {
        console.error("Player object not initialized")
        return
    }

    return (
        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
            <Seeker player={player} />
            <View style={styles.actions}>
                <TouchableOpacity onPress={rewind}>
                    <MaterialIcons name='fast-rewind' size={40} color="#CCCCCC" />
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => await onPlay()}>
                    <MaterialIcons
                        name={player.playing ? "pause-circle" : "play-circle"}
                        size={80}
                        color="#CCCCCC"
                        style={{ marginRight: 8 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={fastForward}>
                    <MaterialIcons name='fast-forward' size={40} color="#CCCCCC" />
                </TouchableOpacity>
            </View>
            <SecondaryControls />


        </View >
    )
}

const styles = StyleSheet.create({
    actions: {
        marginVertical: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 40,
    },
    secondaryControls: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        // backgroundColor: "#116FAF",
        paddingVertical: 12,
        borderRadius: 12,
        // stick to bottom visually because container uses space-between
    },
    iconButton: {
        backgroundColor: "#111111",
        paddingHorizontal: 16,
    },
})