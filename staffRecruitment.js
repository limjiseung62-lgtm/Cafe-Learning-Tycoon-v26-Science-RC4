import { unlocked } from './progressiveFeatures.js';
import { recruitCatalog, recruitById, recruitConfig } from './recruitConfig.js';
export function rosterFor(s) { return structuredClone(s.roster ?? { version: 2, cafeId: 'cafe-' + hash(s.createdAt), owned: s.staffOwned.map(id => ({ id, level: s.staffLevels[id] })), active: [...s.staffOwned], windows: [], receipts: [], collections: { visitors: Object.keys(s.longTerm?.visitors ?? {}) }, titles: [], settlements: [] }); }
export function hash(s) { let n = 2166136261; for (const c of s)
    n = Math.imul(n ^ c.charCodeAt(0), 16777619); n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); return (n ^ (n >>> 16)) >>> 0; }
export function rosterMirror(r, ids, levels) { return Array.isArray(ids) && ids.length === r.active.length && ids.every((id, i) => id === r.active[i]) && !!levels && typeof levels === 'object' && ids.every(id => levels[id] === r.owned.find(o => o.id === id)?.level); }
export function captureRoster(r, workers) { const copy = structuredClone(r); for (const w of workers) {
    const owned = copy.owned.find(o => o.id === w.staffId);
    if (owned)
        owned.level = Math.max(owned.level, w.level);
} return copy; }
export const latestWindow = (s) => s.growthEconomy?.receipts.filter(r => r.eligible).at(-1)?.id ?? 'first';
export const canManageCrew = (s) => !s.campaign?.run || s.campaign.run.closed;
export function candidateWeights(s, r = rosterFor(s)) { const fav = s.growthBranch?.selected === 'garden' ? ['staff-3', 'staff-6', 'staff-11'] : s.growthBranch?.selected === 'bakery' ? ['staff-2', 'staff-5', 'staff-10'] : s.growthBranch?.selected === 'dessert' ? ['staff-4', 'staff-9', 'staff-12'] : []; return recruitCatalog.filter(d => !r.owned.some(o => o.id === d.staffId) && !(s.portfolio?.inactive?.save.roster?.owned.map(o => o.id) ?? s.portfolio?.inactive?.save.staffOwned ?? []).includes(d.staffId)).map(d => ({ id: d.staffId, weight: (d.grade === '일반' ? 10 : d.grade === '숙련' ? 7.5 : 5) * (s.cafeLevel < 7 ? (d.grade === '일반' ? 1.1 : d.grade === '특별' ? .8 : 1) : s.cafeLevel >= 11 ? (d.grade === '일반' ? .9 : d.grade === '특별' ? 1.2 : 1) : 1) * (fav.includes(d.staffId) ? 1.1 : 1) })); }
export function openRecruitment(s) { if (!unlocked(s, 'recruitment'))
    return false; if (!canManageCrew(s))
    return false; const r = s.roster ??= rosterFor(s), window = latestWindow(s); if (r.offer && !r.offer.closed)
    return true; if (r.offer?.window === window)
    return false; if (r.windows.includes(window) || r.owned.length >= 12)
    return false; if (!candidateWeights(s, r).length)
    return false; let n = hash(r.cafeId + ':' + window + ':' + recruitConfig.version); const random = () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 2 ** 32); const pool = candidateWeights(s, r), ids = []; while (pool.length && ids.length < 3) {
    let roll = random() * pool.reduce((a, b) => a + b.weight, 0), i = 0;
    while (i < pool.length - 1 && (roll -= pool[i].weight) > 0)
        i++;
    ids.push(pool.splice(i, 1)[0].id);
} r.offer = { window, ids, closed: false }; r.windows.push(window); return true; }
export function recruitCost(s) { return recruitConfig.prices[(s.roster?.owned.length ?? s.staffOwned.length)] ?? null; }
export function syncRosterSave(s) { if (!s.roster)
    return; s.staffOwned = [...s.roster.active]; s.staffLevels = Object.fromEntries(s.roster.active.map(id => [id, s.roster.owned.find(o => o.id === id).level])); }
export function hireCandidate(s, id) { const r = s.roster, cost = recruitCost(s); if (!canManageCrew(s) || !r?.offer || r.offer.closed || !r.windows.includes(r.offer.window) || !r.offer.ids.includes(id) || !recruitById(id) || (s.portfolio?.inactive?.save.roster?.owned.map(o => o.id) ?? s.portfolio?.inactive?.save.staffOwned ?? []).includes(id) || r.owned.some(o => o.id === id) || cost === null || s.money < cost)
    return false; const receipt = r.cafeId + ':' + r.offer.window; if (r.receipts.some(e => e.id === receipt))
    return false; s.money -= cost; r.owned.push({ id, level: 1 }); if (r.active.length < Math.min(5, [1, 2, 2, 3, 4, 5][Math.min(s.cafeLevel, 6) - 1]))
    r.active.push(id); r.receipts.push({ id: receipt, staffId: id, cost }); r.offer.closed = true; syncRosterSave(s); return true; }
export function assignCrew(s, ids) { const r = s.roster; if (!canManageCrew(s) || !r || new Set(ids).size !== ids.length || ids.length > Math.min(5, [1, 2, 2, 3, 4, 5][Math.min(s.cafeLevel, 6) - 1]) || ids.some(id => !r.owned.some(o => o.id === id)))
    return false; r.active = [...ids]; syncRosterSave(s); return true; }
export function validRoster(v) { try {
    const r = v, integer = (n) => Number.isSafeInteger(n) && n >= 0;
    if (!r || r.version !== 2 || typeof r.cafeId !== 'string' || (!r.cafeId.length || r.cafeId.length > 100) || !Array.isArray(r.owned) || r.owned.length > 12 || new Set(r.owned.map(o => o.id)).size !== r.owned.length || r.owned.some(o => !recruitById(o.id) || !integer(o.level) || o.level < 1 || o.level > 5) || !Array.isArray(r.active) || r.active.length > 5 || new Set(r.active).size !== r.active.length || r.active.some(id => !r.owned.some(o => o.id === id)))
        return false;
    if (!Array.isArray(r.windows) || r.windows.length > 2000 || !r.windows.every(s => typeof s === 'string' && s.length <= 128) || new Set(r.windows).size !== r.windows.length || !Array.isArray(r.receipts) || r.receipts.length > 12 || new Set(r.receipts.map(e => e.id)).size !== r.receipts.length || r.receipts.some(e => typeof e.id !== 'string' || !recruitById(e.staffId) || !integer(e.cost)))
        return false;
    if (r.offer && (!r.windows.includes(r.offer.window) || typeof r.offer.closed !== 'boolean' || !Array.isArray(r.offer.ids) || r.offer.ids.length > 3 || new Set(r.offer.ids).size !== r.offer.ids.length || r.offer.ids.some(id => !recruitById(id)) || !r.offer.closed && r.offer.ids.some(id => r.owned.some(o => o.id === id))))
        return false;
    return !!r.collections && !Array.isArray(r.collections) && Object.keys(r.collections).every(k => ['visitors', 'staff-6', 'staff-11', 'staff-12'].includes(k)) && Object.values(r.collections).every(a => Array.isArray(a) && a.length <= 2000 && new Set(a).size === a.length && a.every(s => typeof s === 'string' && s.length <= 400)) && Array.isArray(r.titles) && r.titles.length <= 100 && new Set(r.titles).size === r.titles.length && r.titles.every(s => typeof s === 'string' && s.length <= 100) && Array.isArray(r.settlements) && r.settlements.length <= 1000 && new Set(r.settlements.map(e => e.id)).size === r.settlements.length && r.settlements.every(e => typeof e.id === 'string' && integer(e.total) && e.total <= 1500 && e.earned && Object.entries(e.earned).every(([id, n]) => !!recruitById(id) && integer(n)));
}
catch {
    return false;
} }
/** Read-only explanation of existing recruitment gates; does not consume an offer. */
export function recruitmentStatus(s) { const roster = s.roster ?? rosterFor(s), cost = recruitCost(s); if (!canManageCrew(s))
    return { canPost: false, reason: '영업 중에는 채용할 수 없어요. 영업 종료 후 직원 구인·근무 편성에서 공고를 내세요.', cost }; if (roster.offer && !roster.offer.closed)
    return { canPost: false, reason: '지원자가 도착했어요. 아래 후보를 비교해 한 명을 채용하거나 이번 공고를 포기해요.', cost }; if (roster.owned.length >= 12)
    return { canPost: false, reason: '직원 12명을 모두 보유하고 있어요. 근무와 대기를 교대해 보세요.', cost }; if (!candidateWeights(s, roster).length)
    return { canPost: false, reason: '지금 지원할 새 직원이 없어요. 다른 카페에 소속된 직원은 카페 선택 화면에서 이동할 수 있어요.', cost }; if (roster.windows.includes(latestWindow(s)))
    return { canPost: false, reason: '이번 공고 기회를 사용했어요. 다음 15분 영업을 끝까지 마치고, 서로 다른 문제 8개 이상·정답 5개 이상을 채우면 새 공고가 열려요.', cost }; return { canPost: true, reason: '지금 무료 공고를 낼 수 있어요. 돈은 공고가 아니라 직원을 최종 채용할 때만 사용해요.', cost }; }
