import { allDecorationCatalog as decorationCatalog } from './longGrowthConfig.js';
export const layoutKey = (level, branch) => (branch ?? 'base') + ':' + level;
export const overlap = (a, b) => a.left < b.right - .01 && a.right > b.left + .01 && a.top < b.bottom - .01 && a.bottom > b.top + .01;
export const tableRect = (t) => ({ left: t.x - 7.2 * t.scale, right: t.x + 7.2 * t.scale, top: t.y - 18.5 * t.scale, bottom: t.y + .6 });
export function decorPlane(d) { return decorationCatalog.find(c => c.id === d.decorId)?.slot === 'wall' ? 'wall' : d.y <= 32 ? 'ledge' : 'floor'; }
export function decorRect(d) { const width = d.decorId === 'showcase' ? 10 : d.decorId === 'bread' ? 8 : 6, height = d.decorId === 'showcase' ? 8 : 6; return { left: d.x - width / 2, right: d.x + width / 2, top: d.y - height, bottom: d.y }; }
export function layoutFacilities(space) {
    const branch = space.branch, minY = !branch && space.level >= 11 ? 8 : 25;
    const fixed = branch === 'garden' ? [{ left: 9, right: 27, top: 27, bottom: 35, name: '화단' }, { left: 93, right: 98, top: 70, bottom: 79, name: '테라스 난간' }] : branch === 'bakery' ? [{ left: 8, right: 31, top: 28, bottom: 36, name: '고정 오븐' }, { left: 40, right: 72, top: 28, bottom: 35, name: '빵 쇼케이스' }, { left: 7, right: 9, top: 65, bottom: 77, name: '작업대' }] : branch === 'dessert' ? [{ left: 44, right: 80, top: 27, bottom: 35, name: '디저트 쇼케이스' }, { left: 89, right: 96, top: 63, bottom: 79, name: '살롱 장식 벽' }] : [];
    const points = [{ ...space.entrance, name: '입구' }, ...space.pickupSlots.map(p => ({ ...p, name: '음식 픽업' })), ...space.staffWaitingPoints.map(p => ({ ...p, name: '직원 복귀' }))];
    const reserved = points.map(p => ({ left: p.x - .7, right: p.x + .7, top: p.y - .7, bottom: p.y + .7, name: p.name }));
    reserved.push({ left: Math.min(...space.pickupSlots.map(p => p.x)) - 2, right: Math.max(...space.pickupSlots.map(p => p.x)) + 2, top: space.pickup.y - 1, bottom: space.pickup.y + 1, name: '카운터 픽업 통로' });
    if (!branch && space.level >= 11)
        reserved.push({ left: 86, right: 96, top: 34, bottom: 63, name: '계단 통로' });
    const links = branch === 'garden' ? [{ x: 91, y: 65, name: '테라스 연결' }] : !branch && space.level >= 11 ? [{ x: 94, y: 33, name: '위층 계단' }, { x: 88, y: 64, name: '아래층 계단' }] : [];
    for (const p of links)
        reserved.push({ left: p.x - 1, right: p.x + 1, top: p.y - 1, bottom: p.y + 1, name: p.name });
    return { fixed, reserved, links, bounds: { left: 7, right: 94, top: minY, bottom: 90 } };
}
export function applyPlan(space, plan) {
    for (const t of space.tables) {
        const move = plan.tables.find(p => p.id === t.tableId);
        if (!move)
            continue;
        const old = { x: t.x, y: t.y }, sign = move.rotation === 180 ? -1 : 1, point = (p) => ({ x: sign === 1 ? p.x + (move.x - old.x) : move.x - (p.x - old.x), y: p.y + (move.y - old.y) });
        t.servicePoints = t.servicePoints.map(point);
        for (const seat of space.seats.filter(s => s.tableId === t.tableId)) {
            const p = point(seat);
            Object.assign(seat, p);
            seat.servicePoint = point(seat.servicePoint);
            seat.approach = { ...seat.servicePoint };
            seat.standPoint = point(seat.standPoint);
            if (sign < 0)
                seat.facing = seat.facing === 'left' ? 'right' : 'left';
        }
        t.x = move.x;
        t.y = move.y;
        t.rotation = move.rotation;
    }
    const facilities = layoutFacilities(space);
    space.extraObstacles = [...facilities.fixed, ...plan.decor.filter(d => decorPlane(d) === 'floor').map(decorRect)];
    space.floorBounds = facilities.bounds;
    space.layoutDecor = structuredClone(plan.decor);
}
