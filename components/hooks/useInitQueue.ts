import { saveProgressServer } from "@/data/api/api";
import { setFileProgressLcl } from "@/data/database/sync-repo";
import { useEffect, useRef, useState } from "react";
import { useAudioPlayerStore } from "../store/audio-player-store";
import { AudioPlayer, useAudioPlayerStatus } from "expo-audio";

export function useUpdateQueue(player: AudioPlayer) {
    const queue = useAudioPlayerStore(s => s.queue)
    const initPos = useAudioPlayerStore(s => s.initPos)
    const currentBook = useAudioPlayerStore(s => s.currentBook)
    const popQueue = useAudioPlayerStore(s => s.popQueue)
    const playerStatus = useAudioPlayerStatus(player)

    const didFinishHandledRef = useRef(false);

    // Load next on file complete - untested
    useEffect(() => {
        const saveProgress = async () => {
            if (queue && queue.length) {
                await setFileProgressLcl(
                    currentBook?.id as number,
                    queue[0].id as number,
                    player?.currentTime * 1000 || player?.duration * 1000,
                    playerStatus.currentTime > playerStatus.duration - 3
                )
                await saveProgressServer(1, currentBook?.id as number, queue[0].id as number, Math.floor(playerStatus.currentTime * 1000), playerStatus.currentTime > playerStatus.duration - 3)
            }
        }

        if (playerStatus.didJustFinish && !didFinishHandledRef.current) {
            didFinishHandledRef.current = true;

            console.log("File finished, moving to next...");
            console.log(playerStatus);

            saveProgress()


            popQueue();

            setTimeout(() => {
                didFinishHandledRef.current = false;
            }, 1000); // 0.5s cooldown to avoid rapid repeat
        }
    }, [playerStatus.didJustFinish]);


    useEffect(() => {
        console.log("Queue change effect")
        if (queue && queue.length > 0) {
            console.log("Playing", queue[0].file_name)
            // console.log("Loggin from update qu", player)
            const next = queue[0];
            if (next?.local_path) {
                player?.replace(next.local_path);
                player.seekTo(initPos || 0)
                player?.play()
            }
        }
    }, [queue, initPos])
}