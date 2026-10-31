export const flowerTokens = ['pink', 'yellow', 'blue'];
export const flowerTarget = (seed) => Array.from({ length: 4 }, (_, i) => flowerTokens[(seed + i + (i === 3 ? 1 : 0)) % 3]);
export const flowersMatch = (target, placed) => target.length === 4 && placed.length === 4 && target.every((t, i) => t !== null && t === placed[i]);
