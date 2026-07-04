// theme/opacity.ts — shared opacity constants for non-interactive states.
// `disabled` and `busy` are deliberately different weights: `disabled` marks
// a control as unavailable (dimmed heavily), while `busy` marks a control as
// temporarily working (kept mostly visible so content doesn't flash/hide).

export const opacity = {
    disabled: 0.35,
    busy: 0.7,
} as const;

export type OpacityScale = typeof opacity;
