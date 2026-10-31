import { turn } from './freeLayoutModel.js';
/** One plate per occupied chair; never reuse the two-seat parity offset on a six-seat set. */
export function freeMealAnchor(space, seat) {
    const t = space.tables.find(t => t.tableId === seat.tableId), siblings = space.seats.filter(s => s.tableId === seat.tableId), index = siblings.findIndex(s => s.seatId === seat.seatId), half = siblings.length / 2;
    const along = (index % half - (half - 1) / 2) * (t.tableKind === 'long' ? 3.8 : 3.4), side = index < half ? -1 : 1, offset = turn(along, side * .9, t.rotation ?? 0), lifts = { 'garden-round': 9, 'garden-outdoor': 11, 'bakery-bench': 9, 'bakery-workbench': 11, 'dessert-marble': 10, 'dessert-sofa': 8 };
    const lift = lifts[t.furnitureId ?? ''] ?? (t.tableKind === 'long' ? 10 : t.tableKind === 'four' ? 9 : 8);
    return { x: t.x + offset.x, y: t.y + offset.y * 1.5 - ((t.rotation ?? 0) % 180 === 90 ? Math.min(9, lift) : lift) };
}
