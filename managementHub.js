import { unlocked } from './progressiveFeatures.js';
import { regularGuestName } from './managementReview.js';
import { menuDefinitions } from './data.js';
import { recruitPortrait } from './recruitArt.js';
import { educateStaff, educationThresholds, educationEffect } from './staffEducation.js';
import { recruitCatalog } from './recruitConfig.js';
import { syncManagementAlbum } from './managementAlbum.js';
import { managementAlbumHtml } from './managementAlbumUi.js';
import { specialBusinessCatalog, planSpecialBusiness, prepareDeliveryOffers, acceptDelivery, retryDelivery, moveDelivery } from './specialBusiness.js';
import { openVillage } from './villageUi.js';
import { managementFor } from './managementState.js';
import { managementStyles } from './managementUi.js';
import { escapeText as esc } from './questionRenderer.js';
import { ensureGrowthWriteLock } from './growthWriteLock.js';
import { sprite } from './art.js';
import { researchRecipes, researchBrief, researchFeedback, materialNames, selectRecipe, combineRecipe, prototypeRecipe, tasteRecipe, registerRecipe, syncResearchMenus } from './menuResearch.js';
export async function openManagementHub(repo, fallback, onClose, initialTab = 'reviews') {
    managementStyles();
    const loaded = repo.read();
    let base = loaded.status === 'ready' ? loaded.save : structuredClone(fallback), tab = initialTab, message = '', editing = false;
    if (!unlocked(base, 'reviews') || base.campaign?.run && !base.campaign.run.closed)
        return;
    if (base.v26)
        managementFor(base).progressiveLevel = base.cafeLevel;
    const d = document.createElement('section');
    d.className = 'mode-confirm long-dialog v25';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', '카페 경영실');
    const edit = async (fn) => { if (editing)
        return; editing = true; try {
        if (!await ensureGrowthWriteLock()) {
            message = '다른 카페 창을 먼저 닫아 주세요.';
            render();
            return;
        }
        const next = structuredClone(base);
        if (!fn(next)) {
            message = '재료·단계·카페 조건을 확인해 주세요.';
            render();
            return;
        }
        syncResearchMenus(next);
        syncManagementAlbum(next);
        const result = repo.write(next, base);
        if (result.ok) {
            base = next;
            message = '저장 완료 ✓';
        }
        else
            message = result.message;
        render();
    }
    finally {
        editing = false;
    } };
    const render = () => {
        const m = managementFor(structuredClone(base));
        let body = '';
        if (tab === 'reviews')
            body = '<h3>평판 ' + m.reputation.toFixed(1) + ' / 100</h3><p>실제 대기·서빙·특별 주문·인테리어 경험이에요. 문제 정답률과는 별개예요.</p>' + (m.reviews.length ? m.reviews.slice().reverse().map(r => '<article><strong>' + esc(r.guest) + ' · ' + r.stars + '점</strong><p>' + esc(r.text) + '</p><small>' + esc(r.reason) + '</small></article>').join('') : '<p>첫 손님을 대접하면 리뷰가 쌓여요.</p>') + '<h3>단골 수첩</h3>' + Object.entries(m.regulars).map(([id, r]) => '<p>' + esc(regularGuestName(id)) + ' · ' + r.visits + '회 · ' + (r.loyal ? '단골 · 기념 꽃씨 받음' : '세 번 이상 방문하고 좋은 서비스를 받으면 단골이 돼요') + '</p>').join('');
        if (tab === 'lab') {
            const materialOptions = Object.entries(materialNames).map(([id, name]) => '<option value="' + id + '">' + name + '</option>').join('');
            body = '<h3>신메뉴 연구소</h3><p>' + Object.entries(m.materials).map(([id, n]) => materialNames[id] + ' ' + n).join(' · ') + '</p><p>서빙 5건마다 전략 재료를 얻어요. 조합·시제품·시식 후 등록해요. 추가 구매비는 없어요.</p><div class="v25-grid">' + researchRecipes.map(recipe => { const r = m.research[recipe.id], id = recipe.id; return '<article>' + sprite(recipe.visual) + '<h3>' + recipe.name + '</h3><p>' + researchBrief[id] + '</p><small>카페 Lv.' + recipe.level + ' · 재료 2종을 골라요</small><details><summary>연구 노트 · 힌트 보기</summary><p>' + recipe.description + '</p><p>' + recipe.ingredients.map(i => materialNames[i]).join(' + ') + '</p></details>' + (base.cafeLevel < recipe.level ? '<p>카페 성장 후 연구할 수 있어요.</p>' : !r ? '<button data-select="' + id + '">레시피 선택</button>' : r.stage === 'registered' ? '<p>메뉴 등록 완료 ✓<br>다음 영업부터 실제 주문과 정답 생산에 참여해요.</p>' : r.stage === 'selected' ? '<label>첫 재료<select data-first="' + id + '">' + materialOptions + '</select></label><label>둘째 재료<select data-second="' + id + '">' + materialOptions + '</select></label><button data-combine="' + id + '">재료 조합</button>' : '<p>진행: ' + ({ combined: '조합 완료', prototype: '시제품 제작', tasted: '시식 완료', selected: '선택', registered: '등록' }[r.stage]) + (r.stage === 'combined' ? '' : r.stage === 'prototype' ? ' · 시식 평가 대기' : ' · 시식 점수 ' + r.rating + '/5') + '</p>' + (r.stage === 'tasted' ? '<p class="research-feedback">' + researchFeedback(m, id) + '</p>' : '') + (r.attempts?.length ? '<small>최근 실험: ' + (r.stage === 'prototype' ? r.attempts.slice(0, -1) : r.attempts).map(a => ({ 1: '차갑게', 2: '부드럽게', 3: '바삭하게' }[a.heat]) + ' ' + a.rating + '점').join(' → ') + '</small>' : '') + '<label>만드는 방법<select data-heat="' + id + '"><option value="1">차갑게 섞기</option><option value="2">부드럽게 익히기</option><option value="3">바삭하게 굽기</option></select></label><button data-prototype="' + id + '">시제품 ' + (r.stage === 'combined' ? '만들기' : '다시 만들기') + '</button>' + (r.stage === 'prototype' ? '<button data-taste="' + id + '">손님 시식 평가</button>' : '') + (r.stage === 'tasted' ? '<button data-register="' + id + '" ' + (r.rating < 4 ? 'disabled' : '') + '>새 메뉴 등록</button>' : '') + (r.stage === 'tasted' && r.rating < 4 ? '<p>레시피의 만드는 방법을 다시 살펴보세요. 재료를 더 쓰지 않고 시제품을 고칠 수 있어요.</p>' : '')) + '</article>'; }).join('') + '</div>';
        }
        if (tab === 'business')
            body = '<h3>특별 영업 예약</h3><p>다음 영업에 한 가지 행사를 예약해요. 재고를 준비한 뒤 직접 손님을 맞이해요. 학습과 예약 손님의 실제 결제를 모두 완료해야 성공해요. 행사 중에는 예약 손님 주문부터 준비해요. 재고가 부족하면 음식 만들기로 보충하세요. 실패해도 벌금은 없고 다음 영업에 다시 예약할 수 있어요. 추가 현금 보상은 없어요.</p><div class="v25-grid">' + specialBusinessCatalog.map(x => '<article><h3>' + x.name + '</h3><p>' + (x.id === 'birthday' ? '생일 손님을 대접하고 문제 2개를 맞혀요.' : x.description) + '</p><small>카페 Lv.' + x.level + (x.id === 'festival' ? ' · 마을 2단계' : '') + ' · 직원 0명: 목표 1팀·최대 5분·대기 +90초·예약 먼저 수동서빙 / 근무 1명 이상: 최대 3분 30초</small><button data-plan="' + x.id + '" ' + (base.cafeLevel < x.level || x.id === 'festival' && (base.village?.progression?.stage ?? 1) < 2 ? 'disabled' : '') + '>' + (m.specialPlan === x.id ? '예약됨 ✓' : '다음 영업 예약') + '</button></article>').join('') + '</div><h3>주민 배달 게시판</h3><p>수락한 주문은 영업 중 배달 버튼에서 직원을 골라 출발해요. 재고를 예약한 뒤 학습 문제와 트레이 배달을 진행해요. 한 영업에 1건이며, 실패하면 예약한 음식은 돌아오지 않아요.</p><button data-offers>새 의뢰 확인</button><button data-map>마을 지도에서 목적지 살펴보기</button>' + m.deliveries.map((x, i) => '<article><strong>' + esc(x.resident) + ' · ' + ({ flowers: '꽃집', market: '시장', mill: '제분소', plaza: '중앙 광장' }[x.destination] ?? esc(x.destination)) + '</strong><p>' + esc(menuDefinitions.find(n => n.menuId === x.menuId)?.name ?? researchRecipes.find(n => n.id === x.menuId)?.name ?? x.menuId) + ' ' + x.quantity + '개 · ' + ({ offered: '수락 가능', accepted: '배달 대기', delivered: '배달 완료', missed: '다음에 다시 도전' }[x.status]) + '</p>' + (x.status === 'offered' ? '<button data-accept="' + x.id + '">수락</button>' : '') + (x.status === 'missed' ? '<button data-retry-delivery="' + x.id + '">다음 영업에서 재도전</button>' : '') + '<button data-up="' + x.id + '" ' + (!i ? 'disabled' : '') + '>우선순위 올리기</button><button data-down="' + x.id + '" ' + (i === m.deliveries.length - 1 ? 'disabled' : '') + '>아래로</button></article>').join('');
        if (tab === 'training')
            body = '<h3>직원 교육실</h3><p>실제 담당 서빙 5·12·22건을 채우면 교육할 수 있어요. 새 능력 대신 기존 능력만 조금 성장해요. 대기 직원은 경험을 얻지 않아요. 비용은 없고, 기존 팁 상한도 같아요.</p><div class="v25-grid">' + recruitCatalog.filter(x => base.roster?.owned.some(w => w.id === x.staffId)).map(x => { const t = m.training[x.staffId]; return '<article>' + recruitPortrait(x.staffId) + '<h3>' + x.name + ' · ' + x.ability + '</h3><p>' + x.description + '</p><p>교육 ' + (t?.level ?? 0) + '/3 · 담당 서빙 ' + (t?.progress ?? 0) + '건</p><p>' + educationEffect(x.staffId, t?.level ?? 0) + '</p><small>' + ((t?.level ?? 0) >= 3 ? '교육 배지 3개 완성' : educationThresholds[t?.level ?? 0] + '건이 되면 다음 교육') + '</small><button data-train="' + x.staffId + '" ' + (!t || t.level >= 3 || t.progress < educationThresholds[t.level] ? 'disabled' : '') + '>능력 교육 · 기념 배지</button><p>' + esc(t?.badges.length ? '배웠으니 더 정성껏 도와드릴게요!' : '먼저 함께 서빙하며 경험을 쌓아요.') + '</p></article>'; }).join('') + '</div>';
        if (tab === 'album')
            body = managementAlbumHtml(base);
        d.innerHTML = '<div><div class="collection-head"><h2>카페 경영실</h2><button class="secondary" data-close>닫기 · 카페로</button></div><nav class="v25-actions"><button data-tab="reviews">평판·리뷰</button><button data-tab="lab">신메뉴 연구소</button><button data-tab="business">특별 영업·배달</button><button data-tab="training">직원 교육</button><button data-tab="album">통합 성장 앨범</button></nav>' + body + '<p role="status">' + esc(message) + '</p></div>';
        d.querySelector('[data-close]').addEventListener('click', () => { d.remove(); onClose(); });
        const features = { reviews: 'reviews', lab: 'research', business: 'specialBusiness', training: 'education', album: 'landmark' };
        d.querySelectorAll('[data-tab]').forEach(b => { b.hidden = !unlocked(base, features[b.dataset.tab]); b.onclick = () => { if (!unlocked(base, features[b.dataset.tab]))
            return; tab = b.dataset.tab; message = ''; render(); }; });
        const bind = (name, fn) => d.querySelectorAll('[data-' + name + ']').forEach(b => b.onclick = () => { void edit(s => fn(s, b.getAttribute('data-' + name))); });
        bind('train', educateStaff);
        bind('plan', (s, id) => planSpecialBusiness(s, id, true));
        bind('accept', acceptDelivery);
        bind('retry-delivery', retryDelivery);
        bind('up', (s, id) => moveDelivery(s, id, -1));
        bind('down', (s, id) => moveDelivery(s, id, 1));
        d.querySelector('[data-offers]')?.addEventListener('click', () => { void edit(prepareDeliveryOffers); });
        d.querySelector('[data-map]')?.addEventListener('click', () => { d.remove(); openVillage(repo, onClose, onClose); });
        bind('select', (s, id) => selectRecipe(managementFor(s), id, s.cafeLevel));
        bind('combine', (s, id) => combineRecipe(managementFor(s), id, [d.querySelector('[data-first="' + id + '"]').value, d.querySelector('[data-second="' + id + '"]').value]));
        bind('prototype', (s, id) => prototypeRecipe(managementFor(s), id, Number(d.querySelector('[data-heat="' + id + '"]').value)));
        bind('taste', (s, id) => tasteRecipe(managementFor(s), id));
        bind('register', (s, id) => registerRecipe(managementFor(s), id));
    };
    document.body.append(d);
    render();
}
