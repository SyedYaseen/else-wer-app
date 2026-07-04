import { saveProgress, saveProgressSec } from "@/data/api/api";
import { useEffect, useRef } from "react";
import { useAudioPlayerStore } from "../store/audio-player-store";
import { AudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router, usePathname } from "expo-router";

export function useProgressUpdate(player: AudioPlayer) {
  const queue = useAudioPlayerStore(s => s.queue)
  const currentBook = useAudioPlayerStore(s => s.currentBook)
  const popQueue = useAudioPlayerStore(s => s.popQueue)
  const playerStatus = useAudioPlayerStatus(player)
  const lastAutoProgressSaveRef = useRef<number>(0);
  const isSavingRef = useRef(false);

  const setCurrentBook = useAudioPlayerStore(s => s.setCurrentBook)
  const clearQueue = useAudioPlayerStore(s => s.clearQueue)
  const clearFiles = useAudioPlayerStore(s => s.clearFiles)

  // Current pathname, kept in a ref so the queue-drain navigation below can
  // check it without retriggering the effect on every route change.
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  // Effect 1: lock screen metadata — fires on load, manual switch, and auto-advance
  const activeFileId = queue?.[0]?.id;
  useEffect(() => {
    if (!player || !currentBook || !activeFileId) return;
    player.updateLockScreenMetadata({
      title: currentBook.title,
      artist: currentBook.author,
      albumTitle: currentBook.title,
      artworkUrl: currentBook.cover_art ?? undefined,
    });
  }, [player, currentBook, activeFileId]);

  useEffect(() => {
    const sec = Math.floor(playerStatus.currentTime);
    if (isSavingRef.current || lastAutoProgressSaveRef.current === sec) return
    if (playerStatus.didJustFinish) {
      lastAutoProgressSaveRef.current = sec;
      isSavingRef.current = true
      console.log("File complete progress save", sec)
      if (queue && queue.length > 0) {
        // Captured before the await — if the book changes mid-save (user
        // switches books while this is in flight), bookLoadSeq will have moved
        // on by the time we resolve, so we can tell this continuation is stale.
        const loadSeqAtStart = useAudioPlayerStore.getState().bookLoadSeq;
        saveProgress(currentBook?.id as number,
          queue[0].id as number,
          player.currentTime * 1000,
          true).then(async () => {
            if (useAudioPlayerStore.getState().bookLoadSeq !== loadSeqAtStart) return;
            popQueue()
            const poppedQ = queue.slice(1)
            if (poppedQ.length > 0) {
              const next = poppedQ[0];
              if (next?.local_path) {
                player?.replace(next.local_path);
                await player.seekTo(0);
                player?.play()
              }
            } else {
              player.pause();
              player.setActiveForLockScreen(false);
              setCurrentBook(null);
              clearQueue();
              clearFiles();
              if (pathnameRef.current?.startsWith("/player")) {
                router.push("/(tabs)")
              }
            }
          }).catch(error => console.error(error)).finally(() => isSavingRef.current = false)
        return
      }
    }
    if (sec % 11 === 0) {
      lastAutoProgressSaveRef.current = sec;
      isSavingRef.current = true
      console.log("Saving progress at", sec);
      if (queue && queue.length) {
        saveProgressSec(
          currentBook?.id as number,
          queue[0].id as number,
          player.currentTime,
          player.duration,
        )
          .catch(error => console.error(error))
          .finally(() => isSavingRef.current = false);
      }
    }
  }, [playerStatus.currentTime]);
}
