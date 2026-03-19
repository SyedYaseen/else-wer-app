// constants/theme.ts — Folio Design System
//
// Supports three modes: 'system' (follows OS), 'light', 'dark'.
//
// Setup — wrap your root _layout.tsx:
//   import { ThemeProvider } from '@/constants/theme';
//   export default function RootLayout() {
//     return <ThemeProvider><Stack /></ThemeProvider>;
//   }
//
// Usage in any screen or component:
//   const T = useTheme();                          // colour tokens
//   const { colorMode, setColorMode } = useThemeToggle(); // toggle

import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

// ── Token sets ────────────────────────────────────────────────────────────────

const light = {
    background: '#FDFBF8',
    surface: '#F5F2EC',
    surfaceDeep: '#EDE9E1',
    ink: '#1C1B19',
    inkMuted: '#6B6860',
    inkSubtle: '#B5B3AE',
    inkHairline: '#ECEAE6',
    accent: '#8C7355',
    accentLight: '#C4A882',
    accentMuted: '#F0E8DC',
    sage: '#5C7A6E',
    warning: '#A0622A',
    danger: '#8B3A3A',
};

const dark = {
    background: '#141210',
    surface: '#1E1C19',
    surfaceDeep: '#252320',
    ink: '#F0EDE7',
    inkMuted: '#9C9890',
    inkSubtle: '#5C5A55',
    inkHairline: '#2E2C29',
    accent: '#C4A882',
    accentLight: '#8C7355',
    accentMuted: '#2A2318',
    sage: '#7AA898',
    warning: '#C8843A',
    danger: '#B85555',
};

export type Theme = typeof light;
export type ColorMode = 'light' | 'dark' | 'system';

// ── Context ───────────────────────────────────────────────────────────────────

type ThemeContextValue = {
    theme: Theme;
    activeMode: 'light' | 'dark';
    colorMode: ColorMode;
    setColorMode: (mode: ColorMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
    theme: light,
    activeMode: 'light',
    colorMode: 'system',
    setColorMode: () => { },
});

// ── Provider (place in root _layout.tsx) ─────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme() ?? 'light';
    const [colorMode, setColorMode] = useState<ColorMode>('system');

    const activeMode: 'light' | 'dark' =
        colorMode === 'system' ? systemScheme : colorMode;

    const theme = activeMode === 'dark' ? dark : light;

    return (
        <ThemeContext.Provider value={{ theme, activeMode, colorMode, setColorMode }
        }>
            {children}
        </ThemeContext.Provider>
    );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Returns the active colour token set. */
export function useTheme(): Theme {
    return useContext(ThemeContext).theme;
}

/**
 * Returns the current mode preference and a setter.
 * Use this to build theme pickers / toggles.
 */
export function useThemeToggle() {
    const { activeMode, colorMode, setColorMode } = useContext(ThemeContext);
    return { activeMode, colorMode, setColorMode };
}

export { light, dark };