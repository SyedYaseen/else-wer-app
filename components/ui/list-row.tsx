// components/ui/list-row.tsx — generalized from app/(tabs)/menu.tsx's
// MenuItem (icon + title/subtitle + trailing chevron/toggle/custom node).

import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, IconName } from '@/theme';
import { IconWell } from './icon-well';

export type ListRowProps = {
    icon: IconName;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    tint?: string;
    isLast?: boolean;
    toggle?: { value: boolean; onValueChange: (v: boolean) => void };
    trailing?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function ListRow({
    icon,
    title,
    subtitle,
    onPress,
    tint,
    isLast,
    toggle,
    trailing,
    style,
}: ListRowProps) {
    const T = useTheme();

    return (
        <TouchableOpacity
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: T.space.md + 1,
                    paddingHorizontal: T.space.md + 2,
                    gap: T.space.md,
                    borderBottomWidth: isLast ? 0 : 0.5,
                    borderBottomColor: T.inkHairline,
                },
                style,
            ]}
            onPress={onPress}
            activeOpacity={toggle ? 1 : 0.55}
            disabled={!onPress && !toggle}
        >
            <IconWell icon={icon} tint={tint} />

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontFamily: T.font.sans.medium,
                        fontSize: T.font.size.md,
                        color: T.ink,
                        marginBottom: 2,
                    }}
                >
                    {title}
                </Text>
                {subtitle ? (
                    <Text
                        style={{
                            fontFamily: T.font.sans.light,
                            fontSize: T.font.size.base,
                            color: T.inkMuted,
                        }}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {toggle ? (
                <Switch
                    value={toggle.value}
                    onValueChange={toggle.onValueChange}
                    trackColor={{ false: T.inkHairline, true: T.accent + T.alpha.strong }}
                    thumbColor={toggle.value ? T.accent : T.inkSubtle}
                    ios_backgroundColor={T.inkHairline}
                />
            ) : trailing !== undefined ? (
                trailing
            ) : onPress ? (
                <MaterialIcons name="chevron-right" size={T.icon.md} color={T.inkSubtle} />
            ) : null}
        </TouchableOpacity>
    );
}
