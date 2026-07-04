// components/ui/pill.tsx — unifies the repeated status/tag/dev-toggle pill
// pattern (library-header rescan/online pills, login dev toggles, etc.).

import React from 'react';
import { Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, IconName } from '@/theme';

type PillTone = 'neutral' | 'accent' | 'sage' | 'warning' | 'danger';

export type PillProps = {
    label: string;
    icon?: IconName;
    tone?: PillTone;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
};

export function Pill({ label, icon, tone = 'neutral', onPress, style }: PillProps) {
    const T = useTheme();
    const color = tone === 'neutral' ? T.inkSubtle : T[tone];

    return (
        <Pressable
            onPress={onPress}
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: T.space.md,
                    paddingVertical: T.space.sm - 1,
                    borderRadius: T.radius.pill,
                    borderWidth: 0.5,
                    borderColor: T.inkHairline,
                    backgroundColor: T.surfaceDeep,
                },
                style,
            ]}
        >
            {icon && <MaterialIcons name={icon} size={T.icon.xs} color={color} />}
            <Text style={{ fontFamily: T.font.sans.regular, fontSize: T.font.size.sm, color }}>
                {label}
            </Text>
        </Pressable>
    );
}
