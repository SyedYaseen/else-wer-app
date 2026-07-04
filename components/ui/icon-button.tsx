// components/ui/icon-button.tsx — standardizes the repeated
// TouchableOpacity/Pressable + MaterialIcons pattern with a token-driven
// icon size scale instead of ad hoc pixel values.

import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Theme, IconName } from '@/theme';

export type IconButtonProps = {
    icon: IconName;
    onPress?: () => void;
    size?: keyof Theme['icon'];
    /** Resolved color value (e.g. `T.accent`), not a semantic tone name — see Pill/Text for that contract. */
    color?: string;
    hitSlop?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export function IconButton({
    icon,
    onPress,
    size = 'md',
    color,
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
                { alignItems: 'center', justifyContent: 'center', padding: T.space.sm, opacity: disabled ? T.opacity.disabled : 1 },
                style,
            ]}
        >
            <MaterialIcons name={icon} size={T.icon[size]} color={color ?? T.ink} />
        </Pressable>
    );
}
