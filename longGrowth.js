import { specializationCatalog } from './specializationConfig.js';
import { validFurnitureUnlocks } from './furnitureCatalog.js';
import { allBoardCatalog as boardCatalog, allDecorationCatalog as decorationCatalog, decorSlots } from './longGrowthConfig.js';
import { customers } from './data.js';
import { specialTypes, specialDefinition } from './phase4Config.js';
import { helperCatalog, hospitalityDefinition } from './hospitalityConfig.js';
export const createLongGrowth = () => ({ version: 1, owned: [], placed: {}, visitors: {}, titles: [], albums: [], boards: [] });
export const visitorCatalog = [...customers.map(c => ({ id: 'normal:' + c.visualKey, name: c.name, visual: c.visualKey, line: c.characterTrait })), ...specialTypes.map(t => { const c = specialDefinition(t); return { id: 'special:' + t, name: c.name, visual: c.visualKey, line: c.characterTrait }; }), ...helperCatalog.map(h => ({ id: 'helper:' + h.id, name: h.name, visual: hospitalityDefinition(h.id).visualKey, line: h.line })), { id: 'judge', name: '특별 주문 심사위원', visual: hospitalityDefinition('judge').visualKey, line: '오늘의 특별한 한 접시를 기다릴게요.' }];
export const allVisitorCatalog = [...visitorCatalog, ...specializationCatalog.map(s => ({ id: 'specialization:' + s.id, name: s.guest, visual: s.visual, line: s.line }))];
const int = (n) => Number.isSafeInteger(n) && Number(n) >= 0;
export function validLongGrowth(value) { try {
    const v = value;
    return !!v && (v.furniture === undefined || validFurnitureUnlocks(v.furniture)) && v.version === 1 && Array.isArray(v.owned) && new Set(v.owned).size === v.owned.length && v.owned.every(id => decorationCatalog.some(d => d.id === id)) && !!v.placed && Object.entries(v.placed).every(([slot, id]) => decorSlots.some(s => s.id === slot && decorationCatalog.some(d => d.id === id && d.slot === s.type)) && v.owned.includes(id)) && new Set(Object.values(v.placed)).size === Object.values(v.placed).length && !!v.visitors && Object.entries(v.visitors).every(([id, r]) => allVisitorCatalog.some(c => c.id === id) && typeof r.firstVisit === 'string' && Number.isFinite(Date.parse(r.firstVisit)) && typeof r.served === 'boolean' && typeof r.line === 'string' && r.line.length <= 500 && typeof r.rewarded === 'boolean') && Array.isArray(v.titles) && v.titles.length <= 100 && v.titles.every(t => typeof t === 'string' && t.length <= 100) && Array.isArray(v.albums) && v.albums.every(n => int(n) && n >= 1 && n <= 15) && Array.isArray(v.boards) && v.boards.length <= 100 && new Set(v.boards.map(b => b.businessId)).size === v.boards.length && v.boards.every(b => typeof b.businessId === 'string' && b.businessId.length <= 128 && Array.isArray(b.offered) && ['servedIds', 'specialIds'].every(k => b[k] === undefined || Array.isArray(b[k]) && b[k].length <= 2000 && b[k].every(int)) && (b.soldMenus === undefined || Array.isArray(b.soldMenus) && b.soldMenus.length <= 30 && b.soldMenus.every(id => typeof id === 'string')) && (b.upstairs === undefined || int(b.upstairs)) && b.offered.length === 3 && new Set(b.offered).size === 3 && b.offered.every(id => boardCatalog.some(c => c.id === id)) && (b.selected === null || b.offered.includes(b.selected)) && int(b.target) && b.target >= 1 && b.target <= 50 && ['complete', 'rewarded', 'closed'].every(k => typeof b[k] === 'boolean') && (!b.rewarded || b.complete));
}
catch {
    return false;
} }
export function offerBoard(state, businessId, level, packSkills, hasReview, specialization) { let board = state.boards.find(b => b.businessId === businessId); if (board)
    return board; let seed = [...businessId].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7); const roll = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; const recent = state.boards.slice(-3).map(b => b.selected); const pool = boardCatalog.filter(m => m.unlock <= level && (!m.id.startsWith('spec-') || m.id === 'spec-' + specialization) && (m.id !== 'review' || hasReview) && (m.id !== 'skills' || packSkills >= 2)); const choose = (items) => { const fresh = items.filter(m => !recent.includes(m.id)); const list = fresh.length ? fresh : items; return list[Math.floor(roll() * list.length)]; }; const learn = choose(pool.filter(m => (m.kind === 'learning' || m.kind === 'review') && !m.id.startsWith('spec-'))), operate = choose(pool.filter(m => m.kind === 'operations')); const remaining = pool.filter(m => m.id !== learn.id && m.id !== operate.id), otherKinds = remaining.filter(m => m.kind !== learn.kind && m.kind !== operate.kind); const third = specialization ? pool.find(m => m.id === 'spec-' + specialization) ?? choose(otherKinds.length ? otherKinds : remaining) : choose(otherKinds.length ? otherKinds : remaining); board = { businessId, skillCount: packSkills, offered: [learn.id, operate.id, third.id], selected: null, target: 1, complete: false, rewarded: false, closed: false }; state.boards.push(board); state.boards = state.boards.slice(-100); return board; }
export function selectBoard(state, businessId, id, level, accuracy) { const b = state.boards.find(b => b.businessId === businessId), m = boardCatalog.find(m => m.id === id); if (!b || !m || b.selected || b.closed || !b.offered.includes(id))
    return false; b.selected = id; const multiplier = accuracy < .65 ? .75 : accuracy > .9 ? 1.25 : 1; b.target = Math.max(1, Math.round(m.base * multiplier + (m.metric === 'served' ? Math.min(3, Math.floor(level / 4)) : 0))); if (m.metric === 'skills')
    b.target = Math.min(b.target, b.skillCount ?? 3); return true; }
export function grantDecoration(state, id) { if (!decorationCatalog.some(d => d.id === id))
    return false; if (!state.owned.includes(id))
    state.owned.push(id); return true; }
export function placeDecoration(state, slot, id) { if (id === null) {
    delete state.placed[slot];
    return true;
} const d = decorationCatalog.find(d => d.id === id), s = decorSlots.find(s => s.id === slot); if (!s || !d || s.type !== d.slot || !state.owned.includes(id))
    return false; for (const key of Object.keys(state.placed))
    if (state.placed[key] === id)
        delete state.placed[key]; state.placed[slot] = id; return true; }
export function guestCollectionId(g) { return g.specializationId ? 'specialization:' + g.specializationId : g.signature ? 'judge' : g.helperType ? 'helper:' + g.helperType : g.specialType ? 'special:' + g.specialType : 'normal:' + g.definition.visualKey; }
export function observeVisitors(state, game, now = new Date().toISOString()) { const discoveries = []; for (const guest of game.guests) {
    const id = guestCollectionId(guest), c = allVisitorCatalog.find(c => c.id === id);
    if (!c)
        continue;
    let entry = state.visitors[id];
    if (!entry) {
        entry = state.visitors[id] = { firstVisit: now, served: false, line: c.line, rewarded: false };
        if (!id.startsWith('normal:'))
            discoveries.push(c.name);
    }
    if (guest.eventArrival)
        entry.eventSeen = true;
    if (guest.servedAt !== undefined)
        entry.served = true;
    if (entry.served && !entry.rewarded) {
        entry.rewarded = true;
        grantDecoration(state, id.startsWith('normal:') ? 'frame' : id === 'helper:florist' ? 'garden' : 'star');
    }
} return discoveries; }
export function pollBoard(state, businessId, metrics, closed = false) { const b = state.boards.find(b => b.businessId === businessId), m = boardCatalog.find(m => m.id === b?.selected); if (!b || !m || b.closed)
    return false; if (!b.complete && (metrics[m.metric] ?? 0) >= b.target)
    b.complete = true; let rewarded = false; if (b.complete && !b.rewarded) {
    b.rewarded = true;
    grantDecoration(state, m.reward);
    const title = '따뜻한 사장님 · ' + m.name;
    if (!state.titles.includes(title))
        state.titles.push(title);
    rewarded = true;
} if (closed)
    b.closed = true; return rewarded; }
export function settleSpecializationCollection(state, s) { if (!s.collections.includes('souvenir'))
    return false; const id = 'spec-' + s.selected, title = specializationCatalog.find(c => c.id === s.selected).name + '의 친구'; let changed = false; if (!state.owned.includes(id)) {
    grantDecoration(state, id);
    changed = true;
} if (!state.titles.includes(title)) {
    state.titles.push(title);
    changed = true;
} return changed; }
