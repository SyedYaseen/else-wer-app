import { saveProgressServer } from "@/data/api/api";
import { setFileProgressLcl } from "@/data/database/sync-repo";
import { useEffect, useRef, useState } from "react";
import { useAudioPlayerStore } from "../store/audio-player-store";
import { AudioPlayer, useAudioPlayerStatus } from "expo-audio";

export function useUpdateQueue(player: AudioPlayer) {
    const queue = useAudioPlayerStore(s => s.queue)
    const currentBook = useAudioPlayerStore(s => s.currentBook)
    const popQueue = useAudioPlayerStore(s => s.popQueue)
    const playerStatus = useAudioPlayerStatus(player)

    const didFinishHandledRef = useRef(false);

    // Load next on file complete TODO: Get file progress once current file ends seek to that pos
    // useEffect(() => {
    //     const saveProgress = async () => {
    //         if (queue && queue.length) {
    //             await setFileProgressLcl(
    //                 currentBook?.id as number,
    //                 queue[0].file_id as number,
    //                 player?.currentTime * 1000 || player?.duration * 1000,
    //                 playerStatus.currentTime > playerStatus.duration - 3
    //             )
    //             await saveProgressServer(1, currentBook?.id as number, queue[0].file_id as number, Math.floor(playerStatus.currentTime * 1000), playerStatus.currentTime > playerStatus.duration - 3)
    //         }
    //     }

    //     if (playerStatus.currentTime > playerStatus.duration - 3 && !didFinishHandledRef.current) {
    //         didFinishHandledRef.current = true;

    //         console.log("File finished, moving to next...");
    //         console.log(playerStatus);

    //         saveProgress()
    //         popQueue()
    //         const poppedQ = queue && queue.slice(1)

    //         const next = poppedQ && poppedQ[0];
    //         if (next?.local_path) {
    //             player?.replace(next.local_path);
    //             player.seekTo(0)
    //             player?.play()
    //         }

    //         setTimeout(() => {
    //             didFinishHandledRef.current = false;
    //         }, 3000); // 0.5s cooldown to avoid rapid repeat
    //     }
    // }, [playerStatus.didJustFinish])
}