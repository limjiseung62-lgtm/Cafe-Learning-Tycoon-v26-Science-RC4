export const cakeTokens = ['strawberry', 'cream', 'chocolate'];
export function cakeTarget(seed) { const result = Array(9).fill(null); for (const [i, position] of [0, 2, 4, 6, 8].entries())
    result[position] = cakeTokens[(seed + i) % 3]; return result; }
export function cakeMatches(target, placed) { return target.length === 9 && placed.length === 9 && target.every((t, i) => t === placed[i]); }
