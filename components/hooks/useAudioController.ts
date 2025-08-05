import { useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
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

    // Load next on file complete - untested
    useEffect(() => {
        if (!player) return
        if (!playerStatus?.didJustFinish) return

        console.log("jere", playerStatus)

        popQueue()
        if (queue && queue.length > 0) {
            const next = queue[0];
            if (next?.local_path) {
                player.replace(next.local_path);
                player.play();
            }
            console.log("Save after file complete")
        }
    }, [playerStatus?.didJustFinish])

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
                        playerStatus.currentTime * 1000,
                    );
                    await saveProgressServer(1, currentBook?.id as number, queue[0].id as number, Math.floor(playerStatus.currentTime * 1000), false)

                    console.log("save compelte")
                } else {
                    console.log(playerStatus)
                    if (!playerStatus.isLoaded) { // Book already exists so just resume
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