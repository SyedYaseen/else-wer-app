import { useState } from 'react';
import { useAudioPlayerStore } from '../store/audio-player-store';
import { saveProgress } from '@/data/api/api';

export function useAudioController() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const player = useAudioPlayerStore(s => s.player);
  const currentBook = useAudioPlayerStore(s => s.currentBook);
  const queue = useAudioPlayerStore(s => s.queue);

  if (!player) {
    return {
      player: null,
      onPlay: async () => { },
      loading,
      error: 'Player not initialized',
      fastForward: () => { },
      rewind: () => { },
    };
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const rewind = () => {
    if (player.currentTime - 30 > 0) {
      player.seekTo(player.currentTime - 30);
    } else {
      player.seekTo(0);
    }
    player.play();
  };

  const fastForward = () => {
    if (player.currentTime + 30 < player.duration) {
      player.seekTo(player.currentTime + 30);
    } else {
      player.seekTo(player.duration);
    }
    player.play();
  };

  const onPlay = async () => {
    try {
      console.log("Qlen", queue);
      if (queue && queue.length > 0) {
        console.log(queue[0].local_path);
        if (player.playing) {
          player.pause();
          await saveProgress(
            currentBook?.id as number,
            queue[0].id as number,
            player.currentTime * 1000,
            false,
          );
        } else {
          if (player.isLoaded) {
            console.log("hits here?");
            player.play();
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  return { player, onPlay, loading, error, fastForward, rewind };
}