import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Slider from '@react-native-community/slider'
import { useAudioController } from '../hooks/useSharedAudioPlayer'
import { formatTime } from '@/utils/formatTime'

export default function Seeker() {
    const { player, playerStatus } = useAudioController()
    const [seeking, setSeeking] = useState(false)
    const [localTime, setLocalTime] = useState(0)

    // useEffect(() => {
    //     const subscription = player.addListener('playbackStatusUpdate', (status) => {
    //         if (!seeking && status?.currentTime != null) {
    //             setLocalTime(status.currentTime)
    //         }
    //     })

    //     return () => {
    //         subscription.remove?.()
    //     }
    // }, [seeking])

    // useEffect(() => {
    //     if (player.playing) {
    //         console.log(player.currentTime)
    //     }
    // }, [player.currentTime])


    return (
        <View style={styles.container}>
            <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(localTime)}</Text>
                <Text style={styles.timeText}>{formatTime(playerStatus.duration)}</Text>
            </View>

            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={playerStatus.duration || 1}
                value={localTime}
                minimumTrackTintColor="#1FB28A"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#1FB28A"
                onValueChange={value => {
                    setSeeking(true)
                    setLocalTime(value)
                }}
                onSlidingComplete={value => {
                    player.seekTo(value)
                    setSeeking(false)
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#555',
    },
    slider: {
        width: '100%',
        height: 40,
    },
})
