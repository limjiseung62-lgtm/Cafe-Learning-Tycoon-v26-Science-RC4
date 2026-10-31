import { furnitureChairSize, furnitureSeatLift } from './furnitureCatalog.js';
import { allDecorationCatalog as decorationCatalog } from './longGrowthConfig.js';
export const tableKinds = { two: { name: '2인 테이블', seats: 2, w: 8, h: 5, artWidth: 16, row: 0 }, four: { name: '4인 테이블', seats: 4, w: 12, h: 6, artWidth: 20, row: 1 }, long: { name: '긴 단체 테이블', seats: 6, w: 19, h: 6, artWidth: 26, row: 2 } };
export const freeKey = (level, branch) => (branch ?? 'base') + ':' + level;
export const seatBudget = (level) => [4, 6, 6, 8, 8, 10, 12, 12, 14, 14, 14, 14, 14, 14, 14][level - 1];
export const freeFloor = { left: 4, right: 96, top: 42, bottom: 96 };
export function freeFixed(branch) { return branch === 'dessert' ? [{ left: 78, right: 96, top: 42, bottom: 49, name: '살롱 출입 계단' }] : branch === 'garden' ? [{ left: 4, right: 8, top: 42, bottom: 49, name: '화단 가장자리' }] : [{ left: 4, right: 9, top: 42, bottom: 49, name: '오븐 옆 벽' }]; }
export function turn(x, y, rotation) { const a = rotation * Math.PI / 180; return { x: Math.round((x * Math.cos(a) - y * Math.sin(a)) * 1e6) / 1e6, y: Math.round((x * Math.sin(a) + y * Math.cos(a)) * 1e6) / 1e6 }; }
export function freeBody(t) { const kind = tableKinds[t.kind ?? t.tableKind ?? 'two'], vertical = (t.rotation ?? 0) % 180 !== 0, w = vertical ? kind.h : kind.w, h = (vertical ? kind.w : kind.h) * 1.5; return { left: t.x - w / 2, right: t.x + w / 2, top: t.y - h / 2, bottom: t.y + h / 2 }; }
export function chairOffsets(t) { const k = tableKinds[t.kind], count = k.seats / 2, result = []; for (let side = 0; side < 2; side++)
    for (let i = 0; i < count; i++) {
        const p = turn((i - (count - 1) / 2) * (t.kind === 'long' ? 5.5 : 5), side ? k.h / 2 + 2.7 : -k.h / 2 - 2.7, t.rotation);
        result.push({ x: t.x + p.x, y: t.y + p.y * 1.5, rotation: ((t.rotation + (side ? 90 : 270)) % 360) });
    } return result; }
export function freeParts(t) { const c = furnitureChairSize(t.furnitureId); return [freeBody(t), ...chairOffsets(t).map(p => ({ left: p.x - c.w / 2, right: p.x + c.w / 2, top: p.y - c.h / 2, bottom: p.y + c.h / 2 }))]; }
export function freeDecorBox(d) { const w = d.decorId === 'showcase' ? 8 : d.decorId === 'bread' ? 5 : 4, h = d.decorId === 'showcase' ? 5 : 3; return { left: d.x - w / 2, right: d.x + w / 2, top: d.y - h, bottom: d.y }; }
export const wallDecor = (id) => decorationCatalog.find(d => d.id === id)?.slot === 'wall';
export function defaultFreePlan(level, branch = null) { const n = seatBudget(level) / 2, centers = [[20, 57], [44, 57], [68, 57], [20, 82], [44, 82], [68, 82], [86, 70]]; return { version: 2, level, branch, tables: centers.slice(0, n).map(([x, y], i) => ({ id: 'free-' + (i + 1), kind: 'two', x, y, rotation: 0 })), decor: [] }; }
export function convertLegacy(p) { return { version: 2, level: p.level, branch: p.branch, tables: p.tables.map((t, i) => ({ id: 'free-' + (i + 1), kind: 'two', x: Math.round(t.x / 2) * 2, y: Math.round((t.y - 4) / 2) * 2, rotation: t.rotation })), decor: p.decor.map(d => ({ ...d, y: wallDecor(d.decorId) ? d.y : Math.max(46, d.y), rotation: d.rotation })) }; }
export function createFreeSpace(level, branch, p, worldScale) {
    const tables = p.tables.map(t => ({ ...t, tableId: t.id, tableKind: t.kind, scale: 1, servicePoints: [] }));
    const seats = [];
    for (const t of p.tables) {
        const k = tableKinds[t.kind], chairs = chairOffsets(t), chairSize = furnitureChairSize(t.furnitureId), approachGap = 2.7 + Math.max(chairSize.w / 2, chairSize.h / 3) + 1.4;
        for (let i = 0; i < chairs.length; i++) {
            const c = chairs[i], side = i < k.seats / 2 ? -1 : 1, approachOffset = turn((i % (k.seats / 2) - (k.seats / 2 - 1) / 2) * (t.kind === 'long' ? 5.5 : 5), side * (k.h / 2 + approachGap), t.rotation), service = { x: t.x + approachOffset.x, y: t.y + approachOffset.y * 1.5 };
            const seat = { seatId: t.id + '-seat-' + i, tableId: t.id, x: c.x, y: c.y - furnitureSeatLift(t.furnitureId), occupiedBy: null, cafeLevel: level, scale: .88, facing: c.x < t.x ? 'right' : c.x > t.x ? 'left' : c.rotation === 0 || c.rotation === 90 ? 'right' : 'left', chairRotation: c.rotation, rear: c.y < t.y, servicePoint: { x: service.x, y: service.y }, approach: { x: service.x, y: service.y }, standPoint: { x: c.x, y: c.y }, entryPath: [] };
            seats.push(seat);
            tables.find(x => x.tableId === t.id).servicePoints.push(seat.servicePoint);
        }
    }
    const pickups = [18, 28, 38, 48, 58, 68].map(x => ({ x, y: 43 })), homes = [];
    const boxes = [...p.tables.flatMap(freeParts), ...freeFixed(branch ?? null), ...p.decor.filter(d => !wallDecor(d.decorId)).map(freeDecorBox)], candidates = [...Array.from({ length: 15 }, (_, i) => ({ x: 6 + i * 6, y: 97 })), ...Array.from({ length: 15 }, (_, i) => ({ x: 6 + i * 6, y: 44 })), ...Array.from({ length: 8 }, (_, i) => ({ x: 6, y: 52 + i * 6 })), ...Array.from({ length: 8 }, (_, i) => ({ x: 94, y: 52 + i * 6 }))];
    for (const c of candidates) {
        if (homes.length === 6)
            break;
        if (boxes.some(r => c.x > r.left - 1 && c.x < r.right + 1 && c.y > r.top - 1 && c.y < r.bottom + 1))
            continue;
        const distance = (a) => Math.hypot(a.x - c.x, (a.y - c.y) * 2 / 3);
        if ([...seats.map(s => s.servicePoint), ...pickups, ...homes].some(p => distance(p) < 6))
            continue;
        homes.push(c);
    }
    while (homes.length < 6)
        homes.push({ x: 6 + homes.length * 16, y: 98 });
    return { level, branch, grown: true, freeModel: true, worldScale, entrance: { x: 97, y: 55 }, exit: { x: 103, y: 55 }, pickup: { x: 56, y: 43 }, pickupSlots: pickups, staffWaitingPoints: homes, staffAccessPoints: homes, intermediateWaypoints: [], tables, seats, extraObstacles: [...p.tables.flatMap(t => freeParts(t).slice(1)), ...freeFixed(branch ?? null), ...p.decor.filter(d => !wallDecor(d.decorId)).map(freeDecorBox)], floorBounds: freeFloor, layoutDecor: p.decor };
}
