// components/ui/button.tsx — unifies the primary/dev-toggle button patterns
// currently hand-rolled per-screen (e.g. login.tsx's loginBtn).

import React from 'react';
import {
    Pressable,
    Text,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export type ButtonProps = {
    label: string;
    onPress?: () => void;
    variant?: Variant;
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
};

export function Button({
    label,
    onPress,
    variant = 'primary',
    disabled,
    loading,
    style,
    textStyle,
}: ButtonProps) {
    const T = useTheme();
    const busy = disabled || loading;

    const backgroundColor =
        variant === 'primary' ? T.ink :
            variant === 'destructive' ? T.danger :
                variant === 'secondary' ? T.surfaceDeep :
                    'transparent';

    const textColor =
        variant === 'primary' || variant === 'destructive' ? T.background :
            variant === 'secondary' ? T.ink :
                T.accent;

    return (
        <Pressable
            onPress={onPress}
            disabled={busy}
            style={[
                {
                    height: 50,
                    borderRadius: T.radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor,
                    opacity: busy ? T.opacity.busy : 1,
                    borderWidth: variant === 'secondary' ? 0.5 : 0,
                    borderColor: T.inkHairline,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={textColor} />
            ) : (
                <Text
                    style={[
                        {
                            fontFamily: T.font.sans.medium,
                            fontSize: T.font.size.lg,
                            letterSpacing: 0.02,
                            color: textColor,
                        },
                        textStyle,
                    ]}
                >
                    {label}
                </Text>
            )}
        </Pressable>
    );
}
