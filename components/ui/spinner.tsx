// components/ui/spinner.tsx — replaces components/common/loading-spinner.tsx
// and the ad hoc raw ActivityIndicator usages scattered across screens.

import React from 'react';
import { ActivityIndicator, View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

export type SpinnerProps = {
    size?: 'small' | 'large';
    tone?: string;
    containerSize?: number;
    style?: StyleProp<ViewStyle>;
};

export function Spinner({ size = 'small', tone, containerSize = 40, style }: SpinnerProps) {
    const T = useTheme();
    return (
        <View
            style={[
                { width: containerSize, height: containerSize, alignItems: 'center', justifyContent: 'center' },
                style,
            ]}
        >
            <ActivityIndicator size={size} color={tone ?? T.accent} />
        </View>
    );
}
