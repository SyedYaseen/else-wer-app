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

  const rewind = async () => {
    try {
      const wasPlaying = player.playing;
      if (player.currentTime - 30 > 0) {
        await player.seekTo(player.currentTime - 30);
      } else {
        await player.seekTo(0);
      }
      if (wasPlaying && player.isLoaded) player.play();
    } catch (e) {
      console.log(e);
    }
  };

  const fastForward = async () => {
    try {
      const wasPlaying = player.playing;
      if (player.currentTime + 30 < player.duration) {
        await player.seekTo(player.currentTime + 30);
      } else {
        await player.seekTo(player.duration);
      }
      if (wasPlaying && player.isLoaded) player.play();
    } catch (e) {
      console.log(e);
    }
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
