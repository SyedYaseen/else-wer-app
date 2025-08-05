import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Slider from '@react-native-community/slider'
import { formatTime } from '@/utils/formatTime'
import { AudioPlayer } from 'expo-audio'

export default function Seeker({ player }: { player: AudioPlayer }) {

    const [seeking, setSeeking] = useState(false)
    const [localTime, setLocalTime] = useState(0)

    return (
        <View style={styles.container}>
            <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(player.currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(player.duration)}</Text>
            </View>

            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={player.duration || 1}
                value={player.currentTime}
                minimumTrackTintColor="#1FB28A"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#1FB28A"
                onValueChange={value => {
                    setLocalTime(value)
                }}
                onSlidingComplete={value => {
                    player.seekTo(value)
                    player.play()
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
