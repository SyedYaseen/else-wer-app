// theme/typography.ts — font families (already loaded via expo-font in
// app/_layout.tsx) and a size scale fitted to values already in use across
// the app's StyleSheet.create blocks.

export const font = {
    serif: {
        regular: 'DMSerifDisplay_400Regular',
        italic: 'DMSerifDisplay_400Regular_Italic',
    },
    sans: {
        light: 'DMSans_300Light',
        regular: 'DMSans_400Regular',
        medium: 'DMSans_500Medium',
    },
    size: {
        xs: 10,
        sm: 11,
        base: 12,
        md: 14,
        lg: 15,
        xl: 18,
        xxl: 22,
        display: 52,
    },
} as const;

export type FontTokens = typeof font;
