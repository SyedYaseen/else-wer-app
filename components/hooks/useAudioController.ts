import { useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState, useRef } from 'react';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { saveProgressServer } from '@/data/api/api';
import { setFileProgressLcl } from '@/data/database/sync-repo';

export function useAudioController() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<null | string>(null)

    const player = useAudioPlayerStore(s => s.player)
    if (!player) {
        setError("No player exists")
        console.error("No player exists")
        throw new Error("Player not initialized")
    }

    const playerStatus = useAudioPlayerStatus(player)

    const currentBook = useAudioPlayerStore(s => s.currentBook)
    const queue = useAudioPlayerStore(s => s.queue)
    const popQueue = useAudioPlayerStore(s => s.popQueue)



    const rewind = () => {
        if (player.currentTime - 30 > 0) {
            player.seekTo(player.currentTime - 30)
            player.play()
        } else {
            player.seekTo(0)
            player.play()
        }
    }

    const fastForward = () => {
        if (player.currentTime + 30 < player.duration) {
            player.seekTo(player.currentTime + 30)
            player.play()
        } else {
            player.seekTo(player.duration)
            player.play()
        }
    }

    const onPlay = async () => {
        try {
            if (queue && queue.length > 0) {

                if (player.playing) {
                    player.pause()

                    await setFileProgressLcl(
                        currentBook?.id as number,
                        queue[0].id as number,
                        player.currentTime * 1000,
                        false
                    );
                    await saveProgressServer(1, currentBook?.id as number, queue[0].id as number, Math.floor(player.currentTime * 1000), false)

                    console.log("save compelte")
                } else {
                    console.log(player)
                    if (!player.isLoaded) { // Book already exists so just resume
                        player.replace(queue[0].local_path as string)
                        console.log("time at resume", playerStatus.currentTime)
                    }
                    player.play()
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    return { player, onPlay, loading, error, fastForward, rewind }
}