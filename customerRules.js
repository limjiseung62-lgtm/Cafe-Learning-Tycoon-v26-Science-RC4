import { customers } from './data.js';
export const personalityDefaults = { KIND: 150, RELAXED: 120, NORMAL: 100, BUSY: 70 };
export const personalityLabels = { KIND: '매우 다정함', RELAXED: '느긋함', NORMAL: '보통', BUSY: '급함' };
export const preferenceBoost = 1.025;
const families = { coffee: 'COFFEE', 'strawberry-latte': 'DRINK', ade: 'DRINK', croissant: 'BAKERY', sandwich: 'BAKERY', pizza: 'BAKERY', bread: 'BAKERY', pancake: 'BAKERY', cookie: 'DESSERT', cake: 'DESSERT', icecream: 'DESSERT', waffle: 'DESSERT', cupcake: 'DESSERT', donut: 'DESSERT', bingsu: 'DESSERT', pudding: 'DESSERT', parfait: 'DESSERT', 'special-cake': 'DESSERT' };
export function orderPreferenceWeight(menuId, preference) { return preference !== 'NONE' && families[menuId] === preference ? preferenceBoost : 1; }
function weighted(items, weight, random) { if (!items.length)
    throw new Error('Empty weighted pool'); const total = items.reduce((sum, item) => sum + weight(item), 0); let value = Math.max(0, Math.min(1 - Number.EPSILON, random())) * total; for (const item of items) {
    value -= weight(item);
    if (value < 0)
        return item;
} return items.at(-1); }
export function chooseCustomer(poolIds, activeVisualKeys, random) { const used = new Set(activeVisualKeys), pool = customers.filter(c => poolIds.includes(c.customerId)); const available = pool.filter(c => !used.has(c.visualKey)); if (!available.length)
    return null; return weighted(available, c => c.spawnWeight, random); }
export function chooseOrderMenu(available, preference, random) { return weighted(available, m => orderPreferenceWeight(m.menuId, preference), random); }
