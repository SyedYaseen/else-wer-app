// theme/radius.ts — border-radius scale, fitted to values already in use
// (menu.tsx: 8/10/14, login.tsx: 8/10/20/100).

export const radius = {
    sm: 8,
    md: 10,
    lg: 14,
    xl: 20,
    pill: 100,
} as const;

export type RadiusScale = typeof radius;
