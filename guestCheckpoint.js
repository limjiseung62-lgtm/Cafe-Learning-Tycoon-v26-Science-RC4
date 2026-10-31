import { growthMenuDefinitions } from './menuResearch.js';
import { specializationById } from './specializationConfig.js';
import { customers } from './data.js';
import { specialDefinition, specialTypes } from './phase4Config.js';
import { hospitalityDefinition, helperCatalog } from './hospitalityConfig.js';
export function decodeGuestCheckpoint(value, g, level) {
    try {
        const items = value;
        const max = g.economy.cafes[level - 1].maxCustomers;
        const finite = (n, min = 0, max = 1e9) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
        if (!Array.isArray(items) || items.length > max || new Set(items.map(x => x.id)).size !== items.length || new Set(items.map(x => x.seat)).size !== items.length)
            return null;
        const result = [], reservationKeys = new Set();
        for (const item of items) {
            if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || !Number.isSafeInteger(item.seat) || item.seat < 0 || item.seat >= max || !['ENTERING', 'MOVING_TO_SEAT', 'ORDERING', 'WAITING_FOR_FOOD', 'PREPARING', 'SERVING', 'EATING', 'PAYING', 'LEAVING'].includes(item.state) || !['paid', 'abandoned', 'stockoutRecorded'].every(k => typeof item[k] === 'boolean') || !['elapsed', 'patienceRemaining', 'quotedRevenue', 'orderedAt', 'foodWaitTime', 'staffWaitTime'].every(k => finite(item[k])) || !Array.isArray(item.order) || item.order.length > 18 || item.order.some(o => !o || !Number.isSafeInteger(o.quantity) || o.quantity < 1 || o.quantity > 30 || !growthMenuDefinitions(level, g.mode === 'CAFE_GROWTH' ? g.management : undefined).some(m => m.menuId === o.menuId) && o.menuId !== 'event-signature'))
                return null;
            if (item.eventArrival?.reservationIndex !== undefined && (!Number.isInteger(item.eventArrival.reservationIndex) || item.eventArrival.reservationIndex < 0 || item.eventArrival.reservationIndex > 1))
                return null;
            if (item.eventArrival?.reservationIndex !== undefined) {
                const key = item.eventArrival.eventId + ':' + item.eventArrival.reservationIndex;
                if (reservationKeys.has(key))
                    return null;
                reservationKeys.add(key);
                const special = g.management?.run?.special;
                if (!special?.inventory || special.eventId !== item.eventArrival.eventId || !special.inventory.orders[item.eventArrival.reservationIndex])
                    return null;
                const consumed = special.inventory.consumed.includes(item.eventArrival.reservationIndex);
                if (consumed && ['ENTERING', 'MOVING_TO_SEAT', 'ORDERING', 'WAITING_FOR_FOOD'].includes(item.state) || !consumed && ['PREPARING', 'SERVING', 'EATING', 'PAYING'].includes(item.state))
                    return null;
            }
            if (item.miniReaction && (g.mode !== 'CAFE_GROWTH' || typeof item.miniReaction.success !== 'boolean' || !finite(item.miniReaction.until)))
                return null;
            let definition = customers.find(c => c.visualKey === item.definition?.visualKey);
            if (item.specialType && specialTypes.includes(item.specialType))
                definition = specialDefinition(item.specialType, g.phase4Profile);
            else if (item.signature)
                definition = hospitalityDefinition('judge');
            else if (item.helperType && helperCatalog.some(h => h.id === item.helperType))
                definition = hospitalityDefinition(item.helperType);
            if (!definition || definition.visualKey !== item.definition?.visualKey || !finite(item.definition.patienceSeconds, 1, 900) || item.eventArrival && (!Number.isSafeInteger(item.eventArrival.eventId) || item.eventArrival.eventId < 1))
                return null;
            if (item.specializationId && (!specializationById(item.specializationId) || g.mode !== 'CAFE_GROWTH' || g.specialization?.selected !== item.specializationId))
                return null;
            const guest = structuredClone(item);
            guest.definition = { ...definition, patienceSeconds: item.definition.patienceSeconds };
            if (guest.specializationId) {
                const s = specializationById(guest.specializationId);
                guest.definition = { ...guest.definition, name: s.guest, characterTrait: s.trait, orderPreference: item.definition.orderPreference };
            }
            if (guest.state === 'SERVING') {
                guest.state = 'PREPARING';
                guest.elapsed = 0;
            }
            result.push(guest);
        }
        return result;
    }
    catch {
        return null;
    }
}
