// Session-injected rules can be replaced by a future mode; no persistence is implemented.
export const phase4Balance = { itemPriceMultipliers: [1, 1.7, 3, 5, 7.5, 11], spawnRate: .13, vipRate: .01, maxActive: 2, gourmandMultiplier: 1.6, gourmandMaxQuantity: 12, hurriedFastSeconds: 30, hurriedBonus: 1.2, regularRevisitChance: .5, regularPatienceStep: 10, rules: { gourmand: { unlock: 2, weight: 1, patience: 150, multiplier: 1 }, spender: { unlock: 3, weight: 1, patience: 140, multiplier: 1.5 }, hurried: { unlock: 4, weight: 1, patience: 60, multiplier: 1 }, regular: { unlock: 2, weight: 1, patience: 140, multiplier: 1 }, vip: { unlock: 5, weight: 0, patience: 180, multiplier: 2 } }, items: { 'stock-five': { price: 1500, limit: 3 }, delivery: { price: 800, limit: 3 }, golden: { price: 2000, limit: 2 }, invite: { price: 1500, limit: 2 }, booster: { price: 2500, limit: 2 } } };
export const itemCatalog = [{ id: 'stock-five', name: '5창고분', effect: '해금 메뉴 재고 +5 · 최대 재고까지' }, { id: 'delivery', name: '긴급배송', effect: '선택 메뉴 재고를 가득 채워요' }, { id: 'golden', name: '황금시간', effect: '다음 완료 주문 5개 매출 ×2' }, { id: 'invite', name: 'VIP 초대권', effect: '다음 가능한 신규 방문을 VIP로 예약' }, { id: 'booster', name: '생산 부스터', effect: '다음 정답 3번 · 해금 메뉴마다 +3' }];
export const specialNames = { gourmand: '먹보 손님 소담', spender: '큰손 손님 리안', hurried: '급한 손님 재민', regular: '단골 손님 수아', vip: 'VIP 손님 세라' };
export const specialIcons = { gourmand: '🍴', spender: '✦', hurried: '⏱', regular: '♥', vip: '★' };
export function specialDefinition(type, p = phase4Balance) { return { customerId: 'special-' + type, visualKey: 'special-' + type, name: specialNames[type], personality: type === 'hurried' ? 'BUSY' : 'KIND', orderPreference: type === 'gourmand' ? 'DESSERT' : 'NONE', characterTrait: specialNames[type], unlockCafeLevel: p.rules[type].unlock, spawnWeight: 1, patienceSeconds: p.rules[type].patience, orderProfile: { minQuantity: 1, maxQuantity: 4, maxTypes: 3 }, category: 'special' }; }
export const specialTypes = Object.keys(specialNames);
export function chooseSpecial(level, active, roll, p, pendingVIP = false, revisit = false) { if (active.length >= p.maxActive)
    return null; if (pendingVIP && !active.includes('vip') && level >= p.rules.vip.unlock)
    return 'vip'; const candidates = specialTypes.filter(t => t !== 'vip' && p.rules[t].unlock <= level && !active.includes(t)); const vipAvailable = level >= p.rules.vip.unlock && !active.includes('vip'); const vipRate = vipAvailable ? p.vipRate : 0; if (roll < vipRate)
    return 'vip'; const rate = active.includes('vip') ? p.spawnRate * .5 : p.spawnRate; if (roll >= rate || !candidates.length)
    return null; const weights = candidates.map(t => p.rules[t].weight * (t === 'regular' && revisit ? 1.5 : 1)); let n = (roll - vipRate) / Math.max(.0001, rate - vipRate) * weights.reduce((a, b) => a + b, 0); for (let i = 0; i < candidates.length; i++) {
    n -= weights[i];
    if (n < 0)
        return candidates[i];
} return candidates.at(-1); }
