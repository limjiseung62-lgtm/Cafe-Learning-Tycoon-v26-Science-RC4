import { unlocked } from './progressiveFeatures.js';
import { recruitById, staffEffect } from './recruitConfig.js';
import { rosterFor, openRecruitment, hireCandidate, assignCrew, recruitCost, syncRosterSave, canManageCrew, recruitmentStatus } from './staffRecruitment.js';
import { recruitPortrait } from './recruitArt.js';
import { ensureGrowthWriteLock, supportsGrowthLock } from './growthWriteLock.js';
import { cafeGrowthBalance } from './modeBalance.js';
import { escapeText as esc } from './questionRenderer.js';
function collectionProgress(r, id, level, pending = 0) { if (!['staff-6', 'staff-11', 'staff-12'].includes(id))
    return ''; const goal = (id === 'staff-12' ? [3, 3, 2, 2, 1] : [5, 5, 4, 4, 3])[level - 1], count = r?.collections[id]?.length ?? 0; return '<small class="crew-progress">기념 기록 ' + count + '/' + goal + (count >= goal ? ' · 칭호 획득' : '') + (pending ? ' · 이번 영업 ' + pending + '개는 자격 정산 후 반영' : '') + (id === 'staff-6' ? ' · 이미 발견한 손님은 새 카드로 세지 않아요.' : '') + '</small>'; }
export function growthStaffPanel(g) { const owned = g.roster?.owned ?? g.service.paid.map(w => ({ id: w.staffId, level: w.level })), active = g.service.paid.map(w => w.staffId); return (g.roster ? '' : '<p>이전 영업을 복구했어요. 고유 능력은 다음 영업부터 활성화돼요.</p>') + '<p>근무 ' + active.length + '명 / 최대 ' + g.staffLimit + '명 · 대기 ' + (owned.length - active.length) + '명</p><section class="crew-help"><h3>직원은 어떻게 고용하나요?</h3><p>① 15분 영업을 마쳐요 → ② 영업 준비 화면의 직원 구인·근무 편성을 열어요 → ③ 무료 공고를 내고 후보 중 한 명을 채용해요.</p><button disabled class="secondary">영업 종료 후 구인 가능</button><p>지금은 영업 중이라 채용·교대를 할 수 없어요. 첫 채용은 4,000원이 필요하고, 공고는 무료예요. 대기 직원은 서빙과 능력에 참여하지 않아요.</p></section><div class="crew-grid">' + owned.map(o => { const d = recruitById(o.id), w = g.service.paid.find(w => w.staffId === o.id), level = w?.level ?? o.level, cost = w ? g.getStaffUpgradeCost(o.id) : null; return '<article class="crew-card">' + recruitPortrait(o.id) + '<h3>' + d.name + ' · Lv.' + level + '</h3><span>' + d.grade + ' · ' + (w ? '근무 중' : '대기 중') + '</span><strong>' + d.ability + '</strong><p>' + staffEffect(o.id, level) + '</p>' + collectionProgress(g.roster, o.id, level, g.staffAbilities.run?.pending[o.id]?.length ?? 0) + (cost !== null ? '<button class="secondary" data-buy="staff-upgrade" data-staff="' + o.id + '" ' + (g.money < cost ? 'disabled' : '') + '>' + d.name + ' 강화 · ' + cost.toLocaleString() + '원</button>' : '<p>' + (level === 5 ? '최고 강화 단계' : '영업 전·후에 강화할 수 있어요.') + '</p>') + '</article>'; }).join('') + '</div><p class="hint">직원 추가 현금은 자격 영업 정산 때 합계 매출의 1% · 최대 1,500원 이내로 지급해요.</p>'; }
export async function openCrewDialog(repo, initial, onClose) {
    if (!unlocked(initial, 'recruitment'))
        return;
    document.getElementById('recruit-dialog')?.remove();
    const dialog = document.createElement('section');
    dialog.id = 'recruit-dialog';
    dialog.className = 'mode-confirm crew-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '직원 구인과 근무 편성');
    document.body.append(dialog);
    if (!supportsGrowthLock() || !await ensureGrowthWriteLock()) {
        dialog.innerHTML = '<div><h2>직원 저장을 확인해 주세요</h2><p>' + (supportsGrowthLock() ? '다른 창에서 카페를 운영하고 있어요. 그 창에서 모드 선택으로 돌아가거나 창을 닫은 뒤 다시 열어 주세요.' : '이 기능은 저장 충돌 방지를 위해 Web Locks를 지원하는 최신 브라우저의 HTTPS 또는 localhost 접속이 필요해요.') + '</p><button id="crew-close">닫기</button></div>';
        dialog.querySelector('#crew-close').onclick = () => dialog.remove();
        return;
    }
    let save = structuredClone(initial), message = '', confirmation = null;
    const read = repo.read();
    if (read.status === 'ready')
        save = read.save;
    if (!canManageCrew(save)) {
        dialog.innerHTML = '<div><h2>중단한 영업을 먼저 마쳐 주세요</h2><p>채용·교대는 영업 전·후에만 가능해요. 원래 종료 시각은 유지돼요.</p><button id="crew-close">닫기</button></div>';
        dialog.querySelector('#crew-close').onclick = () => dialog.remove();
        return;
    }
    const persist = (change) => { const current = repo.read(); if (current.status === 'ready' && JSON.stringify(current.save) !== JSON.stringify(save)) {
        message = '다른 곳에서 저장이 바뀌었어요. 닫은 뒤 다시 열어 주세요.';
        return false;
    } const next = structuredClone(save); next.roster ??= rosterFor(next); if (!change(next))
        return false; next.updatedAt = new Date().toISOString(); syncRosterSave(next); const result = repo.write(next, save); if (!result.ok) {
        message = result.message;
        return false;
    } save = next; return true; };
    if (!save.roster && !persist(() => true)) {
        dialog.innerHTML = '<div><h2>기존 카페를 보존했어요</h2><p>' + esc(message) + '</p><button id="crew-close">닫기</button></div>';
        dialog.querySelector('#crew-close').onclick = () => dialog.remove();
        return;
    }
    const render = () => {
        const r = save.roster, cost = recruitCost(save), limit = cafeGrowthBalance.staff.limits[save.cafeLevel - 1], availability = recruitmentStatus(save);
        dialog.innerHTML = '<div><header class="crew-header"><h2>함께 일할 친구들</h2><button id="crew-close" class="secondary">닫기 · 카페로</button></header><p>보유금 ' + save.money.toLocaleString() + '원 · 보유 ' + r.owned.length + '/12명 · 근무 ' + r.active.length + '/' + limit + '명</p><section class="crew-help"><h3>직원 채용, 이렇게 해요</h3><ol><li>영업 전·후에 무료 구인 공고를 내요.</li><li>서로 다른 지원자 최대 3명의 능력과 비용을 비교해요.</li><li>한 명을 선택하고 채용을 확정해요. 채용한 직원은 근무 편성에서 확인해요.</li></ol><p>후보는 다시 열어도 바뀌지 않아요. 포기해도 다음 공고 기회까지 기다려야 해요.</p></section><p class="crew-message" role="status">' + esc(message) + '</p>' + (confirmation ? '<div class="crew-confirm"><h3>' + recruitById(confirmation).name + '를 채용할까요?</h3><p>채용비 ' + cost?.toLocaleString() + '원 · ' + (r.active.length >= limit ? '지금은 대기 직원으로 합류해요. 아래에서 근무 직원을 교대할 수 있어요.' : '다음 영업부터 함께 서빙해요.') + '</p><button id="crew-cancel" class="secondary">다시 비교</button><button id="crew-hire" class="primary">확인 · 채용하기</button></div>' : '') + '<section><h3>새로운 동료 찾기</h3>' + (r.offer && !r.offer.closed ? '<div class="candidate-grid">' + r.offer.ids.map(id => { const d = recruitById(id); return '<article class="crew-card">' + recruitPortrait(id) + '<h3>' + d.name + '</h3><span>' + d.grade + '</span><strong>' + d.ability + '</strong><p>' + d.description + '</p><p>' + staffEffect(id, 1) + '</p><b>채용비 ' + cost?.toLocaleString() + '원</b>' + (cost !== null && save.money < cost ? '<p class="crew-money-needed">' + (cost - save.money).toLocaleString() + '원 더 모으면 채용할 수 있어요. 공고 후보는 그대로 기다려요.</p>' : '') + '<button data-candidate="' + id + '" class="primary" ' + (cost === null || save.money < cost ? 'disabled' : '') + '>' + d.name + ' 채용 선택</button></article>'; }).join('') + '</div><button id="crew-abandon" class="secondary">이번 공고 포기</button>' : '<button id="crew-offer" class="primary" ' + (!availability.canPost ? 'disabled' : '') + '>무료 구인 공고 내기</button><p id="crew-offer-reason" role="status">' + esc(availability.reason) + '</p>') + '</section><h3>근무·대기 직원</h3><p>기존 직원을 해고하지 않아요. 근무 칸이 가득 차면 한 명을 먼저 대기로 바꿔 주세요.</p><div class="crew-grid">' + r.owned.map(o => { const d = recruitById(o.id), working = r.active.includes(o.id), upgrade = o.level < 5 ? cafeGrowthBalance.staff.upgradeCosts[o.level - 1] : null; return '<article class="crew-card">' + recruitPortrait(o.id) + '<h3>' + d.name + ' · Lv.' + o.level + '</h3><span>' + d.grade + ' · ' + (working ? '근무 예정' : '대기 중') + '</span><strong>' + d.ability + '</strong><p>' + staffEffect(o.id, o.level) + '</p>' + collectionProgress(r, o.id, o.level) + '<button data-assign="' + o.id + '" class="secondary" ' + (!working && r.active.length >= limit ? 'disabled' : '') + '>' + d.name + (working ? ' 대기로' : ' 근무로') + '</button>' + (upgrade !== null ? '<button data-crew-upgrade="' + o.id + '" class="secondary" ' + (save.money < upgrade ? 'disabled' : '') + '>' + d.name + ' 강화 · ' + upgrade.toLocaleString() + '원</button>' : '<p>최고 강화 단계</p>') + '</article>'; }).join('') + '</div><p>성장 분기와 관계없이 모든 직원을 만날 수 있어요. 등급은 기본 서빙 능력에 영향을 주지 않아요.</p><p>기념 칭호 ' + r.titles.map(esc).join(' · ') + '</p></div>';
        dialog.querySelector('#crew-close').onclick = () => { dialog.remove(); onClose(); };
        dialog.querySelector('#crew-offer')?.addEventListener('click', () => { message = persist(openRecruitment) ? '지원자 명단을 저장했어요.' : message || '다음 자격 영업을 마친 뒤 새 공고를 낼 수 있어요.'; render(); });
        dialog.querySelector('#crew-abandon')?.addEventListener('click', () => { confirmation = null; dialog.querySelector('.crew-confirm')?.remove(); const box = document.createElement('div'); box.className = 'crew-confirm'; box.innerHTML = '<p>이번 후보를 포기할까요? 다음 자격 영업 전에는 새 후보가 나오지 않아요.</p><button id="crew-abandon-no">취소</button><button id="crew-abandon-yes">확인 · 포기</button>'; dialog.querySelector('header').after(box); dialog.firstElementChild.scrollTop = 0; box.querySelector('#crew-abandon-no').onclick = () => { confirmation = null; render(); }; box.querySelector('#crew-abandon-yes').onclick = () => { persist(n => { n.roster.offer.closed = true; return true; }); confirmation = null; render(); }; });
        dialog.querySelectorAll('[data-candidate]').forEach(b => b.onclick = () => { confirmation = b.dataset.candidate; render(); });
        dialog.querySelector('#crew-cancel')?.addEventListener('click', () => { confirmation = null; render(); });
        dialog.querySelector('#crew-hire')?.addEventListener('click', () => { const id = confirmation; message = persist(n => hireCandidate(n, id)) ? recruitById(id).name + '가 합류했어요!' : message || '잔액과 지원자 명단을 확인해 주세요.'; confirmation = null; render(); });
        dialog.querySelectorAll('[data-assign]').forEach(b => b.onclick = () => { const id = b.dataset.assign; message = persist(n => assignCrew(n, n.roster.active.includes(id) ? n.roster.active.filter(x => x !== id) : [...n.roster.active, id])) ? '다음 영업 근무를 저장했어요.' : message || '근무 인원을 확인해 주세요.'; render(); });
        dialog.querySelectorAll('[data-crew-upgrade]').forEach(b => b.onclick = () => { const id = b.dataset.crewUpgrade; message = persist(n => { const o = n.roster.owned.find(o => o.id === id); const price = cafeGrowthBalance.staff.upgradeCosts[o.level - 1]; if (o.level >= 5 || n.money < price)
            return false; n.money -= price; o.level++; return true; }) ? '강화 단계를 저장했어요.' : message; render(); });
    };
    render();
}
