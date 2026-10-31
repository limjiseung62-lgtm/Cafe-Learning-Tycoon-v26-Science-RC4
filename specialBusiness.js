import { unlocked } from './progressiveFeatures.js';
import { ensureSpecialInventory, specialPreparation, reservedTeamTarget } from './specialInventory.js';
import { managementFor } from './managementState.js';
import { offerMini } from './miniGames.js';
export const specialBusinessCatalog = [{ id: 'birthday', name: '생일 파티', level: 3, target: 2, mission: 'birthday', description: '생일 손님 2팀을 대접하고 문제 2개를 맞혀요.' }, { id: 'reservation', name: '단체 예약', level: 1, target: 1, mission: 'rush', description: '예약 주문을 대접하고 문제 2개를 맞혀요.' }, { id: 'festival', name: '축제 야외 영업', level: 2, target: 2, mission: 'birthday', description: '마을 2단계부터, 축제 손님과 문제 2개에 도전해요.' }, { id: 'vip', name: '특별 VIP 행사', level: 4, target: 1, mission: 'gourmet', description: '특별 주문 도전을 풀고 미식가를 대접해요.' }];
export function planSpecialBusiness(save, id, manual = false) { if (!unlocked(save, 'specialBusiness'))
    return false; const item = specialBusinessCatalog.find(x => x.id === id); if (!item || save.cafeLevel < item.level || id === 'festival' && (save.village?.progression?.stage ?? 1) < 2)
    return false; const m = managementFor(save); m.specialPlan = id; if (manual)
    m.specialPlanManual = true;
else
    delete m.specialPlanManual; return true; }
export function prepareDeliveryOffers(save) { if (!unlocked(save, 'delivery'))
    return false; const m = managementFor(save); if (m.deliveries.some(d => ['offered', 'accepted'].includes(d.status)))
    return false; const cafe = save.portfolio?.activeCafeId ?? 'cafe-1'; const targets = [['소담', 'flowers'], ['다온', 'market'], ['보리', 'mill']]; for (const [i, [resident, destination]] of targets.entries()) {
    const id = 'delivery:' + cafe + ':' + save.completedSessions + ':' + i;
    if (!m.deliveries.some(d => d.id === id))
        m.deliveries.push({ id, resident, destination, menuId: save.unlockedMenuIds[i % save.unlockedMenuIds.length], quantity: i === 2 ? 2 : 1, status: 'offered' });
} m.deliveries = m.deliveries.slice(-30); return true; }
export function acceptDelivery(save, id) { if (!unlocked(save, 'delivery'))
    return false; const d = managementFor(save).deliveries.find(d => d.id === id); if (!d || d.status !== 'offered')
    return false; d.status = 'accepted'; return true; }
export function moveDelivery(save, id, direction) { const list = managementFor(save).deliveries, i = list.findIndex(d => d.id === id), j = i + direction; if (i < 0 || j < 0 || j >= list.length || ![-1, 1].includes(direction))
    return false; [list[i], list[j]] = [list[j], list[i]]; return true; }
export function dispatchDelivery(g, id, courierId) { if (!unlocked(g, 'delivery'))
    return { ok: false, reason: '카페 Lv.13부터 배달할 수 있어요.' }; const m = g.mode === 'CAFE_GROWTH' ? g.management : undefined, r = m?.run, d = m?.deliveries.find(d => d.id === id); if (!m || !r || r.delivery || g.status !== 'RUNNING' || !d || d.status !== 'accepted')
    return { ok: false, reason: '이번 영업은 한 번 배달해요. 수락한 주문을 확인해 주세요.' }; const courier = g.service.workers.find(w => w.owner ? courierId === 'owner' : w.staffId === courierId); if (!courier || courier.carryCapacity < d.quantity)
    return { ok: false, reason: '근무 직원의 운반량이 부족해요. 직원이나 주문 순서를 바꿔 보세요.' }; const menu = g.menus.find(x => x.menuId === d.menuId); if (!menu || menu.stock < d.quantity)
    return { ok: false, reason: '배달할 음식 재고가 부족해요. 음식 만들기로 준비해 주세요.' }; if (!offerMini(g, 'tray', true, true))
    return { ok: false, reason: '지금 준비한 미니게임을 먼저 마쳐 주세요. 한 영업 최대 3회예요.' }; menu.stock -= d.quantity; r.delivery = { id: d.id, reserved: [{ menuId: d.menuId, quantity: d.quantity }], miniId: g.miniGames.offers.at(-1).id, resolved: false }; return { ok: true, reason: '재고를 한 번 예약했어요. 문제로 준비한 뒤 트레이 배달에 도전해요.' }; }
export function pollSpecialBusiness(g) {
    if (!unlocked(g, 'specialBusiness'))
        return;
    const m = g.mode === 'CAFE_GROWTH' ? g.management : undefined, r = m?.run;
    if (!m || !r || r.settled)
        return;
    const special = r.special;
    if (special) {
        const config = specialBusinessCatalog.find(x => x.id === special.kind);
        if (special.prepared !== false && !special.eventId && g.elapsedTime >= 100 && !g.events.active && g.status === 'RUNNING') {
            if (special.inventory) {
                special.ownerAssist = g.service.paid.length === 0;
                const check = specialPreparation(g);
                if (!check?.ready) {
                    special.prepared = false;
                    delete special.ownerAssist;
                    return;
                }
            }
            const mission = config.mission === 'birthday' && g.cafeLevel < 3 ? 'rush' : config.mission;
            if (g.events.beginMission(mission, g)) {
                special.eventId = g.events.records.at(-1).id;
                if (special.inventory && special.kind !== 'vip') {
                    let index = 0;
                    for (const arrival of g.events.arrivals)
                        if (arrival.eventId === special.eventId && index < reservedTeamTarget(special, g.service.paid.length))
                            arrival.reservationIndex = index++;
                }
                special.baseCorrect = g.stats.correct;
                g.events.records.at(-1).name = config.name;
                g.events.extendReservedBusiness(special.ownerAssist ? 300 : 210, special.ownerAssist);
                g.events.arrivals.sort((a, b) => Number(b.eventId === special.eventId) - Number(a.eventId === special.eventId));
            }
        }
        special.correct = Math.max(0, g.stats.correct - (special.baseCorrect ?? g.stats.correct));
        const event = g.events.records.find(e => e.id === special.eventId);
        if (!special.complete && event?.outcome === 'success' && special.served >= (special.ownerAssist ? 1 : config.target) && special.correct >= (special.kind === 'vip' ? 1 : 2)) {
            special.complete = true;
            m.materials.flower = Math.min(999, m.materials.flower + 2);
            m.reputation = Math.min(100, m.reputation + 1);
        }
    }
    const pending = r.delivery;
    if (pending && !pending.resolved) {
        const receipt = g.miniCollection?.receipts.find(x => x.id === pending.miniId && x.kind === 'tray');
        if (receipt) {
            pending.resolved = true;
            const d = m.deliveries.find(x => x.id === pending.id);
            if (d) {
                d.status = receipt.outcome === 'success' ? 'delivered' : 'missed';
                if (receipt.outcome === 'success') {
                    m.materials.fruit = Math.min(999, m.materials.fruit + 1);
                    m.materials.flour = Math.min(999, m.materials.flour + 1);
                    m.reputation = Math.min(100, m.reputation + 1);
                    const regular = m.regulars['resident:' + d.destination] ??= { visits: 0, loyal: false, giftClaimed: false };
                    regular.visits++;
                    if (regular.visits >= 3)
                        regular.loyal = true;
                }
            }
        }
    }
}
/** Retry only in a later business: no refund, fresh inventory reservation, one attempt per run. */
export function retryDelivery(save, id) { if (save.campaign?.run && !save.campaign.run.closed)
    return false; const m = managementFor(save), d = m.deliveries.find(x => x.id === id); if (!d || d.status !== 'missed')
    return false; d.status = 'accepted'; return true; }
export function prepareSpecialBusiness(g) { if (!unlocked(g, 'specialBusiness'))
    return { ok: false, reason: '카페 Lv.12부터 특별 영업을 준비해요.' }; const r = g.mode === 'CAFE_GROWTH' ? g.management?.run : undefined, s = r?.special; if (g.status !== 'RUNNING' || !s || s.prepared !== false || s.eventId)
    return { ok: false, reason: '이미 시작했거나 예약된 행사가 없어요.' }; ensureSpecialInventory(g); const check = specialPreparation(g); if (!check?.ready)
    return { ok: false, reason: g.stats.correct < 2 ? '먼저 문제 2개를 맞혀 주세요.' : check ? check.lines.filter(x => x.missing > 0).map(x => x.name + ' ' + x.missing + '개 부족').join(', ') : '준비 목록을 확인하지 못했어요. 저장을 보관한 뒤 다시 열어 주세요.' }; s.ownerAssist = g.service.paid.length === 0; s.prepared = true; return { ok: true, reason: '준비 완료! 앞 행사가 끝나고 영업 100초 이후 손님을 맞이해요. 직원 0명은 목표 1팀·행사 최대 5분·예약 손님 대기 +90초·예약 먼저 수동서빙, 직원 1명 이상은 최대 3분 30초예요. 실제 예약 팀을 대접해야 해요.' }; }
export function specialOperationStatus(g) { const s = g.management?.run?.special; if (!s)
    return ''; const config = specialBusinessCatalog.find(x => x.id === s.kind); if (s.complete)
    return '완료 ✓'; if (s.prepared === false)
    return '재고 준비 후 손님 맞이'; if (!s.eventId)
    return '앞 행사 종료 후 시작'; const e = g.events.records.find(x => x.id === s.eventId), queued = g.events.arrivals.some(x => x.eventId === s.eventId), remaining = g.guests.some(x => x.eventArrival?.eventId === s.eventId && !x.paid && !x.abandoned && x.state !== 'DONE'); if (['failed', 'cancelled'].includes(e?.outcome ?? '') || e?.outcome === 'success' && !queued && !remaining && s.served < (s.ownerAssist ? 1 : config.target))
    return '행사 종료 · 다음 영업에서 재도전'; const left = g.events.active?.eventId === s.eventId ? Math.max(0, Math.ceil(g.events.active.deadline - g.events.now)) : null; return (s.ownerAssist ? '사장 혼자 도전 · 예약 먼저 서빙 · ' : '') + s.served + '/' + (s.ownerAssist ? 1 : config.target) + '팀 결제 · 학습 ' + s.correct + '/' + (s.kind === 'vip' ? 1 : 2) + '개' + (left === null ? '' : ' · 남은 ' + left + '초'); }
