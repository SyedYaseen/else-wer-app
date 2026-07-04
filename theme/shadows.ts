// theme/shadows.ts — platform-aware, mode-aware shadow presets.
// Shadows read as harsh smudges on dark surfaces at the same opacity that
// reads correctly on light surfaces, so opacity is bumped per-mode rather
// than shared as one static object (fixes the raw `shadowColor: '#000'`
// leak previously hand-rolled in app/(tabs)/menu.tsx).

import { Platform, ViewStyle } from 'react-native';

export type ShadowScale = { sm: ViewStyle; md: ViewStyle };

export function getShadows(mode: 'light' | 'dark'): ShadowScale {
    const opacity = mode === 'dark' ? 0.24 : 0.06;

    const sm: ViewStyle =
        Platform.OS === 'android'
            ? { elevation: 1 }
            : {
                shadowColor: '#000',
                shadowOpacity: opacity,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
            };

    const md: ViewStyle =
        Platform.OS === 'android'
            ? { elevation: 4 }
            : {
                shadowColor: '#000',
                shadowOpacity: opacity + 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
            };

    return { sm, md };
}
