import { orderBase, rushMaxScore, editCake, selectRushOrder, submitCake, rushStats } from './cakeRush.js';
import { imageReady } from './imageLoading.js';
import { cakeRushFrames as atlas } from './cakeRushFrames.js';
import { miniArt, refreshMiniArt } from './miniArt.js';
export const rushAtlas = 'assets/web/cake-rush/ingredients.webp';
export const rushNames = { vanilla: '바닐라', strawberry: '딸기', cocoa: '초코', white: '생크림', pink: '딸기크림', chocolate: '초콜릿', blueberry: '블루베리', heart: '하트', star: '별' };
const diffs = { easy: '쉬움', normal: '보통', challenge: '도전' };
let sound = () => { };
export function setRushSound(fn) { sound = fn; }
function artStyle(i) { const f = atlas.frames[i]; return `background-image:url(${rushAtlas});background-size:${atlas.width / f.w * 100}% ${atlas.height / f.h * 100}%;background-position:${f.x / (atlas.width - f.w) * 100}% ${f.y / (atlas.height - f.h) * 100}%;aspect-ratio:${f.w}/${f.h};`; }
function art(i, name) { return `<span class="rush-art ${imageReady(rushAtlas) ? 'ready' : ''}" data-rush-art="${i}" role="img" aria-label="${name}" style="${imageReady(rushAtlas) ? artStyle(i) : ''}"><span>${name}</span></span>`; }
export function refreshRushArt(root) { if (imageReady(rushAtlas))
    for (const n of root.querySelectorAll('[data-rush-art]')) {
        n.style.cssText = artStyle(Number(n.dataset.rushArt));
        n.classList.add('ready');
    } refreshMiniArt(root); }
function ingredient(f) { return f === 'strawberry' ? miniArt(4, '딸기') : f === 'chocolate' ? miniArt(6, '초콜릿') : art(6, '블루베리'); }
export function cakePicture(d, interactive = false) { return `<div class="rush-cake ${interactive ? 'editing' : ''}">${d.sheet ? '<div class="rush-sheet">' + art(({ vanilla: 0, strawberry: 1, cocoa: 2 })[d.sheet], rushNames[d.sheet] + ' 시트') + '</div>' : '<span class="cake-empty">시트를 골라 주세요</span>'}${d.cream ? '<div class="rush-cream">' + art(({ white: 3, cocoa: 4, pink: 5 })[d.cream], rushNames[d.cream]) + '</div>' : ''}<div class="rush-fruit-grid">${d.fruits.map((f, i) => interactive ? `<button data-rush-pos="${i}" aria-label="토핑 ${i + 1}번 자리 ${f ? rushNames[f] : '빈 자리'}">${f ? ingredient(f) : '<span aria-hidden="true">＋</span>'}</button>` : `<span>${f ? ingredient(f) : ''}</span>`).join('')}</div>${d.ornament ? '<div class="rush-ornament">' + art(d.ornament === 'heart' ? 8 : 9, rushNames[d.ornament] + ' 장식') + '</div>' : ''}</div>`; }
function targetCake(o) { const r = o.recipe; return cakePicture({ sheet: r.sheet, cream: r.cream, fruits: Array.from({ length: 6 }, (_, i) => r.conditions >= 3 && i < r.count ? r.fruit : null), ornament: r.conditions >= 4 ? r.ornament : null }); }
function recipeText(o) { const r = o.recipe; return `${rushNames[r.sheet]} 시트 · ${rushNames[r.cream]}${r.conditions >= 3 ? ' · ' + rushNames[r.fruit] + ' ' + r.count + '개' : ''}${r.conditions >= 4 ? ' · ' + rushNames[r.ornament] + ' 장식' : ''}`; }
const ui = new WeakMap();
export function rushStyles() { if (!document.getElementById('rush-style')) {
    const l = document.createElement('link');
    l.id = 'rush-style';
    l.rel = 'stylesheet';
    l.href = 'cake-rush.css?v=topping-spacing-2';
    document.head.append(l);
} }
export function renderRush(root, s, action, exit, records = {}, cafe = true) {
    rushStyles();
    root.classList.add('rush-root');
    let prefs = ui.get(root);
    if (!prefs) {
        prefs = { stage: 'sheet', fruit: 'strawberry', lastEffect: 0 };
        ui.set(root, prefs);
    }
    const state = prefs, stats = rushStats(s), o = s.queue.find(o => o.id === s.selected), last = s.history.at(-1), fresh = s.history.length > state.lastEffect;
    state.lastEffect = s.history.length;
    if (fresh && last?.outcome === 'missed')
        sound('wrong');
    root.innerHTML = `<article class="rush-shell"><header><div><p class="rush-kicker">CAKE RUSH · ${diffs[s.difficulty]}</p><h2>케이크 주문 폭주!</h2></div><button id="rush-exit">${s.endedAt !== undefined ? (cafe ? '카페로 돌아가기' : '연습 화면으로') : '그만하기'}</button></header><div class="rush-status"><strong><b id="rush-seconds">${Math.max(0, Math.ceil((s.startedAt + s.duration * 1000 - Date.now()) / 1000))}</b>초</strong><span>점수 <b>${stats.score}</b></span><span>정확 ${stats.exact}개</span><span>${stats.combo}연속</span></div>${s.endedAt !== undefined ? `<section class="rush-result"><div class="rush-rating" aria-label="별 ${stats.stars}개">${'★'.repeat(stats.stars)}${'☆'.repeat(3 - stats.stars)}</div><h3>오늘의 케이크 기록</h3><dl><div><dt>처리한 주문</dt><dd>${stats.processed}개</dd></div><div><dt>정확한 주문</dt><dd>${stats.exact}개</dd></div><div><dt>주문 정확도</dt><dd>${stats.processed ? stats.accuracy + '%' : '미완성'}</dd></div><div><dt>최고 연속 성공</dt><dd>${stats.bestCombo}개</dd></div><div><dt>최종 점수</dt><dd>${stats.score}</dd></div><div><dt>내 최고 점수</dt><dd>${Math.max(records[s.difficulty]?.best ?? 0, stats.score)}</dd></div></dl><p>${cafe ? (stats.exact ? '축하 케이크 리본 · 첫 성공 때 장식으로 보관해요.' : '카페 자산은 그대로예요. 다음 영업에서 다시 도전해요.') : '연습 기록이에요. 카페 보상과 학습 성적에는 반영하지 않아요.'}</p><button id="rush-return" class="rush-primary">${cafe ? '카페로 돌아가기' : '다시 도전 준비'}</button></section>` : `<p class="rush-help">주문을 골라 만들어요. <b>정확함이 가장 중요해요!</b> 재료는 고칠 수 있어요.</p><nav class="rush-orders" aria-label="주문 대기열">${s.queue.map(order => `<button data-rush-order="${order.id}" aria-pressed="${order.id === s.selected}"><span class="rush-order-title">주문 ${order.id + 1} <b data-rush-time="${order.id}"></b></span>${targetCake(order)}<span class="rush-recipe">${recipeText(order)}</span><small>정확 성공 ${orderBase(order.recipe.conditions).toLocaleString()}점 + 보너스</small></button>`).join('')}</nav><p class="rush-reaction ${last?.outcome ?? ''}" role="status">${fresh && last?.outcome === 'exact' ? '<span class="rush-spark" aria-hidden="true">✦ ✧ ✦</span>' : ''}${last ? (last.outcome === 'exact' ? '반짝! 주문 성공 · +' + last.points + '점' : last.outcome === 'partial' ? '조금 아쉬워요 · +' + last.points + '점 · 다음 주문에서 만회해요!' : '주문 시간이 끝났어요. 다음 주문에 집중해요!') : '어떤 주문부터 만들까요? 쉽거나 급한 주문을 골라요.'}</p>${o ? `<section class="rush-workbench"><div class="rush-preview"><p>만드는 중 · 주문 ${o.id + 1}</p>${cakePicture(o.draft, state.stage === 'fruit')}<p class="rush-current">${recipeText(o)}</p></div><div class="rush-tools"><nav class="rush-steps" aria-label="제작 단계">${[['sheet', '시트'], ['cream', '크림'], ['fruit', '토핑'], ['ornament', '장식']].map(([id, n]) => `<button data-rush-stage="${id}" aria-pressed="${state.stage === id}">${n}</button>`).join('')}</nav><div class="rush-palette">${state.stage === 'sheet' ? ['vanilla', 'strawberry', 'cocoa'].map((v, i) => `<button data-rush-field="sheet" data-rush-value="${v}" aria-pressed="${o.draft.sheet === v}">${art(i, rushNames[v])}<span>${rushNames[v]}</span></button>`).join('') : state.stage === 'cream' ? ['white', 'cocoa', 'pink'].map((v, i) => `<button data-rush-field="cream" data-rush-value="${v}" aria-pressed="${o.draft.cream === v}">${art(3 + i, rushNames[v])}<span>${rushNames[v]}</span></button>`).join('') : state.stage === 'fruit' ? ['strawberry', 'chocolate', 'blueberry'].map(v => `<button draggable="true" data-rush-fruit="${v}" aria-pressed="${state.fruit === v}">${ingredient(v)}<span>${rushNames[v]}</span></button>`).join('') : ['heart', 'star'].map((v, i) => `<button data-rush-field="ornament" data-rush-value="${v}" aria-pressed="${o.draft.ornament === v}">${art(8 + i, rushNames[v])}<span>${rushNames[v]}</span></button>`).join('')}${state.stage === 'fruit' ? '<button data-rush-erase>토핑 지우개</button>' : state.stage === 'ornament' ? '<button data-rush-field="ornament" data-rush-value="">장식 빼기</button>' : ''}</div><p class="rush-stage-hint">${state.stage === 'fruit' ? (o.recipe.conditions < 3 ? '이 주문은 토핑 없이 완성할 수 있어요. 더 꾸며도 점수는 같아요.' : '토핑을 고르고 케이크의 ＋ 자리를 눌러요. 끌어서 놓아도 돼요.') : state.stage === 'ornament' ? '장식 조건이 없는 주문은 생략해도 좋아요.' : '원하는 재료를 골라요. 단계 버튼으로 다시 고칠 수 있어요.'}</p><div class="rush-submit-row"><button id="rush-clear">처음부터 수정</button><button id="rush-submit" class="rush-primary">주문 완성!</button></div></div></section>` : ''}<p class="rush-footnote">최대 9주문 · ${rushMaxScore(s.difficulty).toLocaleString()}점 · ${cafe ? '영업·손님 대기 멈춤' : '연습 모드'} · 새로고침해도 제한시간은 같아요.</p>`}</article>`;
    root.querySelector('#rush-exit').addEventListener('click', exit);
    root.querySelector('#rush-return')?.addEventListener('click', exit);
    const redraw = () => renderRush(root, s, action, exit, records, cafe);
    root.querySelectorAll('[data-rush-order]').forEach(b => b.onclick = () => action(() => selectRushOrder(s, Number(b.dataset.rushOrder), Date.now())));
    root.querySelectorAll('[data-rush-stage]').forEach(b => b.onclick = () => { state.stage = b.dataset.rushStage; sound('panel'); redraw(); });
    root.querySelectorAll('[data-rush-field]').forEach(b => b.onclick = () => { const field = b.dataset.rushField; if (field === 'sheet')
        state.stage = 'cream';
    else if (field === 'cream')
        state.stage = 'fruit'; sound(field === 'cream' ? 'production' : 'pickup'); action(() => editCake(s, field, b.dataset.rushValue || null, Date.now())); });
    root.querySelectorAll('[data-rush-fruit]').forEach(b => { b.onclick = () => { state.fruit = b.dataset.rushFruit; sound('pickup'); redraw(); }; b.ondragstart = ev => { ev.dataTransfer?.setData('text/plain', b.dataset.rushFruit); }; b.onpointerdown = ev => { if (ev.pointerType === 'mouse')
        return; const fruit = b.dataset.rushFruit; b.setPointerCapture(ev.pointerId); let ghost = null; const clear = () => { ghost?.remove(); ghost = null; }; b.onpointermove = e => { if (Math.hypot(e.clientX - ev.clientX, e.clientY - ev.clientY) < 8)
        return; if (!ghost) {
        ghost = document.createElement('span');
        ghost.className = 'rush-drag-ghost';
        ghost.textContent = rushNames[fruit];
        document.body.append(ghost);
    } ghost.style.left = (e.clientX + 12) + 'px'; ghost.style.top = (e.clientY - 50) + 'px'; }; b.onpointercancel = clear; b.onpointerup = e => { clear(); const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-rush-pos]'); if (hit) {
        sound('serve');
        action(() => editCake(s, 'fruit', fruit, Date.now(), Number(hit.dataset.rushPos)));
    } }; }; });
    root.querySelector('[data-rush-erase]')?.addEventListener('click', () => { state.fruit = null; redraw(); });
    root.querySelectorAll('[data-rush-pos]').forEach(b => { b.onclick = () => { sound('serve'); action(() => editCake(s, 'fruit', state.fruit, Date.now(), Number(b.dataset.rushPos))); }; b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); sound('serve'); action(() => editCake(s, 'fruit', e.dataTransfer?.getData('text/plain'), Date.now(), Number(b.dataset.rushPos))); }; });
    root.querySelector('#rush-clear')?.addEventListener('click', () => { state.stage = 'sheet'; action(() => editCake(s, 'clear', null, Date.now())); });
    root.querySelector('#rush-submit')?.addEventListener('click', () => { const before = s.history.length; state.stage = 'sheet'; action(() => submitCake(s, Date.now())); const last = s.history.at(-1); if (s.history.length > before)
        sound(last?.outcome === 'exact' ? (rushStats(s).combo >= 3 ? 'vip' : 'happy') : 'wrong'); });
    refreshRushArt(root);
    animateRush(root, s);
}
export function animateRush(root, s, now = Date.now()) { const n = root.querySelector('#rush-seconds'); if (n)
    n.textContent = String(Math.max(0, Math.ceil((s.startedAt + s.duration * 1000 - now) / 1000))); for (const o of s.queue) {
    const el = root.querySelector(`[data-rush-time="${o.id}"]`);
    if (el) {
        el.textContent = Math.max(0, Math.ceil((o.expiresAt - now) / 1000)) + '초';
        el.classList.toggle('urgent', o.expiresAt - now < 7000);
    }
} refreshRushArt(root); }
export function rushBriefing(confirm, cancel, level = 1, records = {}) { rushStyles(); document.getElementById('rush-briefing')?.remove(); const d = document.createElement('section'); d.id = 'rush-briefing'; d.className = 'rush-briefing'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '케이크 주문 폭주 준비'); d.innerHTML = '<article class="rush-shell"><p class="rush-kicker">특별 주문 · 45초 도전</p><h2>케이크 주문 폭주!</h2><p>① 주문 고르기 → ② 시트·크림 조합 → ③ 토핑·장식 → 완성!</p><p>정확한 주문이 가장 높은 점수를 받아요. 공부 정답률과는 별개예요.</p><div class="rush-difficulties">' + ['easy', 'normal', 'challenge'].map(k => `<button data-rush-difficulty="${k}"><b>${diffs[k]}</b><span>${k === 'easy' ? '2주문 · 조건 2개부터' : k === 'normal' ? '3주문 · 조건 2→3개' : '3주문 · 조건 3→4개'}</span><small>최고 ${records[k]?.best ?? 0}점</small></button>`).join('') + `</div><p>추천: ${level >= 11 && (records.normal?.exact ?? 0) >= 5 ? '도전' : (records.easy?.exact ?? 0) >= 3 ? '보통' : '쉬움'} · 원하는 난이도를 자유롭게 골라요.</p><p>영업·손님 대기는 플레이 중 멈춰요. 다시 접속해도 같은 제한시간이에요.</p><button id="rush-cancel">지금은 준비 취소</button></article>`; document.body.append(d); document.getElementById('app')?.setAttribute('inert', ''); d.querySelectorAll('[data-rush-difficulty]').forEach(b => b.onclick = () => { d.remove(); document.getElementById('app')?.removeAttribute('inert'); confirm(b.dataset.rushDifficulty); }); d.querySelector('#rush-cancel').addEventListener('click', () => { d.remove(); document.getElementById('app')?.removeAttribute('inert'); cancel(); }); }
