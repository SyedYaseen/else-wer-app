// theme/alpha.ts — shared scale for alpha-blended colors built via string
// concatenation (`T.<color> + T.alpha.x`). Each value here matches a hex
// alpha suffix already in use across the app; consolidated so the same
// visual weight is never re-typed as a raw hex string at another call site.

export const alpha = {
    faint: '14',   // ~8%  — subtle tinted backgrounds (danger banner, online pill)
    wash: '18',    // ~9%  — icon-well tint background
    muted: '33',   // ~20% — highlighted text background
    soft: '44',    // ~27% — subtle borders
    medium: '66',  // ~40% — visible borders
    strong: 'AA',  // ~67% — active switch track
    heavy: 'CC',   // ~80% — translucent overlay backgrounds
} as const;

export type AlphaScale = typeof alpha;
