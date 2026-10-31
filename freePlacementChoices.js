import { allDecorationCatalog as decorationCatalog } from './longGrowthConfig.js';
import { validateFree } from './freeLayout.js';
import { freeParts, freeDecorBox, freeFixed, freeFloor, wallDecor, tableKinds } from './freeLayoutModel.js';
import { overlap } from './layoutModel.js';
/** Suggestions sample the whole floor; they never limit direct grid placement. */
export function* placementCandidates(plan, id) {
    const item = [...plan.tables, ...plan.decor].find(o => o.id === id);
    if (!item)
        return;
    const table = plan.tables.find(t => t.id === id), wall = !table && wallDecor(item.decorId);
    const others = [...plan.tables.filter(t => t.id !== id).flatMap(freeParts), ...plan.decor.filter(d => d.id !== id && wallDecor(d.decorId) === wall).map(freeDecorBox)];
    const points = [], edges = [], wallArea = plan.branch === 'bakery' ? { left: 16, right: 82, top: 24, bottom: 36 } : plan.branch === 'dessert' ? { left: 14, right: 84, top: 20, bottom: 34 } : { left: 14, right: 84, top: 20, bottom: 36 };
    for (let y = wall ? wallArea.top : 50; y <= (wall ? wallArea.bottom : 90); y += 2)
        for (let x = wall ? wallArea.left : 8; x <= (wall ? wallArea.right : 92); x += 2) {
            const moved = { ...item, x, y }, parts = table ? freeParts(moved) : [freeDecorBox(moved)];
            if (parts.some(r => !wall && (r.left < freeFloor.left || r.right > freeFloor.right || r.top < freeFloor.top || r.bottom > freeFloor.bottom || freeFixed(plan.branch).some(f => overlap(r, f))) || others.some(o => overlap(r, o))))
                continue;
            if (table && (x < Math.max(12, tableKinds[table.kind].artWidth / 2 + 4) || x > 100 - Math.max(12, tableKinds[table.kind].artWidth / 2 + 4)))
                edges.push({ x, y });
            else
                points.push({ x, y });
        }
    // Farthest-point order spreads the first choices across the available room.
    let last = { x: 50, y: 70 };
    const distances = points.map(() => Infinity);
    while (points.length) {
        let best = 0;
        for (let i = 0; i < points.length; i++) {
            distances[i] = Math.min(distances[i], Math.hypot(points[i].x - last.x, (points[i].y - last.y) * 2 / 3));
            if (distances[i] > distances[best])
                best = i;
        }
        last = points.splice(best, 1)[0];
        distances.splice(best, 1);
        yield last;
    }
    for (const point of edges)
        yield point;
}
export function placementIsValid(plan, id, point) { const next = structuredClone(plan), item = [...next.tables, ...next.decor].find(o => o.id === id); if (!item)
    return false; Object.assign(item, point); return validateFree(next).length === 0; }
/** Place missing owned decorations atomically; retain every existing object. */
export async function autoArrangeDecor(plan, ids, yieldWork = () => Promise.resolve()) {
    const next = structuredClone(plan), placed = [], unplaced = [];
    for (const decorId of [...new Set(ids)]) {
        if (!decorationCatalog.some(d => d.id === decorId)) {
            unplaced.push(decorId);
            continue;
        }
        if (next.decor.some(d => d.decorId === decorId))
            continue;
        const item = { id: 'decor-' + decorId, decorId, x: 20, y: wallDecor(decorId) ? 20 : 90, rotation: 0 };
        next.decor.push(item);
        let found = false, work = 0;
        for (const point of placementCandidates(next, item.id)) {
            if (placementIsValid(next, item.id, point)) {
                Object.assign(item, point);
                placed.push(decorId);
                found = true;
                break;
            }
            if (++work % 4 === 0)
                await yieldWork();
        }
        if (!found) {
            next.decor.pop();
            unplaced.push(decorId);
        }
        await yieldWork();
    }
    return { plan: next, placed, unplaced };
}
