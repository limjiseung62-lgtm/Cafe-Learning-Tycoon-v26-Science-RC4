import { unlocked } from './progressiveFeatures.js';
import { branchCatalog, branchPreview, canOfferBranch, isBranch } from './growthBranch.js';
const sessions = new WeakMap();
let deferred = new WeakSet();
// Presentation copy only. Branch IDs, eligibility and persistence remain unchanged.
const branchCopy = {
    garden: { description: '꽃과 햇살이 가득한 자연 속 카페', features: ['온실 지붕', '꽃 아치', '목재 테이블', '테라스'], future: '앞으로 꽃 축제와 특별한 손님을 만날 수 있어요!' },
    bakery: { description: '따뜻한 빵 향기가 퍼지는 아늑한 카페', features: ['박공지붕', '굴뚝', '빵 진열창', '작업대'], future: '앞으로 빵 축제와 장인들의 이야기를 만날 수 있어요!' },
    dessert: { description: '달콤한 디저트를 즐기는 우아한 카페', features: ['유리 돔', '곡선 창문', '쇼케이스', '살롱'], future: '앞으로 특별한 손님과 기념일 주문을 만날 수 있어요!' }
};
function branchCards() { return branchCatalog.map(b => { const copy = branchCopy[b.id]; return '<article class="branch-card"><img loading="lazy" src="' + branchPreview(b.id) + '" alt="' + b.name + ' 건물과 실내"><div class="branch-summary"><h3>' + b.name + '</h3><p>' + copy.description + '</p></div><ul class="branch-features" aria-label="' + b.name + ' 특징">' + copy.features.map(f => '<li>' + f + '</li>').join('') + '</ul><div class="branch-future"><span>Lv.11 전문화에서 만나요</span><p>' + copy.future + '</p></div><button data-branch="' + b.id + '" class="primary">' + b.name + ' 선택</button></article>'; }).join(''); }
export function beginBranchUi(g, base, flush) { document.getElementById('branch-choice')?.remove(); const old = document.getElementById('branch-viewport'); if (old) {
    old.replaceWith(document.getElementById('cafe-room'));
} sessions.set(g, { base, flush }); }
export function pollBranchUi(g) {
    if (!unlocked(g, 'branch'))
        return;
    const s = sessions.get(g);
    if (g.mode !== 'CAFE_GROWTH' || !s)
        return;
    const tools = document.getElementById('long-tools');
    if (g.branchId && tools) {
        let wrapper = document.getElementById('branch-viewport');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'branch-viewport';
            wrapper.className = 'branch-viewport';
            const room = document.getElementById('cafe-room');
            room.before(wrapper);
            wrapper.append(room);
        }
        if (!document.getElementById('branch-zoom')) {
            const zoom = document.createElement('button');
            zoom.id = 'branch-zoom';
            zoom.className = 'secondary';
            zoom.textContent = '카페 확대 · 좌우로 보기';
            zoom.setAttribute('aria-pressed', 'false');
            zoom.onclick = () => { const on = wrapper.classList.toggle('enlarged'); zoom.setAttribute('aria-pressed', String(on)); zoom.textContent = on ? '카페 전체 보기' : '카페 확대 · 좌우로 보기'; };
            tools.prepend(zoom);
        }
    }
    let button = document.getElementById('branch-open');
    if (!button && tools) {
        button = document.createElement('button');
        button.id = 'branch-open';
        button.className = 'secondary';
        tools.prepend(button);
        button.onclick = () => show(g);
    }
    if (button) {
        button.textContent = g.growthBranch ? branchCatalog.find(b => b.id === g.growthBranch.selected).name + (g.growthBranch.active ? '' : ' · 전환 준비 중') : 'Lv.7 가게 선택';
        button.disabled = !!g.growthBranch || !canOfferBranch(s.base, g.cafeLevel, g.status === 'CLOSED');
    }
    if (!g.growthBranch && canOfferBranch(s.base, g.cafeLevel, g.status === 'CLOSED') && !deferred.has(g) && !document.getElementById('branch-choice')) {
        deferred.add(g);
        show(g);
    }
}
function show(g) {
    const s = sessions.get(g);
    if (g.growthBranch || !canOfferBranch(s.base, g.cafeLevel, g.status === 'CLOSED') || document.getElementById('branch-choice'))
        return;
    const dialog = document.createElement('section');
    dialog.id = 'branch-choice';
    dialog.className = 'mode-confirm branch-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Lv.7 성장 분기 선택');
    document.body.append(dialog);
    const compare = () => { dialog.innerHTML = '<div><header class="branch-intro"><h2>어떤 가게를 만들까요?</h2><p>카페 자산과 학습 기록은 그대로 이어져요.</p><p class="branch-fairness">확장 가격과 정답 보상은 같아요.</p></header><div class="branch-options">' + branchCards() + '</div><button id="branch-later" class="secondary">나중에 고르기</button></div>'; dialog.querySelector('#branch-later').onclick = () => dialog.remove(); dialog.querySelectorAll('[data-branch]').forEach(b => b.onclick = () => { const id = b.dataset.branch; if (!isBranch(id))
        return; const info = branchCatalog.find(b => b.id === id); dialog.innerHTML = '<div><img class="branch-confirm-image" src="' + branchPreview(id) + '" alt="' + info.name + '"><h2>' + info.name + '로 정할까요?</h2><p>기존 손님과 서빙이 끝난 뒤 안전하게 새 가게로 바뀌어요. 선택한 가게는 바꿀 수 없으니 천천히 골라 주세요.</p><button id="branch-back" class="secondary">세 가게 다시 비교</button><button id="branch-confirm" class="primary">확인 · 이 가게로 성장하기</button><p id="branch-save-message" role="status"></p></div>'; dialog.querySelector('#branch-back').onclick = compare; dialog.querySelector('#branch-confirm').onclick = () => { if (g.growthBranch)
        return; if (!g.requestBranch(id))
        return; if (s.flush()) {
        dialog.remove();
    }
    else {
        delete g.growthBranch;
        g.updateServiceLayout();
        dialog.querySelector('#branch-save-message').textContent = '저장에 실패했어요. 기존 저장은 유지됩니다. 다시 열어 주세요.';
    } }; }); };
    compare();
    dialog.querySelector('button')?.focus();
}
