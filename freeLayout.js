import { unlocked } from './progressiveFeatures.js';
import { furnitureFor } from './furnitureCatalog.js';
import { prepareFurniture, furnitureUnlocked } from './furnitureUnlocks.js';
import { freeConnected } from './freeNavigation.js';
import { createSpace } from './spatial.js';
import { defaultFreePlan, freeKey, seatBudget, tableKinds, freeParts, freeFloor, freeFixed, wallDecor, freeDecorBox, convertLegacy } from './freeLayoutModel.js';
import { overlap } from './layoutModel.js';
import { cafeGrowthBalance } from './modeBalance.js';
import { allDecorationCatalog as decorationCatalog } from './longGrowthConfig.js';
const memo = new Map();
export const freeDiagnostics = { checks: 0, paths: 0, hits: 0 };
export function basicFree(p) { try {
    const v = p, n = (n) => Number.isFinite(n) && n >= 0 && n <= 104, r = (n) => [0, 90, 180, 270].includes(n);
    return !!v && v.version === 2 && Number.isInteger(v.level) && v.level >= 1 && v.level <= 15 && [null, 'garden', 'bakery', 'dessert'].includes(v.branch) && (!v.branch || v.level >= 7) && Array.isArray(v.tables) && v.tables.length >= 1 && v.tables.length <= 7 && new Set(v.tables.map(t => t.id)).size === v.tables.length && v.tables.every(t => /^free-[1-9][0-9]?$/.test(t.id) && Object.hasOwn(tableKinds, t.kind) && !!furnitureFor(t.kind, t.furnitureId) && n(t.x) && n(t.y) && r(t.rotation)) && Array.isArray(v.decor) && v.decor.length <= decorationCatalog.length && new Set(v.decor.map(d => d.decorId)).size === v.decor.length && v.decor.every(d => d.id === 'decor-' + d.decorId && decorationCatalog.some(c => c.id === d.decorId) && n(d.x) && n(d.y) && r(d.rotation));
}
catch {
    return false;
} }
export function validateFree(p) {
    if (!basicFree(p))
        return [{ id: 'layout', message: '가구 정보를 확인해 주세요.', x: 50, y: 60 }];
    const key = JSON.stringify(p), cached = memo.get(key);
    if (cached) {
        freeDiagnostics.hits++;
        return structuredClone(cached);
    }
    freeDiagnostics.checks++;
    const issues = [], capacity = p.tables.reduce((n, t) => n + tableKinds[t.kind].seats, 0), budget = seatBudget(p.level), required = cafeGrowthBalance.cafes[p.level - 1].maxCustomers;
    if (capacity > budget || capacity < required)
        issues.push({ id: 'capacity', message: '이용 좌석 ' + required + '석 이상, 보유 ' + budget + '석 이내로 배치해 주세요.', x: 50, y: 60 });
    for (const kind of Object.keys(tableKinds))
        if (p.tables.filter(t => t.kind === kind).length > Math.floor(budget / tableKinds[kind].seats))
            issues.push({ id: 'inventory', message: '보유한 테이블 수를 확인해 주세요.', x: 50, y: 60 });
    const fixed = freeFixed(p.branch), inside = (r) => r.left >= freeFloor.left && r.right <= freeFloor.right && r.top >= freeFloor.top && r.bottom <= freeFloor.bottom;
    const objects = [...p.tables.map(t => ({ id: t.id, x: t.x, y: t.y, parts: freeParts(t), wall: false })), ...p.decor.map(d => ({ id: d.id, x: d.x, y: d.y, parts: [freeDecorBox(d)], wall: wallDecor(d.decorId) }))];
    for (const a of objects) {
        if (a.wall) {
            if (a.x < 6 || a.x > 94 || a.y < 8 || a.y > 36)
                issues.push({ ...a, message: '벽 장식은 위쪽 벽에 놓아요.' });
        }
        else if (a.parts.some(r => !inside(r) || fixed.some(f => overlap(r, f))))
            issues.push({ ...a, message: '바닥이나 고정 시설을 벗어났어요.' });
        for (const b of objects)
            if (a.id < b.id && a.wall === b.wall && a.parts.some(r => b.parts.some(s => overlap(r, s))))
                issues.push({ ...a, message: '테이블·의자·장식이 겹쳐요.' });
    }
    if (!issues.length) {
        const s = createSpace(p.level, true, p.branch ?? undefined, undefined, p), points = [s.exit, ...s.pickupSlots, ...s.staffWaitingPoints, ...s.seats.map(s => s.approach)], connected = freeConnected(s, points);
        for (let i = 0; i < points.length; i++) {
            freeDiagnostics.paths++;
            if (!connected[i])
                issues.push({ id: 'path', message: '손님이나 직원이 좌석까지 갈 수 없어요.', ...points[i] });
        }
    }
    if (memo.size >= 256)
        memo.delete(memo.keys().next().value);
    memo.set(key, structuredClone(issues));
    return issues;
}
export function validFreeLayouts(v) { try {
    const s = v;
    return !!s && s.version === 1 && !!s.plans && typeof s.plans === 'object' && !Array.isArray(s.plans) && Object.keys(s.plans).length <= 60 && Object.entries(s.plans).every(([k, p]) => k === freeKey(p.level, p.branch) && basicFree(p) && !validateFree(p).length) && Array.isArray(s.archives) && s.archives.length <= 60 && s.archives.every(a => typeof a.key === 'string' && a.key.length < 40 && typeof a.reason === 'string' && a.reason.length < 300 && JSON.stringify(a.original).length < 1000000);
}
catch {
    return false;
} }
export function freePlanFor(s) { const key = freeKey(s.cafeLevel, s.growthBranch?.active), current = s.freeLayouts?.plans[key]; if (current)
    return { plan: structuredClone(current), reason: 'saved' }; const legacy = s.layouts?.plans[key]; if (legacy) {
    const p = convertLegacy(legacy);
    if (!validateFree(p).length)
        return { plan: p, reason: 'converted' };
    return { plan: defaultFreePlan(s.cafeLevel, s.growthBranch?.active ?? null), reason: 'fallback' };
} return { plan: defaultFreePlan(s.cafeLevel, s.growthBranch?.active ?? null), reason: 'default' }; }
export function commitFree(s, p) { if (!unlocked(s, 'decor'))
    return false; if (s.campaign?.run && !s.campaign.run.closed || p.level !== s.cafeLevel || p.branch !== (s.growthBranch?.active ?? null) || validateFree(p).length || p.decor.some(d => !s.longTerm?.owned.includes(d.decorId)))
    return false; const staged = structuredClone(s); prepareFurniture(staged); if (p.tables.some(t => !furnitureUnlocked(staged.longTerm, furnitureFor(t.kind, t.furnitureId).id)))
    return false; if (staged.longTerm?.furniture) {
    s.longTerm ??= staged.longTerm;
    s.longTerm.furniture = staged.longTerm.furniture;
} s.freeLayouts ??= { version: 1, plans: {}, archives: [] }; const key = freeKey(p.level, p.branch), old = s.layouts?.plans[key]; if (old && !s.freeLayouts.archives.some(a => a.key === key))
    s.freeLayouts.archives.push({ key, reason: freePlanFor(s).reason === 'fallback' ? '기존 배치를 백업하고 새 기본 배치 적용' : '기존 좌표를 새 가구 좌표로 변환', original: structuredClone(old) }); s.freeLayouts.plans[key] = structuredClone(p); return true; }
export function freePreset(level, branch, style) { const p = defaultFreePlan(level, branch); if (style === 1) {
    let left = seatBudget(level);
    const kinds = [];
    if (left >= 6) {
        kinds.push('long');
        left -= 6;
    }
    while (left >= 4) {
        kinds.push('four');
        left -= 4;
    }
    while (left >= 2) {
        kinds.push('two');
        left -= 2;
    }
    const centers = [[30, 62], [66, 60], [64, 84], [28, 82], [48, 70]];
    p.tables = kinds.map((kind, i) => ({ id: 'free-' + (i + 1), kind, x: centers[i][0], y: centers[i][1], rotation: i === 1 ? 90 : 0 }));
} if (style === 2) {
    const centers = [[18, 55], [48, 55], [78, 55], [18, 83], [48, 83], [78, 83], [48, 69]];
    p.tables = p.tables.map((t, i) => ({ ...t, x: centers[i][0], y: centers[i][1], rotation: 90 }));
} return validateFree(p).length ? defaultFreePlan(level, branch) : p; }
