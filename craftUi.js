import { breads, flowers, colors, craftStats, ovenTiming, loadOven, takeOven, submitOven, placeFlower, submitFlowers, flowerEvaluation, moveFlower } from './craftGames.js';
export const craftAtlas = 'assets/web/craft-games/supplies.webp';
let sound = () => { };
export function setCraftSound(fn) { sound = fn; }
const frames = [[45, 55, 320, 275], [400, 60, 360, 270], [800, 45, 305, 280], [1180, 60, 330, 265], [65, 345, 280, 320], [475, 345, 220, 320], [800, 350, 295, 310], [1190, 345, 315, 320], [70, 680, 240, 315], [460, 680, 270, 300], [780, 660, 290, 330], [1110, 680, 400, 300]];
export function craftArt(index, label) { const [x, y, w, h] = frames[index]; return `<span class="craft-art" role="img" aria-label="${label}" style="background-size:${1536 / w * 100}% ${1024 / h * 100}%;background-position:${x / (1536 - w) * 100}% ${y / (1024 - h) * 100}%;aspect-ratio:${w}/${h}"></span>`; }
export function craftStyles() { if (!document.getElementById('craft-style')) {
    const l = document.createElement('link');
    l.id = 'craft-style';
    l.rel = 'stylesheet';
    l.href = 'craft-games.css?v=3';
    document.head.append(l);
} }
export function craftBriefing(kind, start, cancel) { craftStyles(); const d = document.createElement('section'); d.className = 'craft-overlay'; d.id = 'craft-brief'; d.innerHTML = `<article class="craft-shell"><p class="craft-kicker">45초 · 나만의 최고 기록</p><h2>${kind === 'oven' ? '오븐 대소동!' : '꽃다발 주문 제작소!'}</h2><p>${kind === 'oven' ? '빵 선택 → 빈 오븐에 넣기 → 초록 구간에 꺼내기 → 제출! 여러 오븐을 함께 관리해요.' : '주문 조건 확인 → 꽃 선택 → 자리 터치 → 리본 → 완성! 조건을 맞추는 여러 배치가 정답이에요.'}</p><div class="craft-difficulties">${['easy', 'normal', 'challenge'].map((x, i) => `<button data-craft-difficulty="${x}"><b>${['쉬움', '보통', '도전'][i]}</b><small>${kind === 'oven' ? ['오븐 2개 · 넓은 구간', '오븐 2개 · 속도 판단', '오븐 3개 · 정밀 타이밍'][i] : ['꽃 3개 · 색과 중심', '꽃 5개 · 장식과 리본', '꽃 7개 · 좌우 균형'][i]}</small></button>`).join('')}</div><p>미니게임 점수는 공부 정답률과 별개예요.</p><button id="craft-cancel">돌아가기</button></article>`; document.body.append(d); d.querySelectorAll('[data-craft-difficulty]').forEach(b => b.onclick = () => { d.remove(); start(b.dataset.craftDifficulty); }); d.querySelector('#craft-cancel').addEventListener('click', () => { d.remove(); cancel(); }); }
const positions = [[50, 48], [23, 20], [20, 45], [30, 70], [77, 20], [80, 45], [70, 70]];
export function renderCraft(root, s, action, exit, best = 0, cafe = false) {
    craftStyles();
    root.className = 'craft-overlay';
    const stats = craftStats(s), o = s.orders[s.cursor];
    root.innerHTML = `<article class="craft-shell"><header><div><p class="craft-kicker">${s.kind === 'oven' ? 'BAKE & SERVE' : 'BOUQUET ATELIER'} · ${s.difficulty === 'easy' ? '쉬움' : s.difficulty === 'normal' ? '보통' : '도전'}</p><h2>${s.kind === 'oven' ? '오븐 대소동!' : '꽃다발 주문 제작소!'}</h2></div><button id="craft-exit">${s.endedAt === undefined ? '그만하기' : cafe ? '카페로' : '연습 화면으로'}</button></header><div class="craft-status"><b id="craft-seconds"></b><span>점수 ${stats.score.toLocaleString()}</span><span>완벽 ${stats.exact}개</span></div>${s.endedAt !== undefined ? `<section class="craft-results"><div class="craft-stars">${'★'.repeat(stats.stars)}${'☆'.repeat(3 - stats.stars)}</div><h3>오늘의 제작 기록</h3><dl><div><dt>제출한 주문</dt><dd>${stats.processed}개</dd></div><div><dt>완벽한 주문</dt><dd>${stats.exact}개</dd></div><div><dt>조건 정확도</dt><dd>${stats.processed ? stats.accuracy + '%' : '미제작'}</dd></div><div><dt>점수 / 최고 기록</dt><dd>${stats.score} / ${Math.max(best, stats.score)}</dd></div></dl><p>${cafe ? (stats.exact ? '첫 성공 기념 장식을 받았어요. 이미 소유한 장식은 중복 지급하지 않아요.' : '이번에는 연습 기록이에요. 카페 자산은 그대로예요.') : '독립 연습 기록 · 카페 기념 보상과 학습 성적에 반영하지 않아요.'}</p><details><summary>주문별 평가</summary>${s.history.map(h => `<p>주문 ${h.orderId + 1} · ${h.note} · ${h.score}점</p>`).join('')}</details><button id="craft-again">${cafe ? '카페로 돌아가기' : '다음 도전 준비'}</button></section>` : s.kind === 'oven' ? ovenView(s) : flowerView(s)}<p class="craft-message" role="status">${s.message}</p><p class="craft-note">45초 · 최대 9주문 · ${cafe ? '영업·손님 대기 멈춤' : '독립 연습'} · 새로고침해도 종료 시각은 같아요.</p></article>`;
    root.querySelector('#craft-move')?.setAttribute('aria-pressed', root.dataset.moveMode ?? 'false');
    const act = (fn, event) => { sound(event); action(fn); };
    root.querySelector('#craft-exit').addEventListener('click', exit);
    root.querySelector('#craft-again')?.addEventListener('click', exit);
    root.querySelectorAll('[data-craft-item]').forEach(b => b.onclick = () => act(() => { s.selected = Number(b.dataset.craftItem); root.dataset.moveMode = 'false'; delete root.dataset.moveFrom; return true; }, 'pickup'));
    for (const verb of ['load', 'take', 'serve', 'discard'])
        root.querySelectorAll(`[data-craft-${verb}]`).forEach(b => b.onclick = () => act(() => { const slot = Number(b.getAttribute('data-craft-' + verb)), now = Date.now(); return verb === 'load' ? loadOven(s, slot, s.selected, now) : verb === 'take' ? takeOven(s, slot, now) : submitOven(s, slot, now, verb === 'discard'); }, verb === 'serve' ? 'happy' : verb === 'take' ? 'production' : 'pickup'));
    const positionClick = (b) => { if (root.dataset.moveMode === 'true') {
        const from = root.dataset.moveFrom;
        if (from === undefined) {
            root.dataset.moveFrom = b.dataset.craftPos;
            b.setAttribute('aria-pressed', 'true');
            return;
        }
        delete root.dataset.moveFrom;
        act(() => moveFlower(s, Number(from), Number(b.dataset.craftPos), Date.now()), 'pickup');
        return;
    } act(() => placeFlower(s, Number(b.dataset.craftPos), s.selected === 6 ? null : s.selected, Date.now()), 'pickup'); };
    root.onclick = ev => { const b = ev.target.closest('[data-craft-pos]'); if (b && root.contains(b))
        positionClick(b); };
    root.querySelectorAll('[data-craft-pos]').forEach(b => { b.draggable = root.dataset.moveMode === 'true' && s.bouquet[Number(b.dataset.craftPos)] !== null; b.ondragstart = e => e.dataTransfer?.setData('text/plain', 'move:' + b.dataset.craftPos); b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); const raw = e.dataTransfer?.getData('text/plain'); if (raw?.startsWith('move:')) {
        act(() => moveFlower(s, Number(raw.slice(5)), Number(b.dataset.craftPos), Date.now()), 'pickup');
        return;
    } if (raw !== undefined && /^\d$/.test(raw))
        act(() => placeFlower(s, Number(b.dataset.craftPos), Number(raw), Date.now()), 'pickup'); }; });
    root.querySelectorAll('[data-craft-item]').forEach(b => { b.draggable = s.kind === 'flowers'; b.ondragstart = e => e.dataTransfer?.setData('text/plain', b.dataset.craftItem); b.onpointerdown = ev => { if (ev.pointerType === 'mouse' || s.kind !== 'flowers')
        return; b.setPointerCapture(ev.pointerId); let ghost = null; b.onpointermove = e => { if (Math.hypot(e.clientX - ev.clientX, e.clientY - ev.clientY) < 10)
        return; if (!ghost) {
        ghost = document.createElement('span');
        ghost.className = 'craft-drag';
        ghost.textContent = flowers[Number(b.dataset.craftItem)];
        document.body.append(ghost);
    } ghost.style.left = e.clientX + 15 + 'px'; ghost.style.top = e.clientY - 45 + 'px'; }; const clear = () => { ghost?.remove(); ghost = null; }; b.onpointercancel = clear; b.onpointerup = e => { clear(); const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-craft-pos]'); if (hit)
        act(() => placeFlower(s, Number(hit.dataset.craftPos), Number(b.dataset.craftItem), Date.now()), 'pickup'); }; }; });
    root.querySelector('#craft-move')?.addEventListener('click', () => { root.dataset.moveMode = root.dataset.moveMode === 'true' ? 'false' : 'true'; delete root.dataset.moveFrom; root.querySelectorAll('[data-craft-pos]').forEach(b => b.draggable = root.dataset.moveMode === 'true' && s.bouquet[Number(b.dataset.craftPos)] !== null); root.querySelector('#craft-move')?.setAttribute('aria-pressed', root.dataset.moveMode); const msg = root.querySelector('.craft-message'); if (msg)
        msg.textContent = root.dataset.moveMode === 'true' ? '옮길 꽃 → 도착할 자리를 차례로 눌러요' : '꽃을 골라 배치해요'; });
    root.querySelector('#craft-erase')?.addEventListener('click', () => action(() => { s.selected = 6; return true; }));
    root.querySelector('#craft-ribbon')?.addEventListener('click', () => act(() => { s.ribbon = !s.ribbon; return true; }, 'production'));
    root.querySelector('#craft-submit')?.addEventListener('click', () => act(() => submitFlowers(s, Date.now()), flowerEvaluation(s).exact ? 'happy' : 'wrong'));
    animateCraft(root, s);
}
function ovenView(s) { return `<p class="craft-instruction">빵을 골라 빈 오븐에 넣어요. 초록 구간에 꺼내고 제출! 잘못 구웠다면 다시 만들 수 있어요.</p><nav class="craft-orderline" aria-label="남은 빵 주문">${s.orders.filter(o => !s.history.some(h => h.orderId === o.id)).map(o => `<span>주문 ${o.id + 1} · ${breads[o.item]}</span>`).join('')}</nav><div class="craft-palette">${breads.map((n, i) => `<button data-craft-item="${i}" aria-pressed="${s.selected === i}">${craftArt(i, n)}<span>${n}</span></button>`).join('')}</div><div class="craft-ovens">${s.ovens.map((b, i) => `<section class="craft-oven"><h3>오븐 ${i + 1}${b ? ' · 주문 ' + (b.orderId + 1) : ' · 비어 있어요'}</h3><div class="craft-oven-image">${craftArt(11, '오븐')}<div class="craft-bread" data-bread="${i}">${b ? craftArt(b.item, breads[b.item]) : ''}</div></div>${b ? `<p>${breads[b.item]} · <b data-quality="${i}">${b.quality ?? '굽는 중'}</b></p><div class="craft-meter" role="meter" aria-label="오븐 ${i + 1} 굽기" aria-valuemin="0" aria-valuemax="125"><span style="left:${ovenTiming(s, b, Date.now()).low / 125 * 100}%;width:${(ovenTiming(s, b, Date.now()).high - ovenTiming(s, b, Date.now()).low) / 125 * 100}%"></span><i data-gauge="${i}"></i></div>${b.takenAt === undefined ? `<button data-craft-take="${i}">지금 꺼내기</button>` : `<div class="craft-pair"><button data-craft-serve="${i}">제출 ${b.points}점</button><button data-craft-discard="${i}">다시 굽기</button></div>`}` : `<p>선택: ${breads[s.selected] ?? '빵을 고르세요'}</p><button data-craft-load="${i}">빵 넣기</button>`}</section>`).join('')}</div>`; }
function flowerView(s) { const o = s.orders[s.cursor], ev = flowerEvaluation(s); return `<div class="craft-flower-layout"><section class="craft-request"><p class="craft-kicker">손님 주문 ${s.cursor + 1} / 9</p><h3>${colors[o.item] === '흰색' ? '흰빛' : colors[o.item] === '노랑' ? '노란빛' : colors[o.item] === '보라' ? '보랏빛' : colors[o.item] + '빛'} ${flowers[o.item]} 꽃다발</h3><ul><li>꽃 ${o.count}개</li><li>${colors[o.item].endsWith('색') ? colors[o.item] : colors[o.item] === '노랑' ? '노란색' : colors[o.item] + '색'} 꽃 ${Math.ceil(o.count / 2)}개 이상</li><li>중심: ${flowers[o.item]}</li>${o.accent ? '<li>장식꽃 1개 이상 + 리본</li>' : ''}${o.balanced ? '<li>왼쪽·오른쪽 꽃 개수 같게</li>' : ''}</ul><p>같은 조건이면 서로 다른 배치도 만점!</p><p>현재 조건 충족 ${ev.accuracy}%</p></section><section><div class="craft-bouquet">${craftArt(10, '꽃다발 포장지')}<div class="craft-flowers">${positions.map(([x, y], i) => `<button data-craft-pos="${i}" style="left:${x}%;top:${y}%;z-index:${i === 0 ? 9 : Math.round(y / 10)}" aria-label="${i === 0 ? '중심' : i < 4 ? '왼쪽' : '오른쪽'} ${i}번 자리 ${s.bouquet[i] === null ? '빈 자리' : flowers[s.bouquet[i]]}" class="${i === 0 ? 'center' : ''}">${s.bouquet[i] === null ? '<span>＋</span>' : craftArt(4 + s.bouquet[i], flowers[s.bouquet[i]])}</button>`).join('')}</div>${s.ribbon ? '<span class="craft-ribbon-art" aria-label="리본 장식">' + craftArt(10, '분홍 리본') + '</span>' : ''}</div><p class="craft-instruction">꽃 선택 → 자리 터치 · 다시 누르면 교체 · 끌어서 배치 가능</p></section></div><div class="craft-palette flowers">${flowers.map((n, i) => `<button data-craft-item="${i}" aria-pressed="${s.selected === i}">${craftArt(4 + i, n)}<span>${n}</span></button>`).join('')}</div><div class="craft-flower-actions"><button id="craft-move" aria-pressed="false">자리 바꾸기</button><button id="craft-erase" aria-pressed="${s.selected === 6}">꽃 지우개</button><button id="craft-ribbon" aria-pressed="${s.ribbon}">리본 ${s.ribbon ? '빼기' : '추가'}</button><button id="craft-submit" class="craft-primary">꽃다발 완성!</button></div>`; }
export function animateCraft(root, s, now = Date.now()) { const clock = root.querySelector('#craft-seconds'); if (clock)
    clock.textContent = Math.max(0, Math.ceil((s.startedAt + 45000 - now) / 1000)) + '초'; s.ovens.forEach((b, i) => { if (!b)
    return; const r = ovenTiming(s, b, b.takenAt ?? now), g = root.querySelector(`[data-gauge="${i}"]`), q = root.querySelector(`[data-quality="${i}"]`), img = root.querySelector(`[data-bread="${i}"]`); if (g) {
    g.style.left = r.progress / 125 * 100 + '%';
    g.parentElement?.setAttribute('aria-valuenow', String(Math.round(r.progress)));
} if (q)
    q.textContent = b.quality ?? r.quality; if (img) {
    const old = img.dataset.bake;
    if (old && old !== r.quality && b.takenAt === undefined)
        sound(r.quality === '알맞음' ? 'production' : r.quality === '탐' ? 'wrong' : 'panel');
    img.dataset.bake = r.quality;
    img.dataset.taken = String(b.takenAt !== undefined);
    img.style.filter = r.quality === '덜 익음' ? 'saturate(.35) brightness(1.35)' : r.quality === '탐' ? 'brightness(.25) saturate(.2)' : r.quality === '과하게 익음' ? 'brightness(.65)' : 'none';
} }); }
