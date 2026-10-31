import { createSpace, floorPath } from './spatial.js';
import { applyPlan, layoutKey, layoutFacilities, tableRect, decorRect, decorPlane, overlap } from './layoutModel.js';
import { allDecorationCatalog as decorationCatalog, decorSlots } from './longGrowthConfig.js';
import { isBranch } from './growthBranch.js';
const memo = new Map();
export const layoutDiagnostics = { validations: 0, cacheHits: 0, pathChecks: 0 };
export function basicPlan(p) { try {
    const v = p, coord = (n) => Number.isFinite(n) && n >= 0 && n <= 104, rotation = (n) => n === 0 || n === 180;
    return !!v && v.version === 1 && Number.isInteger(v.level) && v.level >= 1 && v.level <= 15 && (v.branch === null || isBranch(v.branch) && v.level >= 7) && Array.isArray(v.tables) && v.tables.length >= 2 && v.tables.length <= 7 && new Set(v.tables.map(t => t.id)).size === v.tables.length && v.tables.every(t => /^table-[1-7]$/.test(t.id) && coord(t.x) && coord(t.y) && rotation(t.rotation)) && Array.isArray(v.decor) && v.decor.length <= 8 && new Set(v.decor.map(d => d.id)).size === v.decor.length && new Set(v.decor.map(d => d.decorId)).size === v.decor.length && v.decor.every(d => d.id === 'decor-' + d.decorId && decorationCatalog.some(c => c.id === d.decorId) && coord(d.x) && coord(d.y) && rotation(d.rotation));
}
catch {
    return false;
} }
export function defaultPlan(space, save) { return { version: 1, level: space.level, branch: space.branch ?? null, tables: space.tables.map(t => ({ id: t.tableId, x: t.x, y: t.y, rotation: 0 })), decor: Object.entries(save?.longTerm?.placed ?? {}).flatMap(([slot, decorId]) => { const s = decorSlots.find(s => s.id === slot); return s ? [{ id: 'decor-' + decorId, decorId, x: s.x, y: s.y, rotation: 0 }] : []; }) }; }
export function planFor(save) { const branch = save.growthBranch?.active ?? undefined, space = createSpace(save.cafeLevel, true, branch); return structuredClone(save.layouts?.plans[layoutKey(save.cafeLevel, branch)] ?? defaultPlan(space, save)); }
export function validatePlan(plan) {
    if (!basicPlan(plan))
        return [{ id: 'layout', message: '배치 정보가 올바르지 않아요.', x: 50, y: 50 }];
    const key = JSON.stringify(plan), cached = memo.get(key);
    if (cached) {
        layoutDiagnostics.cacheHits++;
        return structuredClone(cached);
    }
    layoutDiagnostics.validations++;
    const space = createSpace(plan.level, true, plan.branch ?? undefined), issues = [];
    if (plan.tables.length !== space.tables.length || space.tables.some(t => !plan.tables.some(p => p.id === t.tableId)))
        return [{ id: 'tables', message: '테이블 수와 번호를 유지해 주세요.', x: 50, y: 50 }];
    applyPlan(space, plan);
    const f = layoutFacilities(space), inside = (r) => r.left >= f.bounds.left && r.right <= f.bounds.right && r.top >= f.bounds.top && r.bottom <= f.bounds.bottom;
    const items = [...space.tables.map(t => ({ id: t.tableId, x: t.x, y: t.y, box: tableRect(t), plane: 'floor' })), ...plan.decor.map(d => ({ ...d, box: decorRect(d), plane: decorPlane(d) }))];
    for (const item of items) {
        if (item.plane === 'floor') {
            if (!inside(item.box))
                issues.push({ ...item, message: '벽 밖이나 사용하지 않는 공간에는 놓을 수 없어요.' });
            const block = [...f.fixed, ...f.reserved].find(r => overlap(item.box, r));
            if (block)
                issues.push({ ...item, message: block.name + ' 주변은 비워 주세요.' });
        }
        else if (item.x < 7 || item.x > 94 || item.y < (item.plane === 'wall' ? 8 : 26) || item.y > (item.plane === 'wall' ? 25 : 32))
            issues.push({ ...item, message: item.plane === 'wall' ? '벽 장식은 위쪽 벽에 놓아요.' : '진열대 또는 바닥을 골라 주세요.' });
        for (const other of items) {
            if (item.id >= other.id || item.plane !== other.plane)
                continue;
            if (overlap(item.box, other.box))
                issues.push({ ...item, message: '다른 가구와 겹쳐요.' });
        }
    }
    if (!issues.length) {
        for (const seat of space.seats) {
            const checks = [[space.entrance, seat.approach], [seat.approach, space.exit], ...space.pickupSlots.map(p => [p, seat.servicePoint]), ...space.staffWaitingPoints.map(p => [seat.servicePoint, p])];
            for (const [from, to] of checks) {
                try {
                    layoutDiagnostics.pathChecks++;
                    floorPath(space, from, to);
                }
                catch {
                    issues.push({ id: seat.tableId, message: '손님 또는 직원의 통로가 막혔어요.', x: seat.x, y: seat.y });
                    break;
                }
            }
        }
        for (const p of f.links)
            try {
                layoutDiagnostics.pathChecks++;
                floorPath(space, space.entrance, p);
                floorPath(space, p, space.pickup);
            }
            catch {
                issues.push({ id: 'link', message: p.name + ' 통로를 열어 주세요.', x: p.x, y: p.y });
            }
    }
    if (memo.size >= 128)
        memo.delete(memo.keys().next().value);
    memo.set(key, structuredClone(issues));
    return issues;
}
export function validLayouts(value) { try {
    const v = value;
    return !!v && v.version === 1 && !!v.plans && !Array.isArray(v.plans) && Object.keys(v.plans).length <= 60 && Object.entries(v.plans).every(([key, p]) => basicPlan(p) && key === layoutKey(p.level, p.branch) && validatePlan(p).length === 0);
}
catch {
    return false;
} }
export function commitPlan(save, plan) { if (save.campaign?.run && !save.campaign.run.closed || plan.level !== save.cafeLevel || plan.branch !== (save.growthBranch?.active ?? null) || validatePlan(plan).length || plan.decor.some(d => !save.longTerm?.owned.includes(d.decorId)))
    return false; save.layouts ??= { version: 1, plans: {} }; save.layouts.plans[layoutKey(plan.level, plan.branch)] = structuredClone(plan); return true; }
export function plannedSpace(save) { const p = planFor(save); return createSpace(p.level, true, p.branch ?? undefined, p); }
