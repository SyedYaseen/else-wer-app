// components/ui/card.tsx — plain surface container; base building block for
// ListSection and any other bordered/rounded surface.

import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

export type CardProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
    const T = useTheme();
    return (
        <View
            style={[
                {
                    backgroundColor: T.surface,
                    borderColor: T.inkHairline,
                    borderWidth: 0.5,
                    borderRadius: T.radius.lg,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}
