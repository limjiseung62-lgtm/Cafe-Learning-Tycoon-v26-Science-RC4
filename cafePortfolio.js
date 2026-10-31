import { lakeEconomyConfig } from './lakeDistrictConfig.js';
import { createGrowthSave, validateGrowthSave } from './growthSave.js';
import { rosterFor, syncRosterSave } from './staffRecruitment.js';
import { createLongGrowth } from './longGrowth.js';
import { createDistrict, validDistrict } from './lakeDistrict.js';
export const cafeNames = { 'cafe-1': '1호점 · 마을 카페', 'cafe-2': '2호점 · 호숫가 카페' };
export const canSwitchCafe = (s) => !s.campaign?.run || s.campaign.run.closed;
export function ensurePortfolio(s) { return s.portfolio ?? (s.portfolio = { version: 1, activeCafeId: 'cafe-1', district: createDistrict(), furnitureUnlocks: [], decorUnlocks: [] }); }
export function syncSharedFurniture(s) { const p = s.portfolio; if (!p)
    return; for (const id of s.longTerm?.furniture?.unlocks.map(u => u.id) ?? [])
    if (!p.furnitureUnlocks.includes(id))
        p.furnitureUnlocks.push(id); for (const id of s.longTerm?.owned ?? [])
    if (!p.decorUnlocks.includes(id))
        p.decorUnlocks.push(id); if (!p.furnitureUnlocks.length && !p.decorUnlocks.length)
    return; const long = s.longTerm ?? (s.longTerm = createLongGrowth()); long.furniture ??= { version: 1, unlocks: [] }; for (const id of p.furnitureUnlocks)
    if (!long.furniture.unlocks.some(u => u.id === id))
        long.furniture.unlocks.push({ id, source: 'legacy' }); for (const id of p.decorUnlocks)
    if (!long.owned.includes(id))
        long.owned.push(id); }
export function archiveCafe(s) { const copy = structuredClone(s); delete copy.portfolio; delete copy.managementAlbum; delete copy.village; delete copy.miniCollection; delete copy.eventState; delete copy.campaign; copy.cumulativeQuestionsAttempted = 0; copy.cumulativeQuestionsCorrect = 0; return copy; }
export function switchCafe(s, id) {
    if (s.v26)
        return false;
    const p = s.portfolio;
    if (!p || id === p.activeCafeId || p.inactive?.id !== id || !canSwitchCafe(s))
        return false;
    syncSharedFurniture(s);
    const current = archiveCafe(s), target = structuredClone(p.inactive.save), old = p.activeCafeId;
    const shared = { managementAlbum: structuredClone(s.managementAlbum), village: structuredClone(s.village), miniCollection: structuredClone(s.miniCollection), cumulativeQuestionsAttempted: s.cumulativeQuestionsAttempted, cumulativeQuestionsCorrect: s.cumulativeQuestionsCorrect, campaign: s.campaign ? { version: 1, studies: structuredClone(s.campaign.studies), history: structuredClone(s.campaign.history ?? []) } : undefined };
    for (const k of Object.keys(s))
        delete s[k];
    Object.assign(s, target, shared, { portfolio: p, updatedAt: new Date().toISOString() });
    p.activeCafeId = id;
    p.inactive = { id: old, save: current };
    for (const [key, value] of Object.entries(s))
        if (value === undefined)
            delete s[key];
    syncSharedFurniture(s);
    return true;
}
export function foundSecondCafe(s, now = new Date().toISOString()) { if (s.v26)
    return false; const p = s.portfolio; if (!p || p.founded || p.inactive || p.activeCafeId !== 'cafe-1' || !canSwitchCafe(s) || s.village?.progression?.stage !== 5 || !['site', 'guide', 'orders'].every(id => p.district.quests[id]?.claimed))
    return false; syncSharedFurniture(s); const second = createGrowthSave(now); second.money = lakeEconomyConfig.initialCapital; second.roster = rosterFor(second); second.roster.cafeId = 'lakeside-' + now; second.longTerm = createLongGrowth(); p.inactive = { id: 'cafe-2', save: second }; p.founded = { cost: lakeEconomyConfig.foundingCost, funding: lakeEconomyConfig.funding, at: now }; p.district.opened = true; syncSharedFurniture(s); return true; }
/** Transfer is free between sessions; hiring/upgrade history remains with its original cafe. */
export function transferStaff(s, id) { if (s.v26)
    return false; const p = s.portfolio; if (!p?.inactive || !canSwitchCafe(s))
    return false; const from = s.roster ?? (s.roster = rosterFor(s)), target = p.inactive.save, to = target.roster ?? (target.roster = rosterFor(target)); const owned = from.owned.find(o => o.id === id); if (!owned || to.owned.some(o => o.id === id) || to.owned.length >= 12)
    return false; from.owned = from.owned.filter(o => o.id !== id); from.active = from.active.filter(x => x !== id); to.owned.push({ ...owned }); if (from.offer)
    from.offer.closed = true; if (to.offer)
    to.offer.closed = true; syncRosterSave(s); syncRosterSave(target); return true; }
export function portfolioCafes(s) { return [{ id: s.portfolio?.activeCafeId ?? 'cafe-1', save: s }, ...s.portfolio?.inactive ? [s.portfolio.inactive] : []].sort((a, b) => a.id.localeCompare(b.id)); }
export function validPortfolio(value) { try {
    const p = value;
    if (!p || p.version !== 1 || !['cafe-1', 'cafe-2'].includes(p.activeCafeId) || !validDistrict(p.district) || !Array.isArray(p.furnitureUnlocks) || !Array.isArray(p.decorUnlocks) || new Set(p.furnitureUnlocks).size !== p.furnitureUnlocks.length || new Set(p.decorUnlocks).size !== p.decorUnlocks.length || p.furnitureUnlocks.length > 40 || p.decorUnlocks.length > 100 || [...p.furnitureUnlocks, ...p.decorUnlocks].some(x => typeof x !== 'string' || x.length > 100))
        return false;
    if (!p.inactive)
        return p.activeCafeId === 'cafe-1' && !p.founded && !p.district.opened;
    const a = p.inactive;
    if (a.id === p.activeCafeId || !['cafe-1', 'cafe-2'].includes(a.id) || a.save?.portfolio || a.save?.village || a.save?.campaign || a.save?.miniCollection || !validateGrowthSave(a.save) || !p.founded || p.founded.cost !== 0 || p.founded.funding !== 'community' || typeof p.founded.at !== 'string' || p.founded.at.length > 40 || !Number.isFinite(Date.parse(p.founded.at)) || !p.district.opened)
        return false;
    return true;
}
catch {
    return false;
} }
export function portfolioMatches(s) { try {
    const p = s.portfolio;
    if (!p)
        return true;
    const knownFurniture = s.longTerm?.furniture?.unlocks.map(u => u.id) ?? [];
    if (p.furnitureUnlocks.some(id => !knownFurniture.includes(id)) || p.decorUnlocks.some(id => !s.longTerm?.owned.includes(id)))
        return false;
    const others = p.inactive?.save.roster?.owned.map(o => o.id) ?? p.inactive?.save.staffOwned ?? [];
    if ((s.roster?.owned.map(o => o.id) ?? s.staffOwned).some(id => others.includes(id)))
        return false;
    if (p.district.region === 'lake' && s.village?.progression?.stage !== 5)
        return false;
    return !p.founded || s.village?.progression?.stage === 5 && ['site', 'guide', 'orders'].every(id => p.district.quests[id]?.claimed);
}
catch {
    return false;
} }
