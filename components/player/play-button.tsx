import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useAudioController } from '../hooks/useSharedAudioPlayer'

export default function PlayButton() {
    const { player, onPlay } = useAudioController()

    // useEffect(() => {
    //     // const interval = setInterval(() => {
    //     if (player.playing) {
    //         console.log(player.currentTime)
    //     }
    //     // }, 1000);

    //     // return () => clearInterval(interval)
    // }, [player.currentTime])

    return (
        <TouchableOpacity onPress={async () => await onPlay()}>
            <MaterialIcons
                name={player.playing ? "pause-circle" : "play-circle"}
                size={80}
                color="#555555"
                style={{ marginRight: 8 }}
            />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({})