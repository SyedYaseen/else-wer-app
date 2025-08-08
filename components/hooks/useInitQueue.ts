import { getBookProgressServer, saveProgressServer } from "@/data/api/api";
import { getBook, getFilesForBook } from "@/data/database/audiobook-repo";
import { getProgressForBookLcl, setFileProgressLcl } from "@/data/database/sync-repo";
import { useEffect, useRef, useState } from "react";
import { useAudioPlayerStore } from "../store/audio-player-store";
import { AudioPlayer, useAudioPlayerStatus } from "expo-audio";

export function useUpdateQueue() {
    const player = useAudioPlayerStore(s => s.player)
    const queue = useAudioPlayerStore(s => s.queue)
    const currentBook = useAudioPlayerStore(s => s.currentBook)
    const popQueue = useAudioPlayerStore(s => s.popQueue)

    if (!player || !queue) return

    const playerStatus = useAudioPlayerStatus(player as AudioPlayer)
    const didFinishHandledRef = useRef(false);

    // Load next on file complete - untested
    useEffect(() => {

        const saveProgress = async () => {
            await setFileProgressLcl(
                currentBook?.id as number,
                queue[0].id as number,
                player?.currentTime * 1000 || player?.duration * 1000,
            );
            await saveProgressServer(1, currentBook?.id as number, queue[0].id as number, Math.floor(playerStatus.currentTime * 1000), playerStatus.currentTime > playerStatus.duration - 3)
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
        if (queue && queue.length > 0) {
            console.log("Playing", queue[0].file_name)
            const next = queue[0];
            if (next?.local_path) {
                player?.replace(next.local_path);
                // player?.play()
            }
        }
    }, [queue])
}