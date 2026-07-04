// components/ui/progress-bar.tsx — linear progress bar; unifies the
// separate reimplementations in downloads.tsx, inprogress-row.tsx, and
// mini-player.tsx.

import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { clamp01 } from './clamp';

export type ProgressBarProps = {
    /** 0–1 */
    progress: number;
    /** Resolved color values (e.g. `T.accent`), not semantic tone names — see Pill/Text for that contract. */
    color?: string;
    trackColor?: string;
    height?: number;
    style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
    progress,
    color,
    trackColor,
    height = 4,
    style,
}: ProgressBarProps) {
    const T = useTheme();
    const clamped = clamp01(progress);

    return (
        <View
            style={[
                {
                    height,
                    borderRadius: height / 2,
                    backgroundColor: trackColor ?? T.inkHairline,
                    overflow: 'hidden',
                    flexDirection: 'row',
                },
                style,
            ]}
        >
            <View style={{ flex: clamped, backgroundColor: color ?? T.accent }} />
            <View style={{ flex: 1 - clamped }} />
        </View>
    );
}
