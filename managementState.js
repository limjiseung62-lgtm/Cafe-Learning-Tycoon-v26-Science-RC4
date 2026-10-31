import { validSpecialInventory } from './specialInventory.js';
export const createManagement = () => ({ version: 1, strategy: null, reputation: 50, reviews: [], regulars: {}, materials: { fruit: 2, milk: 2, flour: 2, flower: 1 }, research: {}, training: {}, deliveries: [], businessHistory: [] });
export function managementFor(save) { return save.management ?? (save.management = createManagement()); }
export function addCafeMemory(list, entry) { if (list.length >= 300 || list.some(x => x.id === entry.id))
    return false; list.push(entry); return true; }
const str = (v, max = 200) => typeof v === 'string' && v.length > 0 && v.length <= max;
const int = (n, max = 1e8) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max;
const strings = (v, max = 1000) => Array.isArray(v) && v.length <= max && v.every(x => str(x, 400)) && new Set(v).size === v.length;
export function validManagement(v) { try {
    const m = v;
    if (!m || m.version !== 1 || m.strategy !== null && !['fast', 'care', 'group'].includes(m.strategy) || !Number.isFinite(m.reputation) || m.reputation < 0 || m.reputation > 100 || !Array.isArray(m.reviews) || m.reviews.length > 32 || new Set(m.reviews.map(x => x.id)).size !== m.reviews.length || m.reviews.some(x => !str(x.id) || !str(x.guest) || !int(x.stars, 5) || x.stars < 1 || !str(x.text) || !str(x.reason)))
        return false;
    if (!m.regulars || Object.keys(m.regulars).length > 100 || Object.entries(m.regulars).some(([k, r]) => !str(k) || !int(r.visits) || typeof r.loyal !== 'boolean' || typeof r.giftClaimed !== 'boolean'))
        return false;
    if (!m.materials || Object.keys(m.materials).sort().join(',') !== 'flour,flower,fruit,milk' || Object.values(m.materials).some(n => !int(n, 999)))
        return false;
    if (!m.research || Object.keys(m.research).length > 6 || Object.entries(m.research).some(([id, r]) => !/^research-(fruit|latte|cookie|cake|bread|dessert)$/.test(id) || !['selected', 'combined', 'prototype', 'tasted', 'registered'].includes(r.stage) || !Array.isArray(r.ingredients) || r.ingredients.length > 3 || r.ingredients.some(x => !['fruit', 'milk', 'flour', 'flower'].includes(x)) || !int(r.rating, 5) || r.attempts !== undefined && (!Array.isArray(r.attempts) || r.attempts.length > 3 || r.attempts.some(a => ![1, 2, 3].includes(a.heat) || ![3, 5].includes(a.rating)))))
        return false;
    if (!m.training || Object.keys(m.training).length > 12 || Object.entries(m.training).some(([id, t]) => !/^staff-([1-9]|1[0-2])$/.test(id) || !int(t.level, 3) || !int(t.progress, 1000) || !str(t.lesson) || !strings(t.badges, 3)))
        return false;
    if (m.specialPlanManual !== undefined && typeof m.specialPlanManual !== 'boolean')
        return false;
    if (m.specialPlan !== undefined && !['birthday', 'reservation', 'festival', 'vip'].includes(m.specialPlan))
        return false;
    if (!Array.isArray(m.deliveries) || m.deliveries.length > 30 || new Set(m.deliveries.map(x => x.id)).size !== m.deliveries.length || m.deliveries.some(x => !str(x.id) || !str(x.resident) || !str(x.destination) || !str(x.menuId) || !int(x.quantity, 3) || x.quantity < 1 || !['offered', 'accepted', 'delivered', 'missed'].includes(x.status)))
        return false;
    if (!Array.isArray(m.businessHistory) || m.businessHistory.length > 100 || new Set(m.businessHistory.map(x => x.id)).size !== m.businessHistory.length || m.businessHistory.some(x => !str(x.id) || !['fast', 'care', 'group'].includes(x.strategy) || !Number.isFinite(x.reputation) || x.reputation < 0 || x.reputation > 100 || typeof x.success !== 'boolean' || !int(x.served)))
        return false;
    const r = m.run;
    if (r) {
        if (!str(r.id) || !['fast', 'care', 'group'].includes(r.strategy) || !strings(r.seen, 3000) || ![r.paid, r.lost, r.specialServed, r.eventSuccess, r.researchSold].every(x => int(x)) || !Number.isFinite(r.wait) || r.wait < 0 || typeof r.missionComplete !== 'boolean' || typeof r.settled !== 'boolean')
            return false;
        if (r.delivery && (!str(r.delivery.id) || typeof r.delivery.resolved !== 'boolean' || !Array.isArray(r.delivery.reserved) || r.delivery.reserved.length > 3 || r.delivery.reserved.some(x => !str(x.menuId) || !int(x.quantity, 3) || x.quantity < 1) || r.delivery.miniId !== undefined && !str(r.delivery.miniId)))
            return false;
        if (r.special && (r.special.inventory !== undefined && (!validSpecialInventory(r.special.inventory) || r.special.inventory.orders.length !== (r.special.kind === 'vip' ? 0 : r.special.kind === 'birthday' || r.special.kind === 'festival' ? 2 : 1)) || r.special.ownerAssist !== undefined && typeof r.special.ownerAssist !== 'boolean' || r.special.prepared !== undefined && typeof r.special.prepared !== 'boolean' || r.special.eventId !== undefined && !int(r.special.eventId, 100) || r.special.baseCorrect !== undefined && !int(r.special.baseCorrect) || !['birthday', 'reservation', 'festival', 'vip'].includes(r.special.kind) || ![r.special.served, r.special.correct].every(x => int(x)) || typeof r.special.complete !== 'boolean'))
            return false;
    }
    return JSON.stringify(m).length < 200000;
}
catch {
    return false;
} }
export function validCafeAlbum(v) { return Array.isArray(v) && v.length <= 300 && new Set(v.map(x => x?.id)).size === v.length && v.every(x => x && str(x.id) && ['founding', 'branch', 'specialization', 'staff', 'recipe', 'regular', 'village', 'second', 'record', 'training', 'business'].includes(x.kind) && ['cafe-1', 'cafe-2'].includes(x.cafeId) && str(x.label) && str(x.at, 40) && Number.isFinite(Date.parse(x.at)) && int(x.level, 15) && x.level >= 1 && typeof x.reward === 'string' && x.reward.length <= 200); }
