import { useState } from 'react';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { saveProgress } from '@/data/api/api';

export function useAudioController() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<null | string>(null)
    const player = useAudioPlayerStore(s => s.player)

    if (!player) {
        setError("No player exists")
        console.error("No player exists")
        throw new Error("Player not initialized")
    }

    const currentBook = useAudioPlayerStore(s => s.currentBook)
    const queue = useAudioPlayerStore(s => s.queue)

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
                console.log(queue)
                if (player.playing) {
                    player.pause()

                    await saveProgress(currentBook?.id as number,
                        queue[0].id as number,
                        player.currentTime * 1000,
                        false)
                } else {
                    if (player.isLoaded)
                        player.play()
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    return { player, onPlay, loading, error, fastForward, rewind }
}