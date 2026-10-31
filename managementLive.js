import { unlocked } from './progressiveFeatures.js';
import { specialPreparationHtml } from './specialPreparationUi.js';
import { strategyCatalog } from './managementEngine.js';
import { specialBusinessCatalog } from './specialBusiness.js';
import { recruitById } from './recruitConfig.js';
import { managementStyles } from './managementUi.js';
import { dispatchDelivery, prepareSpecialBusiness, specialOperationStatus } from './specialBusiness.js';
import { escapeText as esc } from './questionRenderer.js';
let current, flush = () => false, last = '';
export function beginManagementUi(g, save) { document.getElementById('management-live')?.remove(); document.getElementById('delivery-dialog')?.remove(); current = g.mode === 'CAFE_GROWTH' ? g : undefined; flush = save; last = ''; managementStyles(); }
export function pollManagementUi(g) { if (current !== g || !g.management?.run)
    return; const m = g.management, r = m.run; let node = document.getElementById('management-live'); if (g.status === 'CLOSED') {
    node?.remove();
    return;
} if (!node) {
    node = document.createElement('div');
    node.id = 'management-live';
    node.className = 'v25 v25-actions';
    document.getElementById('service-status')?.parentElement?.append(node);
} const key = JSON.stringify([r.paid, r.missionComplete, m.reputation, r.wait, g.stats.soldFood, g.events.arrivals.length, g.guests.filter(x => x.eventArrival?.eventId === r.special?.eventId && !x.paid && !x.abandoned).length, Math.floor(g.events.now), g.stats.correct, g.menus.map(m => [m.menuId, m.stock]), g.service.paid.length, r.special?.inventory?.consumed, r.special?.prepared, r.special?.served, r.special?.correct, r.special?.complete, g.events.records.find(e => e.id === r.special?.eventId)?.outcome, r.delivery?.resolved, m.deliveries.map(d => d.status)]); if (key === last)
    return; last = key; const progress = r.strategy === 'fast' ? r.paid + '/8건' : r.strategy === 'group' ? g.stats.soldFood + '/18개' : r.paid + '/5건 · 평균 대기 ' + (r.paid ? Math.round(r.wait / r.paid) : 0) + '/45초'; const strategy = strategyCatalog.find(x => x.id === r.strategy); const special = r.special && specialBusinessCatalog.find(x => x.id === r.special.kind), event = g.events.records.find(e => e.id === r.special?.eventId); const specialStatus = specialOperationStatus(g); node.innerHTML = '<small><strong>' + strategy.name + '</strong> · ' + progress + ' · 경영 목표 ' + (r.missionComplete ? '달성 ✓' : '진행 중') + ' · 서빙 ' + r.paid + '건 · 평판 ' + m.reputation.toFixed(1) + (r.special ? ' · ' + special.name + ' ' + specialStatus : '') + '</small>' + (r.special ? specialPreparationHtml(g, special.name) : '') + '<button data-delivery>주민 배달 ' + m.deliveries.filter(d => d.status === 'accepted').length + '건</button>'; node.querySelector('[data-delivery]').hidden = !unlocked(g, 'delivery'); node.querySelector('[data-delivery]').onclick = () => openDeliveries(g); node.querySelector('[data-special-ready]')?.addEventListener('click', () => { const previous = structuredClone(g.management.run.special), result = prepareSpecialBusiness(g); if (result.ok && !flush()) {
    g.management.run.special = previous;
    result.reason = '저장하지 못해 준비 상태를 되돌렸어요.';
} let note = node.querySelector('[role=status]'); if (!note) {
    note = document.createElement('small');
    note.setAttribute('role', 'status');
    node.append(note);
} note.textContent = result.reason; last = ''; }); }
function openDeliveries(g) { document.getElementById('delivery-dialog')?.remove(); const d = document.createElement('section'); d.id = 'delivery-dialog'; d.className = 'mode-confirm long-dialog v25'; d.innerHTML = '<div><h2>주민 배달</h2><p>게시판 순서대로 보여요. 음식 재고와 근무 직원의 운반량을 확인하세요. 출발 후 기존 트레이 미니게임에서 배달해요.</p>' + g.management.deliveries.filter(x => x.status === 'accepted').map(x => '<article><strong>' + esc(x.resident) + ' · ' + esc(g.menus.find(m => m.menuId === x.menuId)?.name ?? x.menuId) + ' ' + x.quantity + '개</strong><p>현재 재고 ' + (g.menus.find(m => m.menuId === x.menuId)?.stock ?? 0) + '개</p><select data-courier="' + x.id + '">' + g.service.workers.map(w => '<option value="' + (w.owner ? 'owner' : w.staffId) + '">' + (w.owner ? '사장님' : esc(recruitById(w.staffId ?? '')?.name ?? '직원')) + ' · ' + w.carryCapacity + '개 운반</option>').join('') + '</select><button data-send="' + x.id + '">재고 예약 · 배달 준비</button></article>').join('') + '<p role="status"></p><button data-close>카페로 돌아가기</button></div>'; document.body.append(d); d.querySelector('[data-close]').addEventListener('click', () => d.remove()); d.querySelectorAll('[data-send]').forEach(b => b.onclick = () => { const snapshot = structuredClone({ management: g.management, miniGames: g.miniGames, miniCollection: g.miniCollection, stocks: g.menus.map(m => m.stock) }), id = b.dataset.send, courier = d.querySelector('[data-courier="' + id + '"]').value, result = dispatchDelivery(g, id, courier); if (result.ok && !flush()) {
    g.management = snapshot.management;
    g.miniGames = snapshot.miniGames;
    g.miniCollection = snapshot.miniCollection;
    g.menus.forEach((m, i) => m.stock = snapshot.stocks[i]);
    result.reason = '저장하지 못해 재고 예약을 되돌렸어요. 다른 창과 저장 공간을 확인해 주세요.';
    result.ok = false;
} d.querySelector('[role=status]').textContent = result.reason; if (result.ok) {
    b.disabled = true;
    setTimeout(() => d.remove(), 900);
} }); }
