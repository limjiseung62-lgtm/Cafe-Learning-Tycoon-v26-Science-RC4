import { unlocked } from './progressiveFeatures.js';
import { specializationCatalog, specializationById, specializationRoom } from './specializationConfig.js';
import { canSpecialize, chooseSpecialization, syncSpecialization } from './specialization.js';
import { longStateFor } from './longGrowthUi.js';
import { settleSpecializationCollection } from './longGrowth.js';
import { imageReady } from './imageLoading.js';
const sessions = new WeakMap(), shown = new WeakSet();
export function beginSpecializationUi(g, flush, business) { document.getElementById('specialization-choice')?.remove(); sessions.set(g, { flush, business }); }
export function specializationCards(branch) { return specializationCatalog.filter(s => s.branch === branch).map(s => '<article class="specialization-card"><img loading="lazy" src="' + specializationRoom(s.id) + '" alt="' + s.name + ' 건물과 빈 홀"><h3>' + s.name + '</h3><p>' + s.feature + '</p><dl><dt>고유 이벤트</dt><dd>' + s.events.join(' · ') + '</dd><dt>만나는 손님</dt><dd>' + s.guest + '</dd><dt>오늘의 목표</dt><dd>' + s.operation + '</dd><dt>수집 보상</dt><dd>' + s.reward + ' · ' + s.book + ' · 기념 칭호</dd></dl><button class="primary" data-specialization="' + s.id + '">' + s.name + ' 선택</button></article>').join(''); }
export function openSpecialization(g) { const session = sessions.get(g); if (!session || !canSpecialize(g) || document.getElementById('specialization-choice'))
    return; const d = document.createElement('section'); d.id = 'specialization-choice'; d.className = 'mode-confirm specialization-dialog'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Lv.11 전문화 선택'); document.body.append(d); const compare = () => { d.innerHTML = '<div><h2>우리 가게의 특별한 이야기는?</h2><p>배치와 카페 자산, 공부 기록은 그대로예요. 정답 생산량과 확장 가격도 같아요.</p><div class="specialization-options">' + specializationCards(g.branchId) + '</div><button id="spec-later" class="secondary">나중에 고르기</button></div>'; d.querySelector('#spec-later').addEventListener('click', () => d.remove()); d.querySelectorAll('[data-specialization]').forEach(b => b.onclick = () => { const id = b.dataset.specialization, s = specializationById(id); d.innerHTML = '<div><img class="specialization-confirm" src="' + specializationRoom(id) + '" alt="' + s.name + '"><h2>' + s.name + '로 성장할까요?</h2><p>선택 후에는 바꿀 수 없어요. 배치한 가구는 유지하고 새로운 이야기를 시작해요.</p><button id="spec-back" class="secondary">다시 비교</button><button id="spec-confirm" class="primary">확인 · 전문화 선택</button><p id="spec-error" role="status"></p></div>'; d.querySelector('#spec-back').addEventListener('click', compare); d.querySelector('#spec-confirm').addEventListener('click', () => { if (!chooseSpecialization(g, id))
    return; if (session.flush()) {
    delete document.getElementById('cafe-room')?.dataset.artLevel;
    d.remove();
}
else {
    delete g.specialization;
    d.querySelector('#spec-error').textContent = '저장에 실패해 선택을 취소했어요. 기존 카페는 보존됩니다.';
} }); }); }; compare(); }
export function pollSpecializationUi(g) { if (!unlocked(g, 'specialization'))
    return; const s = sessions.get(g); if (!s || g.mode !== 'CAFE_GROWTH')
    return; let b = document.getElementById('specialization-open'); const tools = document.getElementById('long-tools'); if (!b && tools) {
    b = document.createElement('button');
    b.id = 'specialization-open';
    b.className = 'secondary';
    tools.prepend(b);
} if (b) {
    const spec = g.specialization ? specializationById(g.specialization.selected) : null;
    b.textContent = spec ? spec.name + ' · 수집 기록' : 'Lv.11 전문화 선택';
    b.disabled = !spec && !canSpecialize(g);
    b.onclick = () => spec ? showCollection(g) : openSpecialization(g);
} if (canSpecialize(g) && !shown.has(g)) {
    shown.add(g);
    openSpecialization(g);
} const changed = syncSpecialization(g, s.business()), state = longStateFor(g), awarded = !!state && !!g.specialization && settleSpecializationCollection(state, g.specialization); if (changed || awarded)
    s.flush(); }
function showCollection(g) { const s = g.specialization, c = specializationById(s.selected); document.getElementById('specialization-choice')?.remove(); const d = document.createElement('section'); d.id = 'specialization-choice'; d.className = 'mode-confirm specialization-dialog'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '전문화 수집 기록'); d.innerHTML = '<div><h2>' + c.name + '의 추억</h2><p>' + c.operation + '</p><p>완료한 이야기 ' + s.receipts.filter(r => r.outcome === 'success').length + '회</p><ul>' + [['souvenir', c.reward], ['recipe', c.book], ['title', c.name + '의 친구']].map(([id, name]) => '<li>' + name + ' · ' + (s.collections.includes(id) ? '획득' : '고유 이벤트 성공 시 획득') + '</li>').join('') + '</ul><p>기념품은 중복 지급하지 않아요. 레시피는 수집 기록이며 음식 생산량을 바꾸지 않아요.</p><button id="spec-close" class="secondary">닫기 · 카페로</button></div>'; document.body.append(d); d.querySelector('button').onclick = () => d.remove(); }
export function specializationArt(g) { const id = g.mode === 'CAFE_GROWTH' ? g.specialization?.selected : undefined; return id && imageReady(specializationRoom(id)) ? specializationRoom(id) : undefined; }
