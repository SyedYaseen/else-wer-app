import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useAudioController } from '../hooks/useSharedAudioPlayer'
import PlayButton from './play-button'
import Seeker from './seeker'

export default function Controls() {
    const { player, rewind, fastForward } = useAudioController()

    useEffect(() => {
        if (player.playing) {
            console.log(player.currentTime)
        }
    }, [player.playing, player.currentTime])

    return (
        <View style={{ flex: 1 }}>
            <Seeker />
            <View style={styles.actions}>
                <TouchableOpacity onPress={rewind}>
                    <MaterialIcons name='fast-rewind' size={40} color="#555555" />
                </TouchableOpacity>

                <PlayButton />
                <Pressable onPress={() => {
                    console.log("pauding")
                    player.pause()
                }}>
                    <MaterialIcons name='pause-circle' size={48} />
                </Pressable>

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