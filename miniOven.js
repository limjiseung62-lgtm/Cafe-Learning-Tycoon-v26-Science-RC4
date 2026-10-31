export const ovenZone = { start: 50, end: 78, durationMs: 8000 };
export const ovenPosition = (startedAt, now) => Math.max(0, Math.min(100, (now - startedAt) / ovenZone.durationMs * 100));
export function ovenResult(position) { return position < ovenZone.start ? 'early' : position > ovenZone.end ? 'late' : 'success'; }
