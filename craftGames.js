export const breads = ['식빵', '크루아상', '머핀', '쿠키'];
export const flowers = ['장미', '튤립', '데이지', '해바라기', '라벤더', '장식꽃'];
export const colors = ['분홍', '분홍', '흰색', '노랑', '보라', '흰색'];
const levels = { easy: 0, normal: 1, challenge: 2 };
export function createCraft(kind, difficulty, seed, now) { let x = seed >>> 0; const rand = () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x; }; return { version: 1, kind, difficulty, seed: seed >>> 0, startedAt: now, duration: 45, orders: Array.from({ length: 9 }, (_, id) => ({ id, item: (rand() >>> 8) % (kind === 'oven' ? 4 : 5), count: kind === 'oven' ? 1 : 3 + levels[difficulty] * 2, accent: kind === 'flowers' && difficulty !== 'easy', balanced: kind === 'flowers' && difficulty === 'challenge' })), cursor: 0, ovens: Array(difficulty === 'challenge' ? 3 : 2).fill(null), bouquet: Array(7).fill(null), ribbon: false, history: [], selected: 0, message: '주문 조건을 보고 만들어 주세요' }; }
export function craftOpen(s, now) { return s.endedAt === undefined && Number.isFinite(now) && now >= s.startedAt && now < s.startedAt + 45000; }
export function tickCraft(s, now) { if (s.endedAt === undefined && (now >= s.startedAt + 45000 || s.cursor >= s.orders.length))
    s.endedAt = Math.min(now, s.startedAt + 45000); }
export function ovenTiming(s, b, now) { const seconds = [6, 4.5, 5, 3.5][b.item] * (s.difficulty === 'easy' ? 1.15 : 1), progress = Math.max(0, (now - b.loadedAt) / 1000 / seconds * 75), half = [16, 11, 7][levels[s.difficulty]], quality = progress < 75 - half ? '덜 익음' : progress <= 75 + half ? '알맞음' : progress < 112 ? '과하게 익음' : '탐'; return { progress: Math.min(125, progress), low: 75 - half, high: 75 + half, quality, points: quality === '알맞음' ? Math.round(1000 - Math.abs(75 - progress) * 12) : quality === '탐' ? 0 : 250 }; }
export function loadOven(s, slot, item, now) { if (!craftOpen(s, now) || s.kind !== 'oven' || !Number.isInteger(slot) || slot < 0 || slot >= s.ovens.length || s.ovens[slot] || !Number.isInteger(item) || item < 0 || item > 3)
    return false; const order = s.orders.slice(s.cursor).find(o => o.item === item && !s.history.some(h => h.orderId === o.id) && !s.ovens.some(b => b?.orderId === o.id)); if (!order) {
    s.message = '이 빵의 남은 주문이 없어요';
    return false;
} s.ovens[slot] = { orderId: order.id, item, loadedAt: now }; s.message = breads[item] + ' 넣기 완료 · 다른 오븐도 살펴보세요'; return true; }
export function takeOven(s, slot, now) { const b = s.ovens[slot]; if (!craftOpen(s, now) || !b || b.takenAt !== undefined)
    return false; const r = ovenTiming(s, b, now); b.takenAt = now; b.quality = r.quality; b.points = r.points; s.message = r.quality + ' · 제출하거나 다시 구울 수 있어요'; return true; }
export function submitOven(s, slot, now, discard = false) { const b = s.ovens[slot]; if (!craftOpen(s, now) || !b || b.takenAt === undefined)
    return false; if (!discard) {
    if (s.history.some(h => h.orderId === b.orderId))
        return false;
    s.history.push({ orderId: b.orderId, score: b.points, accuracy: b.quality === '알맞음' ? 100 : b.quality === '탐' ? 0 : 25, exact: b.quality === '알맞음', note: breads[b.item] + ' · ' + b.quality });
} s.ovens[slot] = null; while (s.history.some(h => h.orderId === s.cursor))
    s.cursor++; s.message = discard ? '다시 구워도 괜찮아요!' : '주문 제출 완료'; tickCraft(s, now); return true; }
export function placeFlower(s, slot, item, now) { if (!craftOpen(s, now) || s.kind !== 'flowers' || !Number.isInteger(slot) || slot < 0 || slot > 6 || item !== null && (!Number.isInteger(item) || item < 0 || item > 5))
    return false; s.bouquet[slot] = item; s.message = item === null ? '꽃을 뺐어요' : flowers[item] + ' 배치 · 다른 꽃으로 바꾸거나 이동할 수 있어요'; return true; }
export function moveFlower(s, from, to, now) { if (!craftOpen(s, now) || s.kind !== 'flowers' || ![from, to].every(x => Number.isInteger(x) && x >= 0 && x < 7) || s.bouquet[from] === null)
    return false; [s.bouquet[from], s.bouquet[to]] = [s.bouquet[to], s.bouquet[from]]; s.message = '두 자리의 꽃을 바꿨어요'; return true; }
export function flowerEvaluation(s) { const o = s.orders[s.cursor]; if (!o)
    return { score: 0, accuracy: 0, exact: false, note: '주문 종료' }; const filled = s.bouquet.filter(x => x !== null), main = filled.filter(x => colors[x] === colors[o.item]).length, checks = [filled.length === o.count, main >= Math.ceil(o.count / 2), s.bouquet[0] === o.item, ...o.accent ? [s.ribbon && filled.includes(5)] : [], ...o.balanced ? [s.bouquet.slice(1, 4).filter(x => x !== null).length === s.bouquet.slice(4).filter(x => x !== null).length] : []], accuracy = Math.round(checks.filter(Boolean).length / checks.length * 100); return { score: accuracy * 10, accuracy, exact: checks.every(Boolean), note: checks.every(Boolean) ? '주문 조건을 모두 만족해요!' : '개수·주된 색·중심 꽃' + (o.accent ? '·장식꽃과 리본' : '') + (o.balanced ? '·좌우 개수' : '') + '을 확인해요' }; }
export function submitFlowers(s, now) { if (!craftOpen(s, now) || s.kind !== 'flowers' || !s.bouquet.some(x => x !== null))
    return false; const r = flowerEvaluation(s); s.history.push({ orderId: s.cursor, ...r }); s.cursor++; s.bouquet.fill(null); s.ribbon = false; s.message = r.note; tickCraft(s, now); return true; }
export function craftStats(s) { const n = s.history.length, score = s.history.reduce((a, h) => a + h.score, 0), exact = s.history.filter(h => h.exact).length; return { score, exact, processed: n, accuracy: n ? Math.round(s.history.reduce((a, h) => a + h.accuracy, 0) / n) : 0, stars: score >= 6000 ? 3 : score >= 2500 ? 2 : 1 }; }
export function validCraft(v) { try {
    const s = v;
    if (!s || s.version !== 1 || !['oven', 'flowers'].includes(s.kind) || !Object.hasOwn(levels, s.difficulty) || !Number.isSafeInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff || !Number.isFinite(s.startedAt) || s.startedAt < 0 || s.duration !== 45)
        return false;
    const base = createCraft(s.kind, s.difficulty, s.seed, s.startedAt);
    if (JSON.stringify(s.orders) !== JSON.stringify(base.orders) || !Number.isInteger(s.cursor) || s.cursor < 0 || s.cursor > 9 || s.ovens.length !== base.ovens.length || s.bouquet.length !== 7 || !s.bouquet.every(x => x === null || Number.isInteger(x) && x >= 0 && x < 6) || typeof s.ribbon !== 'boolean' || typeof s.message !== 'string' || s.message.length > 200 || !Number.isInteger(s.selected) || s.selected < 0 || s.selected > 6)
        return false;
    if (s.endedAt !== undefined && (!Number.isFinite(s.endedAt) || s.endedAt < s.startedAt || s.endedAt > s.startedAt + 45000))
        return false;
    if (!Array.isArray(s.history) || s.history.length > 9 || new Set(s.history.map(h => h.orderId)).size !== s.history.length || !s.history.every(h => Number.isInteger(h.orderId) && h.orderId >= 0 && h.orderId < 9 && Number.isFinite(h.score) && h.score >= 0 && h.score <= 1000 && Number.isFinite(h.accuracy) && h.accuracy >= 0 && h.accuracy <= 100 && typeof h.exact === 'boolean' && typeof h.note === 'string'))
        return false;
    const used = new Set();
    return s.ovens.every(b => { if (b === null)
        return true; if (s.kind !== 'oven' || !Number.isInteger(b.orderId) || b.orderId < 0 || b.orderId > 8 || used.has(b.orderId) || s.history.some(h => h.orderId === b.orderId) || b.item !== s.orders[b.orderId].item || !Number.isFinite(b.loadedAt) || b.loadedAt < s.startedAt || b.loadedAt >= s.startedAt + 45000)
        return false; used.add(b.orderId); if (b.takenAt === undefined)
        return b.points === undefined && b.quality === undefined; const r = ovenTiming(s, b, b.takenAt); return b.takenAt >= b.loadedAt && b.takenAt < s.startedAt + 45000 && b.quality === r.quality && b.points === r.points; });
}
catch {
    return false;
} }
