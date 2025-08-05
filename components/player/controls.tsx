import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useAudioController } from '../hooks/useAudioController'
import PlayButton from './play-button'
import Seeker from './seeker'
import { useAudioPlayerStatus } from 'expo-audio'
import { useAudioPlayerStore } from '../store/audio-player-store'

export default function Controls() {
    const { rewind, fastForward } = useAudioController()
    const player = useAudioPlayerStore(s => s.player)

    if (!player) {
        console.error("Player object not initialized")
        return
    }
    const status = useAudioPlayerStatus(player);
    // useEffect(() => {
    //     if (player.playing) {
    //         console.log(player.currentTime)
    //     }
    // }, [player.playing, player.currentTime])

    return (
        <View style={{ flex: 1 }}>
            <Seeker player={player} />
            <View style={styles.actions}>
                <TouchableOpacity onPress={rewind}>
                    <MaterialIcons name='fast-rewind' size={40} color="#555555" />
                </TouchableOpacity>
                <PlayButton player={player} />
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