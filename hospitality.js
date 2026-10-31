import { unlocked } from './progressiveFeatures.js';
import { helperCatalog, hospitalityBalance as b } from './hospitalityConfig.js';
export class Hospitality {
    enabled = false;
    questions = [];
    helperVisits = 0;
    specialVisits = 0;
    lastHelper = -Infinity;
    lastSpecial = -Infinity;
    cash = 0;
    giftValue = 0;
    discounts = 0;
    signatureRevenue = 0;
    paid = new Set();
    events = [];
    flowersUntil = 0;
    influenceUntil = 0;
    couponUntil = 0;
    travelerUntil = 0;
    patissierUntil = 0;
    patissierOrders = 0;
    patissierBudget = 0;
    criticUntil = 0;
    select(g, roll) { if (!unlocked(g, 'missions'))
        return null; if (!this.enabled)
        return null; if (g.cafeLevel >= 4 && this.questions.length && this.specialVisits < b.specialLimit && g.elapsedTime - this.lastSpecial >= b.specialCooldown && roll < b.specialChance) {
        this.specialVisits++;
        this.lastSpecial = g.elapsedTime;
        return 'judge';
    } if (this.helperVisits >= b.helperLimits[g.mode] || g.elapsedTime - this.lastHelper < b.helperCooldown || roll < b.specialChance || roll >= b.specialChance + b.helperChance)
        return null; const available = helperCatalog.filter(h => h.unlock <= g.cafeLevel && !g.guests.some(x => x.helperType === h.id)); if (!available.length)
        return null; const h = available[Math.min(available.length - 1, Math.floor((roll - b.specialChance) / b.helperChance * available.length))]; this.helperVisits++; this.lastHelper = g.elapsedTime; return h.id; }
    normalBonus(g, x) { if (!unlocked(g, 'missions'))
        return 0; if (!this.enabled || x.specialType || x.helperType || x.signature)
        return 0; let n = 0; if (this.patissierOrders && g.elapsedTime < this.patissierUntil) {
        n = Math.min(this.patissierBudget, Math.round(x.quotedRevenue * .05));
        this.patissierBudget -= n;
        this.patissierOrders--;
    } if (g.elapsedTime < this.criticUntil) {
        n += Math.min(b.buffCap, Math.round(x.quotedRevenue * .1));
        this.criticUntil = 0;
    } this.cash += n; return n; }
    gift(g, cap, maxItems = 3) { if (!unlocked(g, 'missions'))
        return 0; let value = 0, count = 0; for (const m of [...g.menus].sort((a, b) => a.stock - b.stock || a.menuId.localeCompare(b.menuId))) {
        const price = g.getPrice(m);
        if (count < maxItems && m.stock < m.maxStock && value + price <= cap) {
            m.stock++;
            value += price;
            count++;
        }
    } this.giftValue += value; return value; }
    reward(g, x) { if (!unlocked(g, 'missions'))
        return; if (x.eventArrival || !this.enabled || this.paid.has(x.id) || !x.paid || x.abandoned)
        return; this.paid.add(x.id); if (x.signature) {
        this.signatureRevenue += x.paymentRevenue ?? 0;
        return;
    } const id = x.helperType; if (!id)
        return; let cash = 0, value = 0; switch (id) {
        case 'tip':
            cash = Math.min(b.tipCap, Math.round(x.quotedRevenue * .1));
            break;
        case 'florist':
            cash = 60;
            this.flowersUntil = g.elapsedTime + 30;
            break;
        case 'grandma':
            cash = 80;
            break;
        case 'supplier':
            value = this.gift(g, b.giftCap);
            break;
        case 'lucky':
            if (x.id % 2)
                cash = 60;
            else
                value = this.gift(g, 120);
            break;
        case 'influencer':
            this.influenceUntil = g.elapsedTime + 30;
            break;
        case 'repair':
            this.couponUntil = g.elapsedTime + 90;
            break;
        case 'patissier':
            this.patissierUntil = g.elapsedTime + 60;
            this.patissierOrders = 3;
            this.patissierBudget = b.buffCap;
            break;
        case 'critic':
            this.criticUntil = g.elapsedTime + 60;
            break;
        case 'traveler':
            this.travelerUntil = g.elapsedTime + 60;
            break;
    } g.money += cash; g.stats.revenue += cash; this.cash += cash; this.events.push({ guestId: x.id, type: id, value: cash + value, time: g.elapsedTime, message: helperCatalog.find(h => h.id === id).line }); }
    menuDiscount(g, cost) { return this.enabled && g.elapsedTime < this.couponUntil ? Math.min(b.discountCap, Math.floor(cost * .05)) : 0; }
}
