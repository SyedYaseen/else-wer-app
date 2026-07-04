// theme/index.tsx — Folio Design System
//
// Supports three modes: 'system' (follows OS), 'light', 'dark'.
//
// Setup — wrap your root _layout.tsx:
//   import { ThemeProvider } from '@/theme';
//   export default function RootLayout() {
//     return <ThemeProvider><Stack /></ThemeProvider>;
//   }
//
// Usage in any screen or component:
//   const T = useTheme();                                  // colour + design tokens
//   const { colorMode, setColorMode } = useThemeToggle();   // toggle
//
// T.ink / T.accent / ... — flat colour tokens (unchanged since the original
// components/hooks/useTheme.tsx; every existing call site keeps working).
// T.space / T.radius / T.font / T.icon / T.shadow — namespaced design tokens.

import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark } from './colors';
import { space } from './spacing';
import { font } from './typography';
import { radius } from './radius';
import { icon } from './icons';
import { alpha } from './alpha';
import { opacity } from './opacity';
import { getShadows } from './shadows';

export { light, dark };
export { space } from './spacing';
export { font } from './typography';
export { radius } from './radius';
export { icon } from './icons';
export type { IconName } from './icons';
export { alpha } from './alpha';
export { opacity } from './opacity';

export type ColorMode = 'light' | 'dark' | 'system';

const staticTokens = { space, font, radius, icon, alpha, opacity };

function composeTheme(mode: 'light' | 'dark') {
    const colors = mode === 'dark' ? dark : light;
    return {
        ...colors,
        ...staticTokens,
        shadow: getShadows(mode),
    };
}

export type Theme = ReturnType<typeof composeTheme>;

// ── Context ───────────────────────────────────────────────────────────────────

type ThemeContextValue = {
    theme: Theme;
    activeMode: 'light' | 'dark';
    colorMode: ColorMode;
    setColorMode: (mode: ColorMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
    theme: composeTheme('light'),
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

    const theme = composeTheme(activeMode);

    return (
        <ThemeContext.Provider value={{ theme, activeMode, colorMode, setColorMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Returns the active token set (colours + design tokens). */
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
