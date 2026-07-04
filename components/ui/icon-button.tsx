// components/ui/icon-button.tsx — standardizes the repeated
// TouchableOpacity/Pressable + MaterialIcons pattern with a token-driven
// icon size scale instead of ad hoc pixel values.

import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export type IconButtonProps = {
    icon: IconName;
    onPress?: () => void;
    size?: keyof Theme['icon'];
    tone?: string;
    hitSlop?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export function IconButton({
    icon,
    onPress,
    size = 'md',
    tone,
    hitSlop = 8,
    disabled,
    style,
}: IconButtonProps) {
    const T = useTheme();
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            hitSlop={hitSlop}
            style={[
                { alignItems: 'center', justifyContent: 'center', padding: T.space.sm, opacity: disabled ? 0.35 : 1 },
                style,
            ]}
        >
            <MaterialIcons name={icon} size={T.icon[size]} color={tone ?? T.ink} />
        </Pressable>
    );
}
