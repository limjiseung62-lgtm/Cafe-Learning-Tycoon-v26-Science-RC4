export const runBalance = { rounds: [.18, .36, .54, .72], finalStart: .8, finalOrders: 3, finalReward: 400, maxBonusRate: .25, maxBonusPerOrder: 250 };
export const concepts = [
    { id: 'dessert', name: '디저트 살롱', description: '디저트 주문이 많아져요. 디저트가 든 주문 보너스 +5%.', preference: 'DESSERT', rate: .05 },
    { id: 'coffee', name: '커피 공방', description: '커피 주문이 많아져요. 커피가 든 주문 보너스 +5%.', preference: 'COFFEE', rate: .05 },
    { id: 'neighborhood', name: '동네 사랑방', description: '새 손님이 15초 더 기다려요. 단일 메뉴 주문 보너스 +5%.', preference: 'NONE', rate: .05 }
];
export const traits = [
    { id: 'patient', name: '포근한 의자', description: '앞으로 오는 손님이 20초 더 기다려요.' },
    { id: 'coffee', name: '오늘의 원두', description: '커피가 든 주문 보너스 +8%.' },
    { id: 'dessert', name: '달콤한 쇼케이스', description: '디저트가 든 주문 보너스 +8%.' },
    { id: 'pair', name: '페어링 메뉴판', description: '음료와 먹거리를 함께 서빙하면 보너스 +12%.' },
    { id: 'simple', name: '한 가지에 진심', description: '한 종류로만 구성된 주문 보너스 +10%.' },
    { id: 'variety', name: '맛보기 세트', description: '두 종류 이상 주문 보너스 +10%.' },
    { id: 'quick', name: '따끈한 한 접시', description: '주문 후 35초 안에 서빙하면 보너스 +12%.' },
    { id: 'team', name: '함께하는 카페', description: '직원 2명 이상이면 일반 주문 보너스 +8%.' },
    { id: 'owner', name: '사장님의 정성', description: '직원 0~1명이면 일반 주문 보너스 +8%.' },
    { id: 'fresh', name: '새 메뉴 시식회', description: '현재 카페 단계에 해금된 메뉴 주문 보너스 +10%.' },
    { id: 'steady', name: '차곡차곡 단골 도장', description: '세 번째 성공 결제마다 보너스 +20%.' },
    { id: 'party', name: '파티 플래너', description: '마지막 파티 손님은 30초 더 기다려요. 파티 주문 보너스 +15%.' }
];
export function seededRandom(code) { let state = 2166136261; for (const c of code.normalize('NFC'))
    state = Math.imul(state ^ c.charCodeAt(0), 16777619); return () => { state += 0x6D2B79F5; let n = state; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }; }
const drinks = new Set(['coffee', 'strawberry-latte', 'ade']);
const coffee = new Set(['coffee']);
const dessert = new Set(['cookie', 'cake', 'icecream', 'waffle', 'cupcake', 'donut', 'bingsu', 'pudding', 'parfait', 'pancake', 'special-cake']);
export class CafeRun {
    code;
    concept;
    choices;
    selected = [];
    finalAssigned = 0;
    finalPaid = 0;
    finalRewarded = false;
    bonusRevenue = 0;
    payments = 0;
    paidIds = new Set();
    constructor(code, conceptId) {
        this.code = code;
        const concept = concepts.find(c => c.id === conceptId);
        if (!concept)
            throw Error('Unknown café concept');
        this.concept = concept;
        const random = seededRandom('traits:' + code), pool = traits.map(t => t.id);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        this.choices = Array.from({ length: 4 }, (_, i) => pool.slice(i * 3, i * 3 + 3));
    }
    pending(elapsed, duration) { return this.selected.length < 4 && elapsed / duration >= runBalance.rounds[this.selected.length]; }
    choose(id, elapsed, duration) { if (!this.pending(elapsed, duration) || !this.choices[this.selected.length].includes(id))
        return false; this.selected.push(id); return true; }
    preference(original) { return this.concept.preference === 'NONE' ? original : this.concept.preference; }
    patience(final = false) { return (this.concept.id === 'neighborhood' ? 15 : 0) + (this.selected.includes('patient') ? 20 : 0) + (final && this.selected.includes('party') ? 30 : 0); }
    assignFinal(elapsed, duration) { if (elapsed / duration < runBalance.finalStart || this.finalAssigned >= runBalance.finalOrders)
        return false; this.finalAssigned++; return true; }
    payment(g, menus, staff, cafeLevel) {
        if (g.signature || g.specialType || g.abandoned || this.paidIds.has(g.id))
            return 0;
        this.paidIds.add(g.id);
        this.payments++;
        const ids = g.order.map(o => o.menuId), has = (set) => ids.some(id => set.has(id));
        let rate = 0;
        if (this.concept.id === 'coffee' && has(coffee) || this.concept.id === 'dessert' && has(dessert) || this.concept.id === 'neighborhood' && ids.length === 1)
            rate += this.concept.rate;
        for (const id of this.selected) {
            if (id === 'coffee' && has(coffee) || id === 'dessert' && has(dessert) || id === 'team' && staff >= 2 || id === 'owner' && staff <= 1)
                rate += .08;
            if (id === 'simple' && ids.length === 1 || id === 'variety' && ids.length >= 2 || id === 'fresh' && ids.some(id => menus.find(m => m.menuId === id)?.unlockCafeLevel === cafeLevel))
                rate += .1;
            if (id === 'pair' && has(drinks) && ids.some(id => !drinks.has(id)) || id === 'quick' && (g.servedAt ?? Infinity) - g.orderedAt <= 35)
                rate += .12;
            if (id === 'steady' && this.payments % 3 === 0)
                rate += .2;
            if (id === 'party' && g.runFinal)
                rate += .15;
        }
        let bonus = Math.min(runBalance.maxBonusPerOrder, Math.round(g.quotedRevenue * Math.min(runBalance.maxBonusRate, rate)));
        if (g.runFinal) {
            this.finalPaid++;
            if (this.finalPaid === runBalance.finalOrders && !this.finalRewarded) {
                this.finalRewarded = true;
                bonus += runBalance.finalReward;
            }
        }
        this.bonusRevenue += bonus;
        return bonus;
    }
    report() { return { code: this.code, concept: this.concept.name, traits: this.selected.map(id => traits.find(t => t.id === id).name), bonusRevenue: this.bonusRevenue, finalPaid: this.finalPaid, finalAssigned: this.finalAssigned, finalRewarded: this.finalRewarded }; }
}
