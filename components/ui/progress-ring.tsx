// components/ui/progress-ring.tsx — circular SVG progress ring, lifted from
// components/downloads/progress.tsx.

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme';
import { clamp01 } from './clamp';

export type ProgressRingProps = {
    /** 0–1 */
    progress: number;
    size?: number;
    strokeWidth?: number;
    /** Resolved color values (e.g. `T.accent`), not semantic tone names — see Pill/Text for that contract. */
    color?: string;
    trackColor?: string;
    showLabel?: boolean;
    style?: StyleProp<ViewStyle>;
};

export function ProgressRing({
    progress,
    size = 52,
    strokeWidth = 3,
    color,
    trackColor,
    showLabel = true,
    style,
}: ProgressRingProps) {
    const T = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = clamp01(progress);
    const strokeDashoffset = circumference - clamped * circumference;
    const pcnt = Math.round(clamped * 100);

    return (
        <View style={[{ width: size, height: size }, style]}>
            <Svg width={size} height={size}>
                <Circle
                    stroke={trackColor ?? T.inkHairline}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <Circle
                    stroke={color ?? T.accent}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                />
            </Svg>
            {showLabel && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text
                            style={{
                                fontFamily: T.font.sans.medium,
                                fontSize: T.font.size.base + 1,
                                lineHeight: 16,
                                color: T.ink,
                            }}
                        >
                            {pcnt}
                        </Text>
                        <Text
                            style={{
                                fontFamily: T.font.sans.regular,
                                fontSize: 9,
                                lineHeight: 16,
                                marginTop: 1,
                                color: T.inkSubtle,
                            }}
                        >
                            %
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}
