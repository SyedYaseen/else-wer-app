// components/ui/text.tsx — typed Text primitive driven by theme tokens.
// Optional; screens may still use RN's Text with inline theme lookups where
// a one-off style doesn't map cleanly to a variant.

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from 'react-native';
import { useTheme, Theme } from '@/theme';

type Variant = 'display' | 'title' | 'body' | 'label' | 'caption';
type Tone = 'ink' | 'inkMuted' | 'inkSubtle' | 'accent' | 'sage' | 'warning' | 'danger';

export type TextProps = RNTextProps & {
    variant?: Variant;
    tone?: Tone;
    style?: StyleProp<TextStyle>;
};

const VARIANT_STYLE: Record<Variant, (T: Theme) => TextStyle> = {
    display: (T) => ({ fontFamily: T.font.serif.regular, fontSize: T.font.size.display }),
    title: (T) => ({ fontFamily: T.font.serif.regular, fontSize: T.font.size.xl }),
    body: (T) => ({ fontFamily: T.font.sans.regular, fontSize: T.font.size.md }),
    label: (T) => ({
        fontFamily: T.font.sans.medium,
        fontSize: T.font.size.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.14,
    }),
    caption: (T) => ({ fontFamily: T.font.sans.light, fontSize: T.font.size.sm }),
};

export function Text({ variant = 'body', tone = 'ink', style, ...rest }: TextProps) {
    const T = useTheme();
    return (
        <RNText
            style={[VARIANT_STYLE[variant](T), { color: T[tone] }, style]}
            {...rest}
        />
    );
}
