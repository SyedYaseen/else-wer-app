import { StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAudioController } from '../hooks/useAudioController'
import Seeker from './seeker'
import { useAudioPlayerStore } from '../store/audio-player-store'

export default function Controls() {
    const { rewind, fastForward } = useAudioController()

    const player = useAudioPlayerStore(s => s.player)
    const queue = useAudioPlayerStore(s => s.queue)
    const { onPlay } = useAudioController()

    if (!player) {
        console.error("Player object not initialized")
        return
    }

    return (
        <View style={{ flex: 1 }}>
            {queue && queue.length > 0 && <Text>In queue: {queue.length} Current: {queue[0].file_name}</Text>}
            <Seeker player={player} />
            <View style={styles.actions}>
                <TouchableOpacity onPress={rewind}>
                    <MaterialIcons name='fast-rewind' size={40} color="#555555" />
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => await onPlay()}>
                    <MaterialIcons
                        name={player.playing ? "pause-circle" : "play-circle"}
                        size={80}
                        color="#555555"
                        style={{ marginRight: 8 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={fastForward}>
                    <MaterialIcons name='fast-forward' size={40} color="#555555" />
                </TouchableOpacity>
            </View>


        </View >
    )
}

const styles = StyleSheet.create({
    actions: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 40,
    },
})