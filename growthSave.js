import { newProgressiveState, validProgressive } from './progressiveFeatures.js';
import { growthMenuDefinitions } from './menuResearch.js';
import { validManagement, validCafeAlbum } from './managementState.js';
import { validPortfolio, portfolioMatches } from './cafePortfolio.js';
import { validVillage } from './village.js';
import { validMiniCollection } from './miniGames.js';
import { validSpecialization } from './specialization.js';
import { belongsToBranch } from './specializationConfig.js';
import { furnitureUnlocked } from './furnitureUnlocks.js';
import { furnitureFor } from './furnitureCatalog.js';
import { validFreeLayouts } from './freeLayout.js';
import { validLayouts } from './cafeLayout.js';
import { validGrowthEconomy } from './growthEconomy.js';
import { validLongGrowth } from './longGrowth.js';
import { validCampaign } from './growthCampaign.js';
import { validEventCheckpoint } from './cafeEvents.js';
import { menuDefinitions } from './data.js';
import { staffDefinitions } from './staff.js';
import { cafeGrowthBalance } from './modeBalance.js';
import { specialTypes } from './phase4Config.js';
import { validBranch } from "./growthBranch.js";
import { validRoster, rosterMirror } from "./staffRecruitment.js";
const integer = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const object = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const date = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
export function validateGrowthSave(v) { if (!object(v) || v.v26 !== undefined && !validProgressive(v.v26) || v.management !== undefined && !validManagement(v.management) || v.managementAlbum !== undefined && !validCafeAlbum(v.managementAlbum) || v.portfolio !== undefined && (!validPortfolio(v.portfolio) || !portfolioMatches(v)) || v.village !== undefined && !validVillage(v.village) || v.miniCollection !== undefined && !validMiniCollection(v.miniCollection) || v.specialization !== undefined && (!validSpecialization(v.specialization) || Number(v.cafeLevel) < 11 || !belongsToBranch(v.specialization.selected, v.growthBranch?.active)) || v.freeLayouts !== undefined && !validFreeLayouts(v.freeLayouts) || v.layouts !== undefined && !validLayouts(v.layouts) || v.roster !== undefined && (!validRoster(v.roster) || !rosterMirror(v.roster, v.staffOwned, v.staffLevels)) || v.growthBranch !== undefined && (!validBranch(v.growthBranch) || Number(v.cafeLevel) < 7) || v.growthEconomy !== undefined && !validGrowthEconomy(v.growthEconomy) || v.longTerm !== undefined && !validLongGrowth(v.longTerm) || v.campaign !== undefined && !validCampaign(v.campaign) || v.eventState !== undefined && !validEventCheckpoint(v.eventState) || v.schemaVersion !== 1 || v.mode !== 'CAFE_GROWTH' || !date(v.createdAt) || !date(v.updatedAt) || Date.parse(v.createdAt) > Date.parse(v.updatedAt) || !integer(v.cafeLevel, 1, 15) || !integer(v.warehouseLevel, 1, 6) || !integer(v.money))
    return false; if (v.layouts && Object.values(v.layouts.plans).some(p => p.decor.some(d => !v.longTerm?.owned.includes(d.decorId))))
    return false; if (v.freeLayouts && Object.values(v.freeLayouts.plans).some(p => p.decor.some(d => !v.longTerm?.owned.includes(d.decorId)) || p.tables.some(t => !furnitureUnlocked(v.longTerm, furnitureFor(t.kind, t.furnitureId).id))))
    return false; const ids = growthMenuDefinitions(v.cafeLevel, v.management).map(m => m.menuId); if (v.management?.run?.special?.inventory?.orders.some(order => order.some(o => !ids.includes(o.menuId))))
    return false; if (!Array.isArray(v.unlockedMenuIds) || new Set(v.unlockedMenuIds).size !== ids.length || v.unlockedMenuIds.length !== ids.length || !ids.every(id => v.unlockedMenuIds instanceof Array && v.unlockedMenuIds.includes(id)))
    return false; if (!object(v.menuLevels) || Object.keys(v.menuLevels).length !== ids.length || !ids.every(id => object(v.menuLevels) && integer(v.menuLevels[id], 1, 5)))
    return false; if (!Array.isArray(v.staffOwned) || v.staffOwned.length > cafeGrowthBalance.staff.limits[v.cafeLevel - 1] || !v.staffOwned.every((id, i) => v.roster ? true : id === staffDefinitions[i]?.staffId) || !object(v.staffLevels) || Object.keys(v.staffLevels).length !== v.staffOwned.length || !v.staffOwned.every(id => object(v.staffLevels) && integer(v.staffLevels[id], 1, 5)))
    return false; for (const k of ['cumulativeRevenue', 'cumulativeCustomersServed', 'cumulativeFoodSold', 'cumulativeQuestionsAttempted', 'cumulativeQuestionsCorrect', 'completedSessions'])
    if (!integer(v[k]))
        return false; if (v.cumulativeQuestionsCorrect > v.cumulativeQuestionsAttempted)
    return false; const memory = v.regularMemory, t = v.specialCustomerStats; if (!object(memory) || !integer(memory.satisfiedVisits, 0, 2) || typeof memory.revisitEligible !== 'boolean' || !object(t) || !integer(t.spawned) || !integer(t.served) || Number(t.served) > Number(t.spawned) || !integer(t.vipVisits) || !integer(t.regularRevisits) || !integer(t.regularHighestTier, 0, 3) || !object(t.types))
    return false; for (const [k, count] of Object.entries(t.types)) {
    if (!specialTypes.includes(k) || !object(count) || !integer(count.spawned) || !integer(count.served) || Number(count.served) > Number(count.spawned))
        return false;
} const allowed = ['v26', 'management', 'managementAlbum', 'portfolio', 'village', 'miniCollection', 'specialization', 'freeLayouts', 'layouts', 'roster', 'growthBranch', 'growthEconomy', 'longTerm', 'campaign', 'eventState', 'schemaVersion', 'mode', 'createdAt', 'updatedAt', 'cafeLevel', 'money', 'warehouseLevel', 'unlockedMenuIds', 'menuLevels', 'staffOwned', 'staffLevels', 'cumulativeRevenue', 'cumulativeCustomersServed', 'cumulativeFoodSold', 'cumulativeQuestionsAttempted', 'cumulativeQuestionsCorrect', 'completedSessions', 'regularMemory', 'specialCustomerStats']; return Object.keys(v).every(k => allowed.includes(k)); }
export function createGrowthSave(now = new Date().toISOString()) { const initial = cafeGrowthBalance.initial; const ids = menuDefinitions.filter(m => m.unlockCafeLevel <= initial.cafeLevel).map(m => m.menuId); return { schemaVersion: 1, mode: 'CAFE_GROWTH', createdAt: now, updatedAt: now, ...initial, unlockedMenuIds: ids, menuLevels: Object.fromEntries(ids.map(id => [id, 1])), staffOwned: [], staffLevels: {}, cumulativeRevenue: 0, cumulativeCustomersServed: 0, cumulativeFoodSold: 0, cumulativeQuestionsAttempted: 0, cumulativeQuestionsCorrect: 0, completedSessions: 0, regularMemory: { satisfiedVisits: 0, revisitEligible: false }, specialCustomerStats: { spawned: 0, served: 0, types: {}, vipVisits: 0, regularRevisits: 0, regularHighestTier: 0 } }; }
export const saveMigrations = new Map();
export function migrateGrowthSave(value) { let v = value; for (let i = 0; i < 10 && object(v) && integer(v.schemaVersion) && Number(v.schemaVersion) < 1; i++) {
    const fn = saveMigrations.get(Number(v.schemaVersion));
    if (!fn)
        return null;
    v = fn(v);
} return validateGrowthSave(v) ? structuredClone(v) : null; }
export function createProgressiveGrowthSave(now = new Date().toISOString()) { const s = createGrowthSave(now); s.v26 = newProgressiveState(); return s; }
