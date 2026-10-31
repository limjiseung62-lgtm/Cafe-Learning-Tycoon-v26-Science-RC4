import { growthMenuDefinitions } from './menuResearch.js';
import { validFreeLayouts } from './freeLayout.js';
import { validLayouts } from './cafeLayout.js';
import { validRoster, captureRoster } from "./staffRecruitment.js";
import { recruitById } from "./recruitConfig.js";
import { decodeGuestCheckpoint } from './guestCheckpoint.js';
import { validEventCheckpoint } from './cafeEvents.js';
export const incompleteRunHistory = new WeakSet();
export function classroomCafeCheckpoint(g) { return { version: 1, ...g.freeLayouts && g.mode === 'CAFE_GROWTH' ? { freeLayouts: structuredClone(g.freeLayouts) } : {}, ...g.layouts && g.mode === 'CAFE_GROWTH' ? { layouts: structuredClone(g.layouts) } : {}, ...g.roster && g.mode === 'CAFE_GROWTH' ? { roster: captureRoster(g.roster, g.service.paid) } : {}, ...g.events.enabled ? { eventState: g.events.checkpoint(), guests: structuredClone(g.guests) } : {}, cafeLevel: g.cafeLevel, money: g.money, warehouseLevel: g.warehouseLevel, menus: g.menus.map(m => ({ id: m.menuId, level: m.currentLevel, stock: m.stock })), staff: g.service.paid.map(w => ({ ...g.roster ? { id: w.staffId } : {}, level: w.level })), stats: { ...g.stats }, production: g.successfulProduction, regularMemory: { ...g.regularMemory }, itemPurchases: { ...g.itemPurchases }, golden: g.goldenRemaining, booster: g.boosterRemaining, vip: g.vipPending, run: g.run ? { selected: [...g.run.selected], finalPaid: g.run.finalPaid, finalAssigned: incompleteRunHistory.has(g) ? null : g.run.finalAssigned, finalRewarded: g.run.finalRewarded, bonusRevenue: g.run.bonusRevenue } : null }; }
export function restoreClassroomCafe(g, value) { if (g.mode !== 'CLASS_MATCH')
    return false; return restoreCafeCheckpoint(g, value); }
export function restoreCafeCheckpoint(g, value) {
    try {
        const s = value;
        const int = (x, min = 0, max = 1e9) => Number.isSafeInteger(x) && Number(x) >= min && Number(x) <= max;
        if (!s || s.freeLayouts !== undefined && (g.mode !== 'CAFE_GROWTH' || !validFreeLayouts(s.freeLayouts)) || s.layouts !== undefined && (g.mode !== 'CAFE_GROWTH' || !validLayouts(s.layouts)) || s.roster !== undefined && (g.mode !== 'CAFE_GROWTH' || !validRoster(s.roster) || s.staff?.length !== s.roster.active.length || s.staff.some((w, i) => w.id !== s.roster.active[i] || w.level !== s.roster.owned.find(o => o.id === w.id)?.level)) || s.version !== 1 || s.eventState !== undefined && (!validEventCheckpoint(s.eventState) || s.eventState.duration !== g.durationSeconds) || !int(s.cafeLevel, 1, g.mode === 'CAFE_GROWTH' ? 15 : 6) || !int(s.warehouseLevel, 1, 6) || !int(s.money) || !Array.isArray(s.menus) || !Array.isArray(s.staff) || s.staff.length > g.economy.staff.limits[s.cafeLevel - 1] || !s.staff.every(w => int(w.level, 1, 5)) || !Object.values(s.stats).every(v => int(v)) || s.stats.correct > s.stats.attempted)
            return false;
        const definitions = growthMenuDefinitions(s.cafeLevel, g.mode === 'CAFE_GROWTH' ? g.management : undefined);
        if (s.menus.length !== definitions.length || new Set(s.menus.map(m => m.id)).size !== definitions.length || !definitions.every(d => s.menus.some(m => m.id === d.menuId && int(m.level, 1, 5) && int(m.stock, 0, 50))))
            return false;
        const restoredGuests = s.guests === undefined ? undefined : decodeGuestCheckpoint(s.guests, g, s.cafeLevel);
        if (restoredGuests === null)
            return false;
        g.freeLayouts = structuredClone(s.freeLayouts);
        g.layouts = structuredClone(s.layouts);
        g.roster = structuredClone(s.roster);
        g.cafeLevel = s.cafeLevel;
        g.warehouseLevel = s.warehouseLevel;
        g.money = s.money;
        g.menus = definitions.map(d => { const m = s.menus.find(m => m.id === d.menuId); return { ...d, currentLevel: m.level, stock: Math.min(m.stock, g.warehouse.capacity), maxStock: g.warehouse.capacity }; });
        for (const saved of s.staff) {
            const w = g.service.hire(g.roster && saved.id ? recruitById(saved.id) : undefined);
            if (!w)
                break;
            while (w.level < saved.level)
                g.service.upgrade(w, 0);
        }
        g.stats = { ...s.stats };
        g.successfulProduction = int(s.production) ? s.production : 0;
        if (s.regularMemory && int(s.regularMemory.satisfiedVisits, 0, 2) && typeof s.regularMemory.revisitEligible === 'boolean')
            g.regularMemory = { ...s.regularMemory };
        for (const key of Object.keys(g.itemPurchases))
            if (int(s.itemPurchases?.[key], 0, 100))
                g.itemPurchases[key] = s.itemPurchases[key];
        if (int(s.golden, 0, 5))
            g.goldenRemaining = s.golden;
        if (int(s.booster, 0, 3))
            g.boosterRemaining = s.booster;
        if (typeof s.vip === 'boolean')
            g.vipPending = s.vip;
        if (g.run && s.run && s.run.selected.length <= 4 && s.run.selected.every((id, i) => g.run.choices[i].includes(id))) {
            g.run.selected.push(...s.run.selected);
            g.run.finalPaid = int(s.run.finalPaid, 0, 3) ? s.run.finalPaid : 0;
            if (int(s.run.finalAssigned, 0, 3)) {
                g.run.finalAssigned = s.run.finalAssigned;
                incompleteRunHistory.delete(g);
            }
            else {
                g.run.finalAssigned = g.run.finalPaid;
                incompleteRunHistory.add(g);
            }
            g.run.finalRewarded = s.run.finalRewarded === true;
            g.run.bonusRevenue = int(s.run.bonusRevenue) ? s.run.bonusRevenue : 0;
        }
        if (s.eventState)
            g.events.restore(s.eventState);
        if (restoredGuests) {
            g.restoreSavedGuests(restoredGuests); /* Legacy checkpoints lack per-type telemetry. Restore only active-guest counters; historical totals are unknown. */
            for (const guest of restoredGuests)
                if (guest.specialType) {
                    const counters = g.telemetry.phase4.specialCustomerTypes;
                    counters[guest.specialType] ??= { spawned: 0, served: 0 };
                }
        }
        g.updateServiceLayout();
        return true;
    }
    catch {
        return false;
    }
}
