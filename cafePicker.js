import { ensureGrowthWriteLock } from './growthWriteLock.js';
import { createGrowthSave } from './growthSave.js';
import { ensurePortfolio, syncSharedFurniture, portfolioCafes, cafeNames, canSwitchCafe, switchCafe, transferStaff } from './cafePortfolio.js';
import { recruitById } from './recruitConfig.js';
import { escapeText as esc } from './questionRenderer.js';
export async function openCafePicker(repo, done, back) {
    if (!await ensureGrowthWriteLock())
        return;
    const read = repo.read();
    if (read.status !== 'ready' && read.status !== 'empty')
        return;
    let save = read.status === 'ready' ? read.save : createGrowthSave();
    if (!canSwitchCafe(save)) {
        done();
        return;
    }
    const draft = structuredClone(save);
    ensurePortfolio(draft);
    syncSharedFurniture(draft);
    if (JSON.stringify(draft) !== JSON.stringify(save)) {
        if (!repo.write(draft, read.status === 'ready' ? save : undefined).ok)
            return;
        save = draft;
    }
    const root = document.createElement('section');
    root.className = 'v19c-picker';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', '오늘 운영할 카페 선택');
    document.body.append(root);
    function render() {
        root.innerHTML = '<article><p>오늘은 어느 카페를 열까요?</p><h2>운영할 카페 선택</h2><p>선택한 카페만 15분 동안 운영해요. 공부 기록과 마을은 함께 이어져요.</p><div class="v19c-cafe-cards">' + portfolioCafes(save).map(c => '<section><h3>' + cafeNames[c.id] + '</h3><p>Lv.' + c.save.cafeLevel + ' · ' + c.save.money.toLocaleString() + '원</p><p>분기: ' + esc({ garden: '정원', bakery: '베이커리', dessert: '디저트' }[c.save.growthBranch?.active ?? ''] ?? '작은 카페') + ' · 직원 ' + (c.save.roster?.owned.length ?? c.save.staffOwned.length) + '명</p><button data-select-cafe="' + c.id + '">' + (c.id === save.portfolio.activeCafeId ? '이 카페 이어하기' : '이 카페로 전환') + '</button></section>').join('') + (!save.portfolio.founded ? '<section><h3>2호점 · 호숫가 카페</h3><p>마을5단계와 호숫가 핵심 의뢰3개를 완료하면 창업할 수 있어요.</p></section>' : '') + '</div>' + (save.portfolio?.inactive ? '<details><summary>직원 이동 · 영업 전후에만</summary><p>강화 단계 유지 · 이동비 없음 · 이동한 직원은 다시 근무 편성해 주세요. 진행 중인 지원자 공고는 확정 종료해 재추첨을 막아요.</p>' + (save.roster?.owned ?? []).map(o => '<button data-transfer-staff="' + o.id + '">' + esc(recruitById(o.id).name) + ' Lv.' + o.level + ' → 다른 카페로 이동</button>').join('') + '</details>' : '') + '<p id="cafe-picker-message" role="status"></p><button id="cafe-picker-back">마을로 돌아가기</button></article>';
        root.querySelector('#cafe-picker-back').addEventListener('click', () => { root.remove(); back(); });
        root.querySelectorAll('[data-select-cafe]').forEach(b => b.onclick = () => { const id = b.dataset.selectCafe; if (id !== save.portfolio.activeCafeId) {
            const next = structuredClone(save);
            if (!switchCafe(next, id))
                return;
            const result = repo.write(next, save);
            if (!result.ok) {
                root.querySelector('#cafe-picker-message').textContent = result.message;
                return;
            }
            save = next;
        } root.remove(); done(); });
        root.querySelectorAll('[data-transfer-staff]').forEach(b => b.onclick = () => { const id = b.dataset.transferStaff; b.textContent = '이 직원 이동 확정'; b.onclick = () => { const next = structuredClone(save); if (!transferStaff(next, id))
            return; const result = repo.write(next, save); if (result.ok) {
            save = next;
            render();
        }
        else
            root.querySelector('#cafe-picker-message').textContent = result.message; }; });
    }
    render();
}
