export const reservedTeamTarget = (s, working) => s.kind === 'birthday' || s.kind === 'festival' ? (s.prepared && s.ownerAssist !== undefined ? s.ownerAssist : working === 0) ? 1 : 2 : 1;
function generator(key) { let value = 2166136261; for (const c of key)
    value = Math.imul(value ^ c.charCodeAt(0), 16777619) >>> 0; return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 2 ** 32); }
/** Draw once from the existing order generator; UI and real guests consume the same saved order. */
export function ensureSpecialInventory(g) { const s = g.mode === 'CAFE_GROWTH' ? g.management?.run?.special : undefined; if (!s)
    return; if (s.inventory)
    return s.inventory; if (s.prepared !== false || s.eventId)
    return; const random = generator(g.management.run.id + '|' + s.kind + '|' + g.cafeLevel + '|' + g.menus.map(m => m.menuId).join(',')), orders = [], totals = new Map(); const count = s.kind === 'vip' ? 0 : s.kind === 'birthday' || s.kind === 'festival' ? 2 : 1; for (let i = 0; i < count; i++) {
    let accepted;
    for (let attempt = 0; attempt < 512; attempt++) {
        const order = g.createReservedOrder(random);
        if (order.length && order.every(o => o.quantity <= 2 && (totals.get(o.menuId) ?? 0) + o.quantity <= (g.menus.find(m => m.menuId === o.menuId)?.maxStock ?? 0))) {
            accepted = order;
            break;
        }
    }
    if (!accepted)
        return;
    orders.push(accepted);
    for (const o of accepted)
        totals.set(o.menuId, (totals.get(o.menuId) ?? 0) + o.quantity);
} return s.inventory = { version: 1, orders, consumed: [] }; }
export function specialPreparation(g) { const s = g.mode === 'CAFE_GROWTH' ? g.management?.run?.special : undefined; if (!s)
    return null; const inventory = ensureSpecialInventory(g); if (!inventory)
    return null; const target = reservedTeamTarget(s, g.service.paid.length), totals = new Map(); for (const [i, order] of inventory.orders.entries())
    if (i < target && !inventory.consumed.includes(i))
        for (const o of order)
            totals.set(o.menuId, (totals.get(o.menuId) ?? 0) + o.quantity); const lines = [...totals].map(([menuId, required]) => { const menu = g.menus.find(m => m.menuId === menuId), current = menu?.stock ?? 0; return { menuId, name: menu?.name ?? menuId, required, current, missing: Math.max(0, required - current) }; }); return { target, lines, stockReady: lines.every(x => x.missing === 0), learningReady: g.stats.correct >= 2, ready: g.status === 'RUNNING' && g.stats.correct >= 2 && lines.every(x => x.missing === 0), vip: s.kind === 'vip' }; }
export function reservationIndex(g, guest) { const s = g.mode === 'CAFE_GROWTH' ? g.management?.run?.special : undefined, i = guest.eventArrival?.reservationIndex; return s?.inventory && s.eventId === guest.eventArrival?.eventId && i !== undefined && i >= 0 && i < reservedTeamTarget(s, g.service.paid.length) && s.inventory.orders[i] ? i : undefined; }
export function reservedGuestOrder(g, guest) { const i = reservationIndex(g, guest); return i === undefined ? undefined : structuredClone(g.management.run.special.inventory.orders[i]); }
export function takeReservedFood(g, guest) { const i = reservationIndex(g, guest), inv = g.management?.run?.special?.inventory; if (i !== undefined && inv && !inv.consumed.includes(i))
    inv.consumed.push(i); }
/** No second inventory: protect pending units in the existing stock until its normal preparation debit. */
export function protectedSpecialStock(g, menuId) { const s = g.mode === 'CAFE_GROWTH' ? g.management?.run?.special : undefined; if (!s?.inventory || s.complete || ['failed', 'cancelled'].includes(g.events.records.find(r => r.id === s.eventId)?.outcome ?? ''))
    return 0; return s.inventory.orders.slice(0, reservedTeamTarget(s, g.service.paid.length)).reduce((n, order, i) => n + (s.inventory.consumed.includes(i) ? 0 : order.filter(o => o.menuId === menuId).reduce((v, o) => v + o.quantity, 0)), 0); }
export function validSpecialInventory(v) { const x = v; return !!x && x.version === 1 && Array.isArray(x.orders) && x.orders.length <= 2 && x.orders.every(order => Array.isArray(order) && order.length > 0 && order.length <= 18 && new Set(order.map(o => o.menuId)).size === order.length && order.every(o => o && typeof o.menuId === 'string' && o.menuId.length > 0 && o.menuId.length <= 100 && Number.isSafeInteger(o.quantity) && o.quantity > 0 && o.quantity <= 30)) && Array.isArray(x.consumed) && new Set(x.consumed).size === x.consumed.length && x.consumed.every(i => Number.isSafeInteger(i) && i >= 0 && i < x.orders.length); }
