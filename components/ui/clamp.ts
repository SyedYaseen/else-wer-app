// components/ui/clamp.ts — shared numeric clamp for progress-style primitives.

export function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}
