// components/ui/progress-bar.tsx — linear progress bar; unifies the
// separate reimplementations in downloads.tsx, inprogress-row.tsx, and
// mini-player.tsx.

import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

export type ProgressBarProps = {
    /** 0–1 */
    progress: number;
    tone?: string;
    trackTone?: string;
    height?: number;
    style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
    progress,
    tone,
    trackTone,
    height = 4,
    style,
}: ProgressBarProps) {
    const T = useTheme();
    const clamped = Math.max(0, Math.min(1, progress));

    return (
        <View
            style={[
                {
                    height,
                    borderRadius: height / 2,
                    backgroundColor: trackTone ?? T.inkHairline,
                    overflow: 'hidden',
                    flexDirection: 'row',
                },
                style,
            ]}
        >
            <View style={{ flex: clamped, backgroundColor: tone ?? T.accent }} />
            <View style={{ flex: 1 - clamped }} />
        </View>
    );
}
