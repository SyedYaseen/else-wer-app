// theme/spacing.ts — spacing scale, fitted to the padding/margin/gap values
// already in use across the app (e.g. menu.tsx, login.tsx, downloads.tsx).

export const space = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
} as const;

export type SpaceScale = typeof space;
