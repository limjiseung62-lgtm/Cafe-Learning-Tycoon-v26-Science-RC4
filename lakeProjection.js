/** Visual-only row projection. Saved positions and BFS collision grid remain unchanged. */
const anchors = [[0, 0], [4.5 / 18, 23 / 100], [5.5 / 18, 28 / 100], [10.5 / 18, 51 / 100], [11.5 / 18, 57 / 100], [14.5 / 18, 81 / 100], [15.5 / 18, 86 / 100], [1, 1]];
function interpolate(value, reverse = false) { const pairs = reverse ? anchors.map(([a, b]) => [b, a]) : anchors; const v = Math.max(0, Math.min(1, value)); for (let i = 1; i < pairs.length; i++) {
    const [a, b] = pairs[i - 1], [c, d] = pairs[i];
    if (v <= c)
        return b + (v - a) / (c - a) * (d - b);
} return 1; }
export const lakeVisualY = (row) => interpolate((row + .5) / 18) * 100;
export const lakeLogicalY = (fraction) => Math.max(0, Math.min(17, Math.floor(interpolate(fraction, true) * 18)));
