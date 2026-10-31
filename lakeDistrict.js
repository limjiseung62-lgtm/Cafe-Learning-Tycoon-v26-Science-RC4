export const lakeBuildings = [{ id: 'site', x: 17, y: 11, w: 5, h: 3, door: { x: 19, y: 14 } }, { id: 'kiosk', x: 18, y: 1, w: 4, h: 3, door: { x: 20, y: 4 } }, { id: 'photo', x: 3, y: 12, w: 4, h: 2, door: { x: 5, y: 14 } }];
export const lakeResidents = [
    { id: 'keeper', name: '호숫가 관리인 온유', visual: 'gentleman', at: { x: 15, y: 10 }, line: '호수는 바라보고, 길에서는 천천히! 새 가게 자리를 함께 정리할래?' },
    { id: 'seller', name: '산책로 상인 마루', visual: 'traveler', at: { x: 20, y: 5 }, line: '산책 온 손님들의 주문을 차근차근 나눠 보자.' },
    { id: 'photographer', name: '사진작가 빛나', visual: 'painter', at: { x: 5, y: 14 }, line: '다리에서 본 풍경과 꽃 장식을 사진에 담고 싶어!' },
    { id: 'visitor', name: '여행객 다솔', visual: 'bookworm', at: { x: 10, y: 10 }, line: '처음 온 곳이라 길이 낯설어. 전망대까지 안내해 줄래?' }
];
export const lakeQuests = [
    { id: 'site', name: '새 카페 부지 정비', resident: 'keeper', goals: { correct: 3, mini: 1, spots: 1 }, kind: 'machine', reward: '호숫가 부지 정비 확인서', core: true },
    { id: 'guide', name: '산책로 길 안내', resident: 'visitor', goals: { correct: 2, talks: 3, spots: 2 }, reward: '다솔의 여행 지도', core: true },
    { id: 'orders', name: '여행객 주문 해결', resident: 'seller', goals: { served: 5, mini: 1 }, kind: 'sort', reward: '상인들의 창업 추천서', core: true },
    { id: 'photo', name: '우리의 첫 풍경 사진', resident: 'photographer', goals: { correct: 2, spots: 2, mini: 1 }, kind: 'flowers', reward: '호숫가 풍경 사진', core: false },
    { id: 'lake-festival', name: '호숫가 소풍 축제', resident: 'keeper', goals: { correct: 3, served: 4, mini: 1 }, kind: 'tray', reward: '호숫가 축제 배지', core: false }
];
export const lakeSpots = [{ id: 'lookout', name: '작은 다리 전망대', x: 10, y: 5 }, { id: 'site', name: '카페 예정 부지 앞', x: 19, y: 14 }, { id: 'photo', name: '호숫가 사진 광장', x: 5, y: 14 }];
export const createDistrict = () => ({ version: 1, region: 'village', position: { x: 23, y: 10 }, residents: [], quests: {}, souvenirs: [], opened: false, visits: 0 });
export function lakeWalkable(p) { return Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.x < 24 && p.y >= 0 && p.y < 18 && !lakeBuildings.some(b => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h) && (p.y === 10 || p.y === 11 || p.y === 14 || p.y === 15 || p.x === 16 && p.y >= 4 && p.y <= 15 || p.y === 4 && p.x >= 16 && p.x <= 22 || p.y === 5 && p.x >= 10 && p.x <= 22 || p.x === 20 && p.y >= 4 && p.y <= 10 || p.x === 10 && p.y >= 5 && p.y <= 10); }
export function lakePath(from, to) { if (!lakeWalkable(from) || !lakeWalkable(to))
    return []; const key = (p) => p.y * 24 + p.x, queue = [from], parent = new Map([[key(from), null]]); for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (key(p) === key(to)) {
        const path = [];
        let at = p;
        while (at) {
            path.unshift(at);
            at = parent.get(key(at)) ?? null;
        }
        return path.slice(1);
    }
    for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: p.x + x, y: p.y + y };
        if (lakeWalkable(n) && !parent.has(key(n))) {
            parent.set(key(n), p);
            queue.push(n);
        }
    }
} return []; }
const served = (s) => s.cumulativeCustomersServed + (s.portfolio?.inactive?.save.cumulativeCustomersServed ?? 0);
export function talkLake(s, id) { const d = s.portfolio?.district; if (!d || s.village?.progression?.stage !== 5 || !lakeResidents.some(r => r.id === id))
    return false; if (!d.residents.includes(id))
    d.residents.push(id); for (const [qid, r] of Object.entries(d.quests))
    if (!r.claimed && lakeQuests.find(q => q.id === qid)?.resident !== id && !r.talked.includes(id))
        r.talked.push(id); return true; }
export function visitLake(s, p) { const d = s.portfolio?.district; if (!d || s.village?.progression?.stage !== 5 || !lakeWalkable(p))
    return false; d.position = { ...p }; for (const [qid, r] of Object.entries(d.quests))
    for (const spot of lakeSpots)
        if ((qid === 'site' ? spot.id === 'site' : qid === 'photo' ? ['lookout', 'photo'].includes(spot.id) : qid === 'guide') && !r.claimed && Math.abs(spot.x - p.x) + Math.abs(spot.y - p.y) <= 1 && !r.spots.includes(spot.id))
            r.spots.push(spot.id); return true; }
export function acceptLakeQuest(s, id, now = Date.now()) { const d = s.portfolio?.district, q = lakeQuests.find(q => q.id === id); if (!d || s.village?.progression?.stage !== 5 || !q || d.quests[id] || !d.residents.includes(q.resident))
    return false; d.quests[id] = { baseCorrect: s.cumulativeQuestionsCorrect, baseServed: served(s), baseMini: (s.miniCollection?.receipts ?? []).map(r => r.id), acceptedAt: now, progress: {}, talked: [], spots: [], claimed: false }; return true; }
export function syncLake(s) { const d = s.portfolio?.district; if (!d)
    return; for (const [id, r] of Object.entries(d.quests)) {
    if (r.claimed)
        continue;
    const q = lakeQuests.find(q => q.id === id);
    const data = { correct: Math.max(0, s.cumulativeQuestionsCorrect - r.baseCorrect), served: Math.max(0, served(s) - r.baseServed), talks: r.talked.length, spots: r.spots.length, mini: (s.miniCollection?.receipts ?? []).filter(m => m.kind === q.kind && m.outcome === 'success' && !r.baseMini.includes(m.id) && m.at >= r.acceptedAt).length };
    for (const k of Object.keys(q.goals))
        r.progress[k] = Math.max(r.progress[k] ?? 0, Math.min(q.goals[k], data[k]));
} }
export function lakeQuestReady(s, id) { const r = s.portfolio?.district.quests[id], q = lakeQuests.find(q => q.id === id); return !!r && !!q && !r.claimed && Object.entries(q.goals).every(([k, n]) => (r.progress[k] ?? 0) >= n); }
export function claimLakeQuest(s, id) { if (!lakeQuestReady(s, id))
    return false; const d = s.portfolio.district; d.quests[id].claimed = true; d.souvenirs.push(id); return true; }
export function desiredLakeMini(s) { return lakeQuests.find(q => q.kind && s?.portfolio?.district.quests[q.id] && !s.portfolio.district.quests[q.id].claimed && (s.portfolio.district.quests[q.id].progress.mini ?? 0) < 1)?.kind; }
export function validDistrict(v) { try {
    const d = v, n = (x) => Number.isSafeInteger(x) && Number(x) >= 0, strings = (a, max) => Array.isArray(a) && a.length <= max && new Set(a).size === a.length && a.every(x => typeof x === 'string' && x.length <= 180);
    if (!d || d.version !== 1 || !['village', 'lake'].includes(d.region) || !lakeWalkable(d.position) || !strings(d.residents, 4) || d.residents.some(id => !lakeResidents.some(r => r.id === id)) || !strings(d.souvenirs, 5) || typeof d.opened !== 'boolean' || !n(d.visits) || !d.quests || Object.keys(d.quests).length > 5)
        return false;
    for (const [id, r] of Object.entries(d.quests)) {
        const q = lakeQuests.find(q => q.id === id);
        if (!q || !d.residents.includes(q.resident) || !r || ![r.baseCorrect, r.baseServed, r.acceptedAt].every(n) || !strings(r.baseMini, 300) || !strings(r.talked, 4) || r.talked.some(id => !lakeResidents.some(x => x.id === id)) || !strings(r.spots, 3) || r.spots.some(id => !lakeSpots.some(x => x.id === id)) || !r.progress || Object.entries(r.progress).some(([k, x]) => !Object.hasOwn(q.goals, k) || !n(x) || x > q.goals[k]) || typeof r.claimed !== 'boolean' || r.claimed && !Object.entries(q.goals).every(([k, n]) => (r.progress[k] ?? 0) >= n))
            return false;
    }
    return d.souvenirs.length === Object.values(d.quests).filter(r => r.claimed).length && d.souvenirs.every(id => d.quests[id]?.claimed);
}
catch {
    return false;
} }
const lakePatrols = [[{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 16, y: 11 }, { x: 15, y: 11 }], [{ x: 20, y: 5 }], [{ x: 5, y: 14 }], [{ x: 10, y: 10 }, { x: 12, y: 10 }, { x: 12, y: 11 }, { x: 10, y: 11 }]];
const patrolCache = new Map();
export function lakeResidentPosition(index, seconds) { const patrol = lakePatrols[index]; if (!patrol)
    return { ...lakeResidents[0].at }; if (patrol.length === 1)
    return { ...patrol[0] }; let cells = patrolCache.get(index); if (!cells) {
    cells = patrol.flatMap((p, i) => lakePath(p, patrol[(i + 1) % patrol.length]));
    patrolCache.set(index, cells);
} return { ...(cells[Math.floor(Math.max(0, seconds) / 1.4) % cells.length] ?? patrol[0]) }; }
