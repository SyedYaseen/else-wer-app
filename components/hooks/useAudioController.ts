import { useState } from 'react';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { saveProgress } from '@/data/api/api';


import * as FileSystem from "expo-file-system";

async function debugFile(path: string) {
    const info = await FileSystem.getInfoAsync(path, { size: true });
    console.log("Exists:", info.exists);
    console.log("Is directory:", info.isDirectory);
    // console.log("Size:", info.size);
    console.log("Uri:", info.uri);
}

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
            console.log("Qlen", queue)
            if (queue && queue.length > 0) {
                console.log(queue[0].local_path)
                debugFile(queue[0].file_path as string)

                if (player.playing) {
                    player.pause()

                    await saveProgress(currentBook?.id as number,
                        queue[0].id as number,
                        player.currentTime * 1000,
                        false)
                } else {
                    if (player.isLoaded) {
                        console.log("hits here?")
                        player.play()
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    return { player, onPlay, loading, error, fastForward, rewind }
}
