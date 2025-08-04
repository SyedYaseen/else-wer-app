import { saveProgressServer } from "@/data/api/api";
import { setFileProgressLcl } from "@/data/database/sync-repo";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioPlayerCustomHook() {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentUri, setCurrentUri] = useState<string | null>(null);
    const [absFileId, setAbsFileId] = useState<number | null>(null);
    const [relativeFileId, setRelativeFileId] = useState<number | null>(null);
    const [currentBookId, setCurrentBookId] = useState<number | null>(null);

    const positionRef = useRef(position);
    const intervalRef = useRef<number | null>(null);
    const serverRef = useRef<number>(0)

    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(async () => {
                const pos = Math.floor(positionRef.current);
                if (currentBookId && absFileId) {
                    console.log("Saving progress", currentBookId, absFileId, pos)
                    await setFileProgressLcl(currentBookId, absFileId, pos)
                }
                serverRef.current += 1
                console.log(serverRef.current)
                if (serverRef.current > 3 && absFileId) {
                    await saveProgressServer(1, currentBookId as number, absFileId as number, pos, false)
                    serverRef.current = 0
                }
            }, 2000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, currentBookId, absFileId, relativeFileId]);

    const unload = useCallback(async () => {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current.setOnPlaybackStatusUpdate(null);
            soundRef.current = null;
        }
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
        setCurrentUri(null);
        setAbsFileId(null);
        setRelativeFileId(null);
        setCurrentBookId(null);
    }, []);

    const playUri = useCallback(
        async (uri: string, bookId: number, absFileId: number, relativeFileId: number, startPosition = 0) => {
            if (uri === currentUri && soundRef.current) {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    if (status.isPlaying) {
                        // Save when paused
                        await soundRef.current.pauseAsync();
                        setPosition(status.positionMillis)
                        await setFileProgressLcl(
                            currentBookId as number,
                            absFileId as number,
                            Math.floor(status.positionMillis),
                        );
                        await saveProgressServer(1, currentBookId as number, absFileId as number, Math.floor(status.positionMillis), false)

                        setIsPlaying(false)
                    } else {
                        await soundRef.current.playAsync();
                        await soundRef.current.setPositionAsync(startPosition)
                        setIsPlaying(true);
                    }
                }
                return;
            }

            await unload();

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true, positionMillis: startPosition },
                (status: { isLoaded: any; }) => {
                    if (!status.isLoaded) return;
                    const s = status as AVPlaybackStatusSuccess;
                    setIsPlaying(s.isPlaying);
                    setPosition(s.positionMillis ?? 0);
                    setDuration(s.durationMillis ?? 0);
                }
            );

            soundRef.current = sound
            setCurrentUri(uri)
            setCurrentBookId(bookId)
            setAbsFileId(absFileId)
            setRelativeFileId(relativeFileId)
        },
        [currentUri, unload, currentBookId, absFileId, relativeFileId]
    );

    const togglePlayPause = useCallback(async () => {
        if (!soundRef.current) return;
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded) return;

        if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            const currentPos = status.positionMillis
            await setFileProgressLcl(currentBookId as number, absFileId as number, currentPos);
            await saveProgressServer(1, currentBookId as number, absFileId as number, currentPos, false)
            setIsPlaying(false);
        } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
        }
    }, []);

    const seekTo = useCallback(async (ms: number) => {
        if (!soundRef.current) return;
        await soundRef.current.setPositionAsync(ms);
    }, []);

    return {
        playUri,
        togglePlayPause,
        seekTo,
        unload,
        isPlaying,
        position,
        duration,
        currentUri,
        currentBookId,
        absFileId,
        relativeFileId
    };
}
