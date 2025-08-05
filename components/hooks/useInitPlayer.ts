import { useAudioPlayer } from "expo-audio";
import { useAudioPlayerStore } from "../store/audio-player-store";
import { useEffect } from "react";

export default function useInitPlayer() {
    const player = useAudioPlayer();
    const setPlayer = useAudioPlayerStore(s => s.setPlayer);

    useEffect(() => {
        console.log("Audio player init")
        setPlayer(player)
    }, [player])
}