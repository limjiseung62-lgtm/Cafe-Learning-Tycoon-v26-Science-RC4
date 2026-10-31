import { furnitureCatalog } from './furnitureCatalog.js';
export function furnitureUnlocked(s, id) { return id.startsWith('classic-') || !!s?.furniture?.unlocks.some(r => r.id === id); }
/** Durable monotonic unlock receipts. No currency, stats or learning rewards. */
export function syncFurniture(c) {
    const { state, level, branch, events } = c, missions = state.boards.filter(b => b.complete && b.rewarded).length, visitors = Object.entries(state.visitors).filter(([, v]) => v.served), special = visitors.filter(([id]) => !id.startsWith('normal:')).length;
    const checks = {
        'garden-round': [level >= 3, 'level'],
        'bakery-bench': [level >= 5 || missions >= 1, level >= 5 ? 'level' : 'mission'],
        'garden-outdoor': [level >= 7 && (branch === 'garden' || missions >= 2), branch === 'garden' ? 'branch' : 'mission'],
        'bakery-workbench': [level >= 7 && (branch === 'bakery' || visitors.length >= 8), branch === 'bakery' ? 'branch' : 'collection'],
        'dessert-marble': [level >= 7 && (branch === 'dessert' || events >= 1), branch === 'dessert' ? 'branch' : 'event'],
        'dessert-sofa': [level >= 9 && (special >= 2 || missions >= 3 || events >= 2), special >= 2 ? 'collection' : missions >= 3 ? 'mission' : 'event']
    };
    const added = [];
    for (const d of furnitureCatalog) {
        if (d.theme === 'classic' || furnitureUnlocked(state, d.id))
            continue;
        const [yes, source] = checks[d.id];
        if (yes) {
            state.furniture ??= { version: 1, unlocks: [] };
            state.furniture.unlocks.push({ id: d.id, source });
            added.push(d.id);
        }
    }
    return added;
}
export function prepareFurniture(s) { const state = s.longTerm ?? (s.longTerm = { version: 1, owned: [], placed: {}, visitors: {}, titles: [], albums: [], boards: [] }); return syncFurniture({ state, level: s.cafeLevel, branch: s.growthBranch?.active, events: s.eventState?.records.filter(r => r.outcome === 'success').length ?? 0 }); }
