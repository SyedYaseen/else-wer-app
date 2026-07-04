// theme/colors.ts — Folio color tokens (light/dark), moved verbatim from the
// original components/hooks/useTheme.tsx

export const light = {
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

export const dark = {
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

export type ColorTokens = typeof light;
