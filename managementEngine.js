import { unlocked } from './progressiveFeatures.js';
import { ensureSpecialInventory, reservationIndex } from './specialInventory.js';
import { serviceReview, abandonedReview } from './managementReview.js';
import { observeEducation } from './staffEducation.js';
import { pollSpecialBusiness } from './specialBusiness.js';
export const strategyCatalog = [{ id: 'fast', name: '빠른 서비스', visual: 'coffee', detail: '일반 손님과 작은 주문을 차근차근 처리해요.', event: '주방·서빙 미션', crew: '하루의 준비 · 태오의 운반', mission: '주문 8건 서빙' }, { id: 'care', name: '정성 서비스', visual: 'cake', detail: '기다림을 줄이고 단골과 특별 손님을 대접해요.', event: '접객·재고 구조 미션', crew: '봄이의 친절 · 루나의 접객', mission: '기다림 45초 이내로 5건 서빙' }, { id: 'group', name: '단체 주문', visual: 'bread', detail: '예약 손님을 위해 재고와 직원을 준비해요.', event: '단체·생일 주문 미션', crew: '준이의 재고 · 태오의 운반', mission: '음식 18개 서빙' }];
export function startManagement(g, id) { if (!unlocked(g, 'reviews'))
    return; const m = g.management; if (g.mode !== 'CAFE_GROWTH' || !m?.strategy)
    return; if (m.run?.id === id)
    return; m.run = { id, strategy: m.strategy, seen: [], paid: 0, lost: 0, wait: 0, specialServed: 0, eventSuccess: 0, researchSold: 0, missionComplete: false, settled: false, ...m.specialPlan ? { special: { kind: m.specialPlan, served: 0, correct: 0, complete: false, ...m.specialPlanManual ? { prepared: false } : {} } } : {} }; delete m.specialPlan; delete m.specialPlanManual; ensureSpecialInventory(g); }
export function strategyQuantity(g, base) { if (!unlocked(g, 'strategy'))
    return base; const r = g.mode === 'CAFE_GROWTH' ? g.management?.run : undefined; if (!r || g.telemetry.phase4.customersSpawned % 5)
    return base; return r.strategy === 'fast' ? Math.max(1, base - 1) : r.strategy === 'group' ? Math.min(base + 1, 5) : base; }
export function strategyGuest(g, type, serial) { if (!unlocked(g, 'strategy'))
    return type; const r = g.mode === 'CAFE_GROWTH' ? g.management?.run : undefined; if (!r)
    return type; if (r.strategy === 'fast' && serial % 9 === 0)
    return null; if (r.strategy === 'care' && serial % 40 === 0 && g.cafeLevel >= g.phase4Profile.rules.vip.unlock && !g.guests.some(x => x.specialType === 'vip'))
    return 'vip'; return type; }
export function pollManagement(g) {
    if (!unlocked(g, 'reviews'))
        return;
    const m = g.mode === 'CAFE_GROWTH' ? g.management : undefined, r = m?.run;
    if (!m || !r || r.settled)
        return;
    if (g.elapsedTime >= 10 && !r.seen.includes('strategy-event') && !g.events.active && g.status === 'RUNNING') {
        const type = r.strategy === 'group' ? 'rush' : r.strategy === 'care' ? (g.cafeLevel >= 2 ? 'team' : 'rescue') : 'kitchen';
        if (g.events.beginMission(type, g))
            r.seen.push('strategy-event');
    }
    const count = (key) => { if (r.seen.includes(key))
        return false; r.seen.push(key); return true; };
    for (const guest of g.guests) {
        const identity = guest.definition.visualKey;
        if (m.regulars[identity]?.loyal && !guest.definition.name.startsWith('단골 '))
            guest.definition = { ...guest.definition, name: '단골 ' + guest.definition.name, characterTrait: '다시 와서 반가워요! 늘 먹던 메뉴를 부탁해요.' };
        if (guest.paid && count('paid:' + guest.id)) {
            r.paid++;
            observeEducation(g, guest.id);
            r.researchSold += guest.order.filter(o => o.menuId.startsWith('research-')).reduce((n, o) => n + o.quantity, 0);
            const wait = Math.max(0, (guest.servedAt ?? g.elapsedTime) - guest.orderedAt);
            r.wait += wait;
            if (guest.specialType || guest.signature)
                r.specialServed++;
            if (r.special?.eventId === guest.eventArrival?.eventId && r.special?.eventId && (!r.special.inventory || r.special.kind === 'vip' && guest.signature || reservationIndex(g, guest) !== undefined))
                r.special.served++;
            const stars = wait <= 30 ? 5 : wait <= 75 ? 4 : 3;
            const { interior, text, reason } = serviceReview(g, guest, wait);
            m.reviews.push({ id: r.id + '/guest/' + guest.id, guest: guest.definition.name, stars, text, reason });
            m.reviews = m.reviews.slice(-32);
            m.reputation = Math.max(0, Math.min(100, Math.round((m.reputation * .97 + (stars * 18 + (interior ? 2 : 0)) * .03) * 100) / 100));
            const regular = m.regulars[identity] ??= { visits: 0, loyal: false, giftClaimed: false };
            regular.visits++;
            if (stars >= 4 && regular.visits >= 3)
                regular.loyal = true;
            if (regular.loyal && !regular.giftClaimed) {
                regular.giftClaimed = true;
                const plate = guest.order.find(o => g.menus.some(menu => menu.menuId === o.menuId));
                if (plate) {
                    m.deliveries.push({ id: 'loyal:' + (g.growthCafeId ?? 'cafe-1') + ':' + identity, resident: guest.definition.name, destination: 'plaza', menuId: plate.menuId, quantity: 1, status: 'offered' });
                    m.deliveries = m.deliveries.slice(-30);
                }
                m.materials.flower = Math.min(999, m.materials.flower + 1);
                g.regularMemory.revisitEligible = true;
            }
            if (r.paid % 5 === 0) {
                const key = r.strategy === 'group' ? 'flour' : r.strategy === 'care' ? 'milk' : 'fruit';
                m.materials[key] = Math.min(999, m.materials[key] + 1);
            }
        }
        if (guest.abandoned && count('lost:' + guest.id)) {
            r.lost++;
            m.reputation = Math.max(0, Math.round((m.reputation - .1) * 100) / 100);
            m.reviews.push({ id: r.id + '/guest/' + guest.id, guest: guest.definition.name, stars: 3, text: abandonedReview(g, guest.id), reason: '음식 대기시간 종료 · 추가 벌금 없음' });
            m.reviews = m.reviews.slice(-32);
        }
    }
    for (const e of g.events.records)
        if (e.outcome === 'success' && count('event:' + e.id))
            m.reputation = Math.min(100, Math.round((m.reputation + .2) * 100) / 100);
    pollSpecialBusiness(g);
    r.eventSuccess = g.events.records.filter(x => x.outcome === 'success').length;
    r.missionComplete = r.strategy === 'fast' ? r.paid >= 8 : r.strategy === 'care' ? r.paid >= 5 && r.wait / r.paid <= 45 : g.stats.soldFood >= 18;
}
export function settleManagement(g) { pollManagement(g); const m = g.mode === 'CAFE_GROWTH' ? g.management : undefined, r = m?.run; if (!m || !r || g.status !== 'CLOSED' || r.settled)
    return false; if (!m.businessHistory.some(h => h.id === r.id)) {
    if (r.missionComplete && g.stats.correct > 0) {
        m.materials.flower = Math.min(999, m.materials.flower + 1);
        m.reputation = Math.min(100, m.reputation + 1);
    }
    m.businessHistory.push({ id: r.id, strategy: r.strategy, reputation: m.reputation, success: r.missionComplete, served: r.paid });
    m.businessHistory = m.businessHistory.slice(-100);
} r.settled = true; return true; }
