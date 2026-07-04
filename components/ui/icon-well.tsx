// components/ui/icon-well.tsx — the 34×34 rounded, tinted box behind an
// icon, shared by ListRow and any custom row layout that can't use ListRow's
// single-line trailing slot (e.g. menu.tsx's stacked AppearanceRow).

import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, IconName } from '@/theme';

export type IconWellProps = {
    icon: IconName;
    tint?: string;
};

export function IconWell({ icon, tint }: IconWellProps) {
    const T = useTheme();
    const color = tint ?? T.ink;

    return (
        <View
            style={{
                width: 34,
                height: 34,
                borderRadius: T.radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color + T.alpha.wash,
            }}
        >
            <MaterialIcons name={icon} size={T.icon.md} color={color} />
        </View>
    );
}
