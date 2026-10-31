import { unlocked } from './progressiveFeatures.js';
import { validVillageProgression, progressionMini, availableStage } from './villageProgression.js';
export const villageSize = { width: 24, height: 18 };
export const buildings = [
    { id: 'cafe', name: '내 카페', art: 0, x: 1, y: 1, w: 5, h: 4, door: { x: 3, y: 5 } },
    { id: 'flowers', name: '꽃집', art: 1, x: 9, y: 1, w: 5, h: 4, door: { x: 11, y: 5 } },
    { id: 'market', name: '시장', art: 2, x: 18, y: 1, w: 5, h: 4, door: { x: 20, y: 5 } },
    { id: 'mill', name: '제분소', art: 3, x: 1, y: 11, w: 5, h: 4, door: { x: 3, y: 15 } },
    { id: 'workshop', name: '공방', art: 4, x: 9, y: 11, w: 5, h: 4, door: { x: 11, y: 15 } },
    { id: 'plaza', name: '중앙 광장', art: 5, x: 18, y: 11, w: 5, h: 4, door: { x: 20, y: 15 } }
];
export const residents = [
    { id: 'bloom', name: '꽃집 주인 소담', visual: 'painter', home: 'flowers', personality: '꽃 한 송이도 소중히 여겨요.', line: '축제에 쓸 꽃 장식을 함께 만들어 줄래?', path: [{ x: 11, y: 5 }, { x: 14, y: 5 }, { x: 14, y: 6 }, { x: 11, y: 6 }] },
    { id: 'vendor', name: '시장 상인 다온', visual: 'traveler', home: 'market', personality: '손님을 기억하는 다정한 상인이에요.', line: '주문이 섞이지 않게 정리하는 비결이 궁금해!', path: [{ x: 20, y: 5 }, { x: 18, y: 5 }, { x: 18, y: 6 }, { x: 20, y: 6 }] },
    { id: 'miller', name: '제분소 주인 보리', visual: 'gentleman', home: 'mill', personality: '천천히 해도 정확하게 하는 것을 좋아해요.', line: '갓 만든 밀가루로 빵을 구워 줄 수 있니?', path: [{ x: 3, y: 15 }, { x: 6, y: 15 }, { x: 6, y: 16 }, { x: 3, y: 16 }] },
    { id: 'maker', name: '공방 장인 윤슬', visual: 'office', home: 'workshop', personality: '고장 난 물건도 다시 쓸 수 있다고 믿어요.', line: '커피 머신을 고쳐 마을에 향기를 돌려주자.', path: [{ x: 11, y: 15 }, { x: 14, y: 15 }, { x: 14, y: 16 }, { x: 11, y: 16 }] },
    { id: 'host', name: '행사 담당 해솔', visual: 'fashion', home: 'plaza', personality: '함께하는 작은 축제를 준비해요.', line: '축제 케이크와 따뜻한 손님맞이를 부탁해!', path: [{ x: 20, y: 15 }, { x: 18, y: 15 }, { x: 18, y: 16 }, { x: 20, y: 16 }] },
    { id: 'guide', name: '마을 안내인 여울', visual: 'bookworm', home: 'cafe', personality: '처음 온 이웃이 길을 찾도록 도와줘요.', line: '광장을 둘러보고 이웃들에게 인사해 볼래?', path: [{ x: 8, y: 8 }, { x: 12, y: 8 }, { x: 12, y: 10 }, { x: 8, y: 10 }] }
];
export const materialNodes = [{ id: 'ribbon', name: '리본 꾸러미', x: 7, y: 6 }, { id: 'wood', name: '작은 나무 조각', x: 16, y: 10 }, { id: 'seeds', name: '꽃씨 봉투', x: 7, y: 15 }];
export function walkable(p, stage = 1) { return Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.x < 24 && p.y >= 0 && p.y < 18 && !(stage >= 2 && p.x >= 14 && p.x <= 15 && p.y >= 8 && p.y <= 9) && !buildings.some(b => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h) && (stage >= 5 && p.y === 17 && p.x >= 20 || p.y >= 5 && p.y <= 6 || p.y >= 9 && p.y <= 10 || p.y >= 15 && p.y <= 16 || [3, 11, 20].some(x => Math.abs(x - p.x) <= 1) || [7, 16].includes(p.x) && p.y >= 5 && p.y <= 16 || p.x >= 7 && p.x <= 16 && p.y >= 7 && p.y <= 10); }
export function villagePath(from, to, stage = 1) { if (!walkable(from, stage) || !walkable(to, stage))
    return []; const key = (p) => p.y * 24 + p.x, queue = [from], parents = new Map([[key(from), null]]); for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (key(p) === key(to)) {
        const result = [];
        let at = p;
        while (at) {
            result.unshift(at);
            at = parents.get(key(at)) ?? null;
        }
        return result.slice(1);
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: p.x + dx, y: p.y + dy };
        if (walkable(n, stage) && !parents.has(key(n))) {
            parents.set(key(n), p);
            queue.push(n);
        }
    }
} return []; }
export function approachPoint(from, to, stage = 1) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, y]) => ({ x: to.x + x, y: to.y + y })).filter(p => walkable(p, stage)).map(p => ({ p, path: villagePath(from, p, stage) })).filter(({ p, path }) => path.length || p.x === from.x && p.y === from.y).sort((a, b) => a.path.length - b.path.length)[0]?.p; }
const residentRoutes = new Map();
export function residentPosition(index, seconds, stage = 1) { const path = stage >= 5 && index === 5 ? [{ x: 20, y: 16 }, { x: 23, y: 17 }] : stage >= 2 && index === 4 ? [{ x: 20, y: 15 }, { x: 20, y: 10 }, { x: 17, y: 10 }, { x: 20, y: 10 }] : residents[index].path; const routeKey = stage * 10 + index; let cells = residentRoutes.get(routeKey); if (!cells) {
    cells = path.flatMap((p, i) => villagePath(p, path[(i + 1) % path.length], stage));
    residentRoutes.set(routeKey, cells);
} if (stage >= 3 && index === 3 && seconds % 12 < 6)
    return { ...buildings[4].door }; if (stage >= 4 && index === 1 && seconds % 10 < 5)
    return { ...buildings[2].door }; return { ...(cells[Math.floor(Math.max(0, seconds) / (1 + index * .13) + index * 3) % cells.length] ?? path[0]) }; }
export const questCatalog = [
    { id: 'bouquet', resident: 'bloom', name: '첫 꽃 축제 장식', story: '공부로 준비한 재료를 모아 꽃 장식을 완성해요.', goal: { correct: 2, flowers: 1 }, reward: '소담의 꽃 리본', points: 15, mini: 'flowers' },
    { id: 'market-orders', resident: 'vendor', name: '시장 주문 도우미', story: '카페 주문을 서빙하고 시장 주문도 정확히 분류해요.', goal: { served: 4, sort: 1 }, reward: '다온의 시장 바구니', points: 15, mini: 'sort' },
    { id: 'warm-bread', resident: 'miller', name: '따뜻한 빵 한 판', story: '공부로 반죽을 준비하고 오븐에서 빵을 구워요.', goal: { correct: 3, oven: 1 }, reward: '보리의 밀 이삭', points: 15, mini: 'oven' },
    { id: 'repair', resident: 'maker', name: '향기를 되찾은 머신', story: '학습 후 물길을 이어 커피 머신을 고쳐요.', goal: { correct: 2, machine: 1 }, reward: '윤슬의 작은 공구함', points: 15, mini: 'machine' },
    { id: 'neighbors', resident: 'guide', name: '이웃에게 안부 전하기', story: '공부 한 문제를 풀고 두 이웃에게 인사한 뒤 광장을 찾아요.', goal: { correct: 1, talks: 2, plaza: 1 }, reward: '첫 마을 친구 배지', points: 10 },
    { id: 'materials', resident: 'maker', name: '다시 쓰는 작은 재료', story: '길가의 재료 세 개를 모으고 공부로 제작 방법을 익혀요.', goal: { correct: 4, materials: 3 }, reward: '재활용 나무 액자', points: 15 },
    { id: 'welcome', resident: 'host', name: '특별한 손님맞이', story: '공부하고 카페의 특별 손님 한 명을 정상 서빙해요.', goal: { correct: 2, special: 1 }, reward: '해솔의 환영 깃발', points: 15 },
    { id: 'festival', resident: 'host', name: '광장의 작은 잔치', story: '공부로 재료를 마련하고 축제 케이크를 완성해요.', goal: { correct: 3, cake: 1, plaza: 1 }, reward: '광장 축제 기념 접시', points: 20, mini: 'cake' }
];
export const metricNames = { correct: '학습 정답', served: '카페 서빙', special: '특별 손님 서빙', flowers: '꽃 장식 성공', sort: '주문 분류 성공', oven: '오븐 성공', machine: '머신 수리 성공', cake: '케이크 성공', talks: '서로 다른 주민 인사', materials: '마을 재료 수집', plaza: '광장 방문' };
export function createVillage() { return { version: 1, position: { x: 3, y: 6 }, quests: {}, residents: {}, development: 0, facilities: ['flowers', 'market', 'mill', 'workshop'], souvenirs: [], futurePlots: [{ id: 'second-cafe', status: 'reserved' }], visits: 0 }; }
export function villageMetrics(s) { return { correct: s.cumulativeQuestionsCorrect, served: s.cumulativeCustomersServed + (s.portfolio?.inactive?.save.cumulativeCustomersServed ?? 0), special: s.specialCustomerStats.served + (s.portfolio?.inactive?.save.specialCustomerStats.served ?? 0), receipts: s.miniCollection?.receipts ?? [] }; }
export function syncVillage(v, m) { for (const [id, r] of Object.entries(v.quests)) {
    if (r.claimed)
        continue;
    const q = questCatalog.find(q => q.id === id);
    for (const metric of Object.keys(q.goal)) {
        let n = 0;
        if (['correct', 'served', 'special'].includes(metric)) {
            const k = metric;
            n = Math.max(0, m[k] - r.base[k]);
        }
        else if (['flowers', 'sort', 'oven', 'machine', 'cake'].includes(metric))
            n = m.receipts.filter(x => x.kind === metric && x.outcome === 'success' && !r.base.miniIds.includes(x.id) && x.at >= r.acceptedAt).length;
        else
            n = metric === 'talks' ? r.talked.length : metric === 'materials' ? r.materials.length : r.progress.plaza ?? 0;
        r.progress[metric] = Math.max(r.progress[metric] ?? 0, Math.min(q.goal[metric], n));
    }
} }
export const questReady = (v, id) => { const r = v.quests[id], q = questCatalog.find(q => q.id === id); return !!r && !!q && !r.claimed && Object.entries(q.goal).every(([k, n]) => (r.progress[k] ?? 0) >= n); };
export function acceptQuest(v, id, m, now = Date.now()) { if (!questAvailable(v, id))
    return false; const q = questCatalog.find(q => q.id === id); if (!q || v.quests[id] || !v.residents[q.resident]?.met)
    return false; v.quests[id] = { acceptedAt: now, base: { correct: m.correct, served: m.served, special: m.special, miniIds: m.receipts.map(r => r.id) }, progress: {}, talked: [], materials: [], claimed: false }; return true; }
export function talkVillage(v, id) { if (!residents.some(r => r.id === id))
    return false; v.residents[id] ??= { met: true, trust: 0 }; for (const q of Object.values(v.quests))
    if (!q.claimed && !q.talked.includes(id))
        q.talked.push(id); return true; }
export function visitVillagePoint(v, p) { if (!walkable(p, v.progression?.stage))
    return false; v.position = { ...p }; for (const r of Object.values(v.quests)) {
    if (r.claimed)
        continue;
    if (Math.abs(p.x - 12) + Math.abs(p.y - 9) <= 2)
        r.progress.plaza = 1;
    for (const n of materialNodes)
        if (Math.abs(n.x - p.x) + Math.abs(n.y - p.y) <= 1 && !r.materials.includes(n.id))
            r.materials.push(n.id);
} return true; }
export function claimQuest(v, id) { if (!questReady(v, id))
    return false; const q = questCatalog.find(q => q.id === id); v.quests[id].claimed = true; v.development += q.points; v.souvenirs.push(q.id); v.residents[q.resident].trust++; v.event = { bloom: 'festival', vendor: 'materials', guide: 'lost' }[q.resident] ?? 'festival'; return true; }
export function desiredVillageMini(v) { return progressionMini(v) ?? questCatalog.find(q => q.mini && v?.quests[q.id] && !v.quests[q.id].claimed && (v.quests[q.id].progress[q.mini] ?? 0) < 1)?.mini; }
const int = (x, max = 1e12) => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 && x <= max;
export function validVillage(value) { try {
    const v = value;
    if (!v || v.progression !== undefined && !validVillageProgression(v.progression) || v.version !== 1 || !walkable(v.position, v.progression?.stage) || !int(v.visits) || !int(v.development, 120) || !v.quests || Array.isArray(v.quests) || Object.keys(v.quests).length > 8 || !v.residents || Array.isArray(v.residents) || Object.entries(v.residents).some(([id, r]) => !residents.some(n => n.id === id) || !r || r.met !== true || !int(r.trust, 8)) || !Array.isArray(v.facilities) || v.facilities.join(',') !== 'flowers,market,mill,workshop' || !Array.isArray(v.souvenirs) || new Set(v.souvenirs).size !== v.souvenirs.length || JSON.stringify(v.futurePlots) !== JSON.stringify([{ id: 'second-cafe', status: 'reserved' }]) || v.event !== undefined && !['lost', 'materials', 'festival'].includes(v.event))
        return false;
    let points = 0;
    const trust = {};
    for (const [id, r] of Object.entries(v.quests)) {
        const q = questCatalog.find(q => q.id === id);
        if (!q || !v.residents[q.resident]?.met || !r || !int(r.acceptedAt, 1e15) || typeof r.claimed !== 'boolean' || !r.base || !['correct', 'served', 'special'].every(k => int(r.base[k])) || !Array.isArray(r.base.miniIds) || r.base.miniIds.length > 300 || !r.base.miniIds.every(x => typeof x === 'string' && x.length <= 180) || new Set(r.base.miniIds).size !== r.base.miniIds.length || !r.progress || Object.entries(r.progress).some(([key, n]) => !Object.hasOwn(metricNames, key) || !int(n, Math.max(8, q.goal[key] ?? 8))) || !Array.isArray(r.talked) || new Set(r.talked).size !== r.talked.length || r.talked.some(x => !residents.some(n => n.id === x)) || !Array.isArray(r.materials) || new Set(r.materials).size !== r.materials.length || r.materials.some(x => !materialNodes.some(n => n.id === x)))
            return false;
        if (r.claimed) {
            if (!Object.entries(q.goal).every(([k, n]) => (r.progress[k] ?? 0) >= n))
                return false;
            points += q.points;
            trust[q.resident] = (trust[q.resident] ?? 0) + 1;
        }
    }
    return (!v.progression || v.progression.stage <= availableStage(v)) && v.development === points && v.souvenirs.length === Object.values(v.quests).filter(q => q.claimed).length && v.souvenirs.every(id => v.quests[id]?.claimed) && Object.entries(v.residents).every(([id, r]) => r.trust === (trust[id] ?? 0));
}
catch {
    return false;
} }
export function questAvailable(v, id) { const q = questCatalog.find(q => q.id === id); if (!q)
    return false; if (v.progressiveLevel === undefined)
    return true; const ctx = { cafeLevel: v.progressiveLevel, progressive: true }; return unlocked(ctx, 'village') && (!q.mini || unlocked(ctx, q.mini)) && (id !== 'festival' || unlocked(ctx, 'festival')); }
