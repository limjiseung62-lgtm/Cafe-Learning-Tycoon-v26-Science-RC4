import { createManagement } from './managementState.js';
import { growthMenuDefinitions } from './menuResearch.js';
import { desiredLakeMini } from './lakeDistrict.js';
import { recruitById } from "./recruitConfig.js";
import { CafeGame } from './game.js';
import { policyFor } from './sessionModes.js';
import { createGrowthSave, validateGrowthSave } from './growthSave.js';
const growthExpected = new WeakMap();
export const setGrowthExpected = (g, s) => growthExpected.set(g, structuredClone(s));
export const growthExpectedFor = (g) => growthExpected.get(g);
const growthBases = new WeakMap();
export function growthBaseFor(game) { return growthBases.get(game); }
export function createProgressiveClassMatch(random = Math.random) { return new CafeGame(900, random, 300, { mode: 'CLASS_MATCH', progressive: true }); }
export function createClassMatch(seconds = policyFor().sessionSeconds, random = Math.random) { return new CafeGame(seconds, random, 300, { mode: 'CLASS_MATCH', phase4: true }); }
export function createGrowthSession(save = createGrowthSave(), random = Math.random, seconds = save.eventState && !save.eventState.closed ? Math.max(1, save.eventState.duration - save.eventState.now) : policyFor('CAFE_GROWTH').sessionSeconds) { if (!validateGrowthSave(save))
    throw Error('Invalid growth save'); const g = new CafeGame(seconds, random, 300, { mode: 'CAFE_GROWTH', phase4: true, progressive: !!save.v26 }); g.progressiveState = structuredClone(save.v26); g.management = structuredClone(save.management); if (save.v26 && save.cafeLevel >= 8) {
    g.management ??= createManagement();
    g.management.strategy ??= 'care';
} if (g.management && save.v26)
    g.management.progressiveLevel = save.cafeLevel; g.growthCafeId = save.portfolio?.activeCafeId ?? 'cafe-1'; g.lakeMini = desiredLakeMini(save); g.village = structuredClone(save.village); if (g.village && save.v26)
    g.village.progressiveLevel = save.cafeLevel; g.miniCollection = structuredClone(save.miniCollection); g.specialization = structuredClone(save.specialization); g.freeLayouts = structuredClone(save.freeLayouts); g.layouts = structuredClone(save.layouts); g.roster = structuredClone(save.roster); g.cafeLevel = save.cafeLevel; g.growthBranch = structuredClone(save.growthBranch); g.money = save.money; g.warehouseLevel = save.warehouseLevel; g.menus = growthMenuDefinitions(save.cafeLevel, save.management).filter(m => save.unlockedMenuIds.includes(m.menuId)).map(m => ({ ...m, currentLevel: save.menuLevels[m.menuId], stock: Math.min(g.warehouse.capacity, save.v26?.stock?.[m.menuId] ?? 0), maxStock: g.warehouse.capacity })); for (const id of save.staffOwned) {
    const w = g.service.hire(save.roster ? recruitById(id) : undefined);
    if (w.staffId !== id)
        throw Error('Invalid staff order');
    while (w.level < save.staffLevels[id])
        g.service.upgrade(w, 0);
    w.upgradeFeedbackUntil = 0;
} g.regularMemory = structuredClone(save.regularMemory); g.updateServiceLayout(); g.telemetry.snapshots = []; g.telemetry.record(g.snapshot); if (save.eventState)
    g.events.restore(save.eventState); growthBases.set(g, structuredClone(save)); return g; }
