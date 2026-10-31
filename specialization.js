import { unlocked } from './progressiveFeatures.js';
import { specializationById, belongsToBranch } from './specializationConfig.js';
export function validSpecialization(v) { try {
    const s = v;
    return !!s && s.version === 1 && !!specializationById(s.selected) && typeof s.selectedAt === 'string' && Number.isFinite(Date.parse(s.selectedAt)) && Array.isArray(s.receipts) && s.receipts.length <= 300 && new Set(s.receipts.map(r => r.id)).size === s.receipts.length && s.receipts.every(r => typeof r.id === 'string' && r.id.length <= 160 && typeof r.business === 'string' && r.business.length <= 128 && typeof r.event === 'string' && specializationById(s.selected).events.some((_, i) => r.event === 'spec-' + s.selected + '-' + i) && ['success', 'failed', 'cancelled'].includes(r.outcome)) && Array.isArray(s.collections) && s.collections.length <= 3 && new Set(s.collections).size === s.collections.length && s.collections.every(id => ['souvenir', 'recipe', 'title'].includes(id)) && JSON.stringify(s).length < 200000;
}
catch {
    return false;
} }
export function canSpecialize(g) { if (!unlocked(g, 'specialization'))
    return false; return g.mode === 'CAFE_GROWTH' && g.cafeLevel >= 11 && !!g.branchId && !g.specialization; }
export function chooseSpecialization(g, id, now = new Date().toISOString()) { if (!canSpecialize(g) || !belongsToBranch(id, g.branchId))
    return false; g.specialization = { version: 1, selected: id, selectedAt: now, receipts: [], collections: [], ...g.freeLayouts ? { layoutBackup: structuredClone(g.freeLayouts) } : {} }; return true; }
// Buildings keep all new facilities outside the existing editable floor. No furniture relocation is needed.
export function syncSpecialization(g, business) { const s = g.specialization; if (g.mode !== 'CAFE_GROWTH' || !s)
    return false; let changed = false; for (const r of g.events.records) {
    if (!r.type.startsWith('spec-' + s.selected + '-') || !['success', 'failed', 'cancelled'].includes(r.outcome))
        continue;
    const id = business + '/' + r.id;
    if (s.receipts.some(x => x.id === id))
        continue;
    s.receipts.push({ id, business, event: r.type, outcome: r.outcome });
    s.receipts = s.receipts.slice(-300);
    if (r.outcome === 'success')
        for (const c of ['souvenir', 'recipe', 'title'])
            if (!s.collections.includes(c))
                s.collections.push(c);
    changed = true;
} return changed; }
export const saveSpecialization = (s, g) => g.specialization ? { ...s, specialization: structuredClone(g.specialization) } : s;
