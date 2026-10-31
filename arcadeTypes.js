export const difficultyIndex = (d) => ({ easy: 0, normal: 1, challenge: 2 }[d]);
export function randomFor(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return (n >>> 8) / 16777216; }; }
export const arcadeOpen = (s, now) => s.endedAt === undefined && Number.isFinite(now) && now >= s.startedAt && now < s.startedAt + 45000;
