// theme/icons.ts — icon-size scale for @expo/vector-icons usage, fitted to
// the range of sizes already in use (12–52px commonly; a few one-off
// illustrative sizes above that, e.g. 76px, are left as literals rather
// than forced into the scale).

export const icon = {
    xs: 12,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 26,
    xxl: 32,
    hero: 52,
} as const;

export type IconScale = typeof icon;
