// components/ui/list-section.tsx — generalized from
// app/(tabs)/menu.tsx's Section (labelled group of ListRows inside a Card).

import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Card } from './card';

export type ListSectionProps = {
    title: string;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function ListSection({ title, children, style }: ListSectionProps) {
    const T = useTheme();
    return (
        <View style={[{ marginTop: T.space.xl + 4 }, style]}>
            <Text
                style={{
                    fontFamily: T.font.sans.medium,
                    fontSize: T.font.size.xs,
                    letterSpacing: 0.14,
                    textTransform: 'uppercase',
                    color: T.inkSubtle,
                    marginBottom: T.space.sm + 2,
                    paddingHorizontal: T.space.xs,
                }}
            >
                {title}
            </Text>
            <Card>{children}</Card>
        </View>
    );
}
