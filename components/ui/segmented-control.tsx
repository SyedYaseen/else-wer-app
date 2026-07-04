// components/ui/segmented-control.tsx — generalized from
// app/(tabs)/menu.tsx's ThemeSegmentedControl, made generic over the
// option value type so it isn't tied to ColorMode specifically.

import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export type SegmentOption<V extends string> = {
    value: V;
    label: string;
    icon?: IconName;
};

export type SegmentedControlProps<V extends string> = {
    options: SegmentOption<V>[];
    value: V;
    onChange: (value: V) => void;
    style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<V extends string>({
    options,
    value,
    onChange,
    style,
}: SegmentedControlProps<V>) {
    const T = useTheme();

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    borderRadius: T.radius.md,
                    borderWidth: 0.5,
                    borderColor: T.inkHairline,
                    backgroundColor: T.surfaceDeep,
                    padding: 3,
                },
                style,
            ]}
        >
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <Pressable
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        style={[
                            {
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                paddingVertical: 7,
                                paddingHorizontal: 4,
                                borderRadius: T.radius.sm,
                            },
                            active && {
                                backgroundColor: T.surface,
                                borderWidth: 0.5,
                                borderColor: T.inkHairline,
                                ...T.shadow.sm,
                            },
                        ]}
                    >
                        {opt.icon && (
                            <MaterialIcons
                                name={opt.icon}
                                size={15}
                                color={active ? T.accent : T.inkSubtle}
                            />
                        )}
                        <Text
                            style={{
                                fontFamily: T.font.sans.medium,
                                fontSize: T.font.size.sm,
                                color: active ? T.ink : T.inkSubtle,
                            }}
                        >
                            {opt.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
