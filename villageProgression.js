import { unlocked } from './progressiveFeatures.js';
import { createLongGrowth, grantDecoration } from './longGrowth.js';
export const villageStages = [
    { stage: 1, name: '작은 마을', points: 0, sessions: 0, quests: 0, trust: 0, message: '이웃과 첫 인사를 나눠요.' },
    { stage: 2, name: '활기찬 광장', points: 25, sessions: 1, quests: 1, trust: 1, message: '광장이 새롭게 단장됐어요!' },
    { stage: 3, name: '장인의 마을', points: 75, sessions: 4, quests: 2, trust: 2, message: '공방이 확장됐어요!' },
    { stage: 4, name: '번화한 시장', points: 165, sessions: 9, quests: 4, trust: 4, message: '새로운 시장 가판대가 열렸어요!' },
    { stage: 5, name: '새로운 상권 발견', points: 275, sessions: 16, quests: 6, trust: 6, message: '새로운 상권으로 가는 길이 열렸어요!' }
];
export const villageMaterials = ['wood', 'petals', 'flour', 'ribbon'];
export const materialLabels = { wood: '공방 목재', petals: '꽃잎', flour: '축제 밀가루', ribbon: '기념 리본' };
export const festivalCatalog = [
    { id: 'flowers', name: '꽃 축제', stage: 2, kind: 'flowers', reward: 'garden', line: '한 송이씩 모아 광장을 꽃으로 채워요!' },
    { id: 'bread', name: '빵 축제', stage: 3, kind: 'oven', reward: 'bread', line: '갓 구운 빵을 이웃들과 나눠요!' },
    { id: 'dessert', name: '디저트 축제', stage: 4, kind: 'cake', reward: 'showcase', line: '함께 만든 케이크로 시장을 환하게 해요!' },
    { id: 'thanks', name: '마을 감사 축제', stage: 5, kind: 'tray', reward: 'star', line: '도와준 이웃에게 감사의 선물을 배달해요!' }
];
export const villageRecipes = [
    { id: 'garden-seat', name: '꽃잎 원형 테이블 제작', stage: 3, cost: { wood: 3, petals: 2 }, furniture: 'garden-round' },
    { id: 'bread-bench', name: '포근한 목재 벤치 제작', stage: 3, cost: { wood: 4, flour: 2 }, furniture: 'bakery-bench' },
    { id: 'salon-table', name: '대리석 디저트 테이블 제작', stage: 4, cost: { wood: 4, ribbon: 3 }, furniture: 'dessert-marble' },
    { id: 'village-frame', name: '마을 추억 액자 제작', stage: 3, cost: { wood: 2, ribbon: 1 }, decor: 'frame' }
];
export function beginVillageProgression(s) { const v = s.village; return v.progression ?? (v.progression = { version: 1, stage: 1, seenStage: 1, baselineIds: (s.growthEconomy?.receipts ?? []).map(r => r.id), sessions: [], inventory: { wood: 0, petals: 0, flour: 0, ribbon: 0 }, crafted: [], market: [], questMaterials: [...v.souvenirs], marketSouvenirs: [], festivals: {} }); }
export function progressionPoints(v) { const p = v.progression; return v.development + (p?.sessions.reduce((n, r) => n + 12 + Math.min(2, r.miniKinds.length) * 2 + (r.mission ? 2 : 0), 0) ?? 0) + Object.values(p?.festivals ?? {}).filter(f => f.status === 'complete').length * 8; }
export function availableStage(v) { const p = v.progression; if (!p)
    return 1; const trust = Object.values(v.residents).reduce((n, r) => n + r.trust, 0); return [...villageStages].reverse().find(d => progressionPoints(v) >= d.points && p.sessions.length >= d.sessions && v.souvenirs.length >= d.quests && trust >= d.trust).stage; }
/** Called only between businesses. Existing settlements are baselined, never retroactively rewarded. */
export function syncVillageProgression(s) {
    const v = s.village;
    const p = beginVillageProgression(s);
    for (const r of s.growthEconomy?.receipts ?? []) {
        if (!r.eligible || p.baselineIds.includes(r.id) || p.sessions.some(x => x.id === r.id) || p.sessions.length >= 1000)
            continue;
        const miniKinds = [...new Set((s.miniCollection?.receipts ?? []).filter(m => m.businessId === r.id && m.outcome === 'success').map(m => m.kind))];
        const mission = !!s.longTerm?.boards.find(b => b.businessId === r.id && b.complete && b.rewarded);
        p.sessions.push({ id: r.id, miniKinds, mission });
        p.inventory.wood += 2;
        p.inventory.petals++;
        p.inventory.flour++;
        p.inventory.ribbon += 1 + Number(mission);
        for (const kind of miniKinds) {
            if (kind === 'flowers')
                p.inventory.petals++;
            else if (kind === 'oven')
                p.inventory.flour++;
            else
                p.inventory.wood++;
        }
    }
    p.questMaterials ??= [...v.souvenirs];
    for (const id of v.souvenirs) {
        if (p.questMaterials.includes(id))
            continue;
        p.questMaterials.push(id);
        p.inventory.wood++;
        p.inventory.ribbon++;
    }
    p.stage = Math.max(p.stage, availableStage(v));
    if (p.stage >= 2 && v.position.x >= 14 && v.position.x <= 15 && v.position.y >= 8 && v.position.y <= 9)
        v.position = { x: 12, y: 10 };
    return p;
}
export function beginFestival(s, id) { if (!unlocked(s, 'festival'))
    return false; const p = s.village?.progression, f = festivalCatalog.find(f => f.id === id); if (!p || !f || p.stage < f.stage || p.festivals[id])
    return false; p.festivals[id] = { baseIds: (s.miniCollection?.receipts ?? []).map(r => r.id), baseCorrect: s.cumulativeQuestionsCorrect, status: 'preparing' }; return true; }
export function finishFestival(s, id) { const p = s.village?.progression, f = festivalCatalog.find(f => f.id === id), r = p?.festivals[id]; if (!p || !f || !r || r.status === 'complete' || s.cumulativeQuestionsCorrect - r.baseCorrect < 2)
    return false; const receipt = s.miniCollection?.receipts.find(m => m.kind === f.kind && m.outcome === 'success' && !r.baseIds.includes(m.id) && p.sessions.some(x => x.id === m.businessId)); if (!receipt)
    return false; r.status = 'complete'; r.receipt = receipt.id; p.inventory.ribbon += 2; grantDecoration(s.longTerm ?? (s.longTerm = createLongGrowth()), f.reward); p.stage = Math.max(p.stage, availableStage(s.village)); return true; }
export function craftVillage(s, id) { if (!unlocked(s, 'village'))
    return false; const p = s.village?.progression, r = villageRecipes.find(r => r.id === id); if (!p || !r || p.stage < r.stage || p.crafted.includes(id) || !Object.entries(r.cost).every(([k, n]) => p.inventory[k] >= n))
    return false; const long = s.longTerm ?? (s.longTerm = createLongGrowth()); if (r.furniture && long.furniture?.unlocks.some(u => u.id === r.furniture) || r.decor && long.owned.includes(r.decor))
    return false; for (const [k, n] of Object.entries(r.cost))
    p.inventory[k] -= n; p.crafted.push(id); if (r.decor)
    grantDecoration(long, r.decor); if (r.furniture) {
    long.furniture ??= { version: 1, unlocks: [] };
    long.furniture.unlocks.push({ id: r.furniture, source: 'event' });
} return true; }
/** One purchase per qualified session, separate from food inventory and money. */
export function useVillageMarket(s, material) { if (!unlocked(s, 'village'))
    return false; const p = s.village?.progression; if (!p || p.stage < 4 || !villageMaterials.includes(material) || p.inventory.ribbon < 1)
    return false; const token = p.sessions.find(r => !p.market.includes(r.id)); if (!token || material === 'ribbon')
    return false; p.market.push(token.id); p.inventory.ribbon--; p.inventory[material] += 2; return true; }
export function claimMarketSouvenir(s) { const p = s.village?.progression; if (!p || p.stage < 4 || p.inventory.ribbon < 3 || p.marketSouvenirs?.includes('market-stamp'))
    return false; p.inventory.ribbon -= 3; (p.marketSouvenirs ??= []).push('market-stamp'); return true; }
export function progressionMini(v) { const p = v?.progression; return festivalCatalog.find(f => p?.festivals[f.id]?.status === 'preparing')?.kind; }
export function validVillageProgression(value) { try {
    const p = value;
    const n = (x, max = 100000) => Number.isSafeInteger(x) && Number(x) >= 0 && Number(x) <= max;
    const ids = (a, max = 1000) => Array.isArray(a) && a.length <= max && new Set(a).size === a.length && a.every(x => typeof x === 'string' && x.length > 0 && x.length <= 180);
    return !!p && p.version === 1 && n(p.stage, 5) && p.stage >= 1 && n(p.seenStage, p.stage) && p.seenStage >= 1 && ids(p.baselineIds) && Array.isArray(p.sessions) && p.sessions.length <= 1000 && new Set(p.sessions.map(r => r.id)).size === p.sessions.length && p.sessions.every(r => ids([r.id]) && !p.baselineIds.includes(r.id) && typeof r.mission === 'boolean' && ids(r.miniKinds, 6) && r.miniKinds.every(k => ['cake', 'flowers', 'oven', 'tray', 'sort', 'machine'].includes(k))) && !!p.inventory && Object.keys(p.inventory).length === 4 && villageMaterials.every(k => n(p.inventory[k])) && ids(p.crafted, 4) && p.crafted.every(id => villageRecipes.some(r => r.id === id)) && ids(p.market) && p.market.every(id => p.sessions.some(r => r.id === id)) && (p.questMaterials === undefined || ids(p.questMaterials, 8)) && (p.marketSouvenirs === undefined || ids(p.marketSouvenirs, 1) && p.marketSouvenirs.every(id => id === 'market-stamp')) && !!p.festivals && Object.keys(p.festivals).length <= 4 && Object.entries(p.festivals).every(([id, r]) => festivalCatalog.some(f => f.id === id && p.stage >= f.stage) && n(r.baseCorrect) && ids(r.baseIds, 300) && ['preparing', 'complete'].includes(r.status) && (r.status === 'preparing' ? r.receipt === undefined : typeof r.receipt === 'string' && r.receipt.length <= 180));
}
catch {
    return false;
} }
