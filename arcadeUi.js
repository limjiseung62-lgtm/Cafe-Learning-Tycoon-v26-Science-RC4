import { arcadeStats } from './arcadeGames.js';
import { putSort, submitSort, sortFoods } from './sortGame.js';
import { rotateMachine, checkMachine, machineFlow } from './machineGame.js';
import { moveTray, trayObstacles, trayMotionPeriod } from './trayGame.js';
export const arcadeNames = { sort: '주문 분류 대소동', machine: '커피 머신 수리', tray: '트레이 배달 작전' };
let sound = () => { };
export function setArcadeSound(fn) { sound = fn; }
const frames = [[65, 45, 320, 250], [450, 15, 340, 280], [845, 60, 340, 240], [1215, 60, 300, 235], [45, 400, 375, 205], [475, 290, 300, 370], [830, 320, 330, 340], [1180, 320, 335, 340], [80, 625, 215, 370], [415, 660, 300, 350], [840, 715, 300, 265], [1230, 660, 280, 325]];
export function arcadeArt(i, name) { const [x, y, w, h] = frames[i]; return `<span class="arcade-art" role="img" aria-label="${name}" style="background-size:${1536 / w * 100}% ${1024 / h * 100}%;background-position:${x / (1536 - w) * 100}% ${y / (1024 - h) * 100}%;aspect-ratio:${w}/${h}"></span>`; }
export function arcadeStyles() { if (document.getElementById('arcade-style'))
    return; const l = document.createElement('link'); l.id = 'arcade-style'; l.rel = 'stylesheet'; l.href = 'arcade-games.css?v=2'; document.head.append(l); }
const rules = { sort: '음식 선택 → 주문 트레이 터치 → 수량 확인 → 전달! 잘못 올린 음식은 눌러서 뺄 수 있어요.', machine: '전원 켜기 → 부품을 눌러 90도 회전 → 물 입구에서 가열 장치를 거쳐 추출구까지 연결 → 추출!', tray: '방향키·WASD 또는 방향 버튼으로 이동해요. 급회전을 줄이고 음식과 균형을 지키며 오른쪽 손님에게 배달!' };
export function arcadeBriefing(kind, start, cancel) { arcadeStyles(); const d = document.createElement('section'); d.className = 'arcade-overlay'; d.id = 'arcade-brief'; d.innerHTML = `<article class="arcade-shell"><p class="arcade-kicker">45초 · 새로운 작은 도전</p><h2>${arcadeNames[kind]}</h2><p>${rules[kind]}</p><div class="arcade-difficulties">${['easy', 'normal', 'challenge'].map((x, i) => `<button data-arcade-difficulty="${x}"><b>${['쉬움', '보통', '도전'][i]}</b><small>${kind === 'sort' ? ['주문 2개 · 단일 음식', '주문 3개 · 복합 주문', '주문 4개 · 대기시간 관리'][i] : kind === 'machine' ? ['3×3 · 단순 연결', '4×4 · 우회 연결', '5×5 · 가열 장치 2개'][i] : ['움직이는 손님 2명 · 음식 2개', '빠른 손님 4명 · 음식 3개', '빠른 손님 6명 · 균형 집중'][i]}</small></button>`).join('')}</div><p>미니게임 점수는 공부 정답률과 별개예요.</p><button id="arcade-cancel">돌아가기</button></article>`; document.body.append(d); d.querySelectorAll('[data-arcade-difficulty]').forEach(b => b.onclick = () => { d.remove(); start(b.dataset.arcadeDifficulty); }); d.querySelector('#arcade-cancel').addEventListener('click', () => { d.remove(); cancel(); }); }
const holds = new WeakMap(), moveActions = new WeakMap();
export function renderArcade(root, s, action, exit, best = 0, cafe = false) {
    arcadeStyles();
    root.className = 'arcade-overlay';
    const previousBoard = s.kind === 'tray' && s.endedAt === undefined ? root.querySelector('.tray-board') : null;
    const previousRound = previousBoard?.dataset.round;
    const stats = arcadeStats(s);
    root.innerHTML = `<article class="arcade-shell"><header><div><p class="arcade-kicker">CAFE ARCADE · ${s.difficulty === 'easy' ? '쉬움' : s.difficulty === 'normal' ? '보통' : '도전'}</p><h2>${arcadeNames[s.kind]}</h2></div><button id="arcade-exit">${s.endedAt === undefined ? '그만하기' : cafe ? '카페로' : '연습 화면으로'}</button></header><div class="arcade-status"><b id="arcade-seconds"></b><span>점수 ${stats.score.toLocaleString()}</span><span>성공 ${stats.exact}회</span></div>${s.endedAt !== undefined ? `<section class="arcade-result"><div class="arcade-stars">${'★'.repeat(stats.stars)}${'☆'.repeat(3 - stats.stars)}</div><h3>오늘의 도전 기록</h3><dl><div><dt>완료 / 성공</dt><dd>${stats.processed} / ${stats.exact}</dd></div><div><dt>${s.kind === 'tray' ? '안전 배달 지수' : '정확도'}</dt><dd>${stats.processed ? stats.accuracy + '%' : '미완료'}</dd></div><div><dt>점수 / 최고 기록</dt><dd>${stats.score} / ${Math.max(best, stats.score)}</dd></div></dl><p>${cafe ? (stats.exact ? '첫 성공 기념 장식을 보관했어요. 중복 지급하지 않아요.' : '카페 자산은 그대로예요. 다음에 다시 도전해요.') : '독립 연습 기록 · 카페 보상과 학습 성적에는 반영하지 않아요.'}</p><button id="arcade-return">${cafe ? '카페로 돌아가기' : '다음 도전 준비'}</button></section>` : `<p class="arcade-instruction">${rules[s.kind]}</p>${s.kind === 'sort' ? sortView(s) : s.kind === 'machine' ? machineView(s) : trayView(s)}`}<p class="arcade-message" role="status">${s.kind === 'sort' && s.history.at(-1)?.exact ? arcadeArt(9, '만족한 손님') : ''}${s.message}</p><p class="arcade-note">45초 · ${cafe ? '영업·손님 대기 멈춤' : '독립 연습'} · 새로고침해도 종료 시각은 같아요.</p></article>`;
    if (s.kind === 'tray' && previousBoard && previousRound === String(s.deliveries)) {
        const next = root.querySelector('.tray-board');
        const target = next.querySelector('.tray-player');
        const player = previousBoard.querySelector('.tray-player');
        const style = target.getAttribute('style');
        player.innerHTML = target.innerHTML;
        next.replaceWith(previousBoard);
        requestAnimationFrame(() => { if (player.isConnected)
            player.setAttribute('style', style); });
    }
    const act = (fn, id = 'pickup') => { sound(id); action(fn); };
    root.querySelector('#arcade-exit').addEventListener('click', exit);
    root.querySelector('#arcade-return')?.addEventListener('click', exit);
    if (s.kind === 'sort') {
        root.querySelectorAll('[data-sort-food]').forEach(b => { b.onclick = () => act(() => { s.selected = Number(b.dataset.sortFood); return true; }); b.draggable = true; b.ondragstart = e => e.dataTransfer?.setData('text/plain', b.dataset.sortFood); b.onpointerdown = e => { if (e.pointerType === 'mouse')
            return; b.setPointerCapture(e.pointerId); let ghost = null; b.onpointermove = p => { if (Math.hypot(p.clientX - e.clientX, p.clientY - e.clientY) < 10)
            return; if (!ghost) {
            ghost = document.createElement('span');
            ghost.className = 'arcade-drag';
            ghost.textContent = sortFoods[Number(b.dataset.sortFood)];
            document.body.append(ghost);
        } ghost.style.left = p.clientX + 12 + 'px'; ghost.style.top = p.clientY - 40 + 'px'; }; b.onpointercancel = () => ghost?.remove(); b.onpointerup = p => { ghost?.remove(); const target = document.elementFromPoint(p.clientX, p.clientY)?.closest('[data-sort-order]'); if (target)
            act(() => putSort(s, Number(target.dataset.sortOrder), Number(b.dataset.sortFood), Date.now())); }; }; });
        root.querySelectorAll('[data-sort-put]').forEach(b => b.onclick = () => act(() => putSort(s, Number(b.dataset.sortPut), s.selected, Date.now())));
        root.querySelectorAll('[data-sort-remove]').forEach(b => b.onclick = () => { const [id, item] = b.dataset.sortRemove.split(':').map(Number); act(() => putSort(s, id, item, Date.now(), true)); });
        root.querySelectorAll('[data-sort-submit]').forEach(b => b.onclick = () => { const o = s.queue.find(o => o.id === Number(b.dataset.sortSubmit)); act(() => submitSort(s, Number(b.dataset.sortSubmit), Date.now()), o?.need.every((n, i) => n === o.placed[i]) ? 'happy' : 'wrong'); });
        root.querySelectorAll('[data-sort-order]').forEach(b => { b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); const v = e.dataTransfer?.getData('text/plain'); if (v && /^[0-3]$/.test(v))
            act(() => putSort(s, Number(b.dataset.sortOrder), Number(v), Date.now())); }; });
    }
    if (s.kind === 'machine') {
        root.querySelectorAll('[data-machine-cell]').forEach(b => b.onclick = () => act(() => rotateMachine(s, Number(b.dataset.machineCell), Date.now())));
        root.querySelector('#machine-power')?.addEventListener('click', () => act(() => { s.power = !s.power; s.message = s.power ? '전원이 들어왔어요. 파란 물길을 확인해요.' : '전원을 껐어요.'; return true; }, 'panel'));
        root.querySelector('#machine-check')?.addEventListener('click', () => action(() => { const before = s.history.length, result = checkMachine(s, Date.now()); sound(s.history.length > before ? 'happy' : 'wrong'); return result; }));
    }
    if (s.kind === 'tray') {
        if (!holds.has(root))
            holds.set(root, { dir: null, until: 0 });
        if (s.endedAt !== undefined)
            holds.set(root, { dir: null, until: 0 });
        root.tabIndex = -1;
        if (!root.contains(document.activeElement))
            root.focus({ preventScroll: true });
        const step = (dir) => action(() => moveTray(s, dir, Date.now()));
        moveActions.set(root, step);
        root.onpointerup = root.onpointercancel = () => holds.set(root, { dir: null, until: 0 });
        root.onkeydown = e => { const dir = { ArrowUp: 'up', w: 'up', W: 'up', ArrowRight: 'right', d: 'right', D: 'right', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left' }[e.key]; if (dir && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            step(dir);
        } };
        root.querySelectorAll('[data-tray-dir]').forEach(b => { b.onclick = () => step(b.dataset.trayDir); b.onpointerdown = e => { e.preventDefault(); root.setPointerCapture(e.pointerId); holds.set(root, { dir: b.dataset.trayDir, until: Date.now() + 4000 }); step(b.dataset.trayDir); }; b.onpointerup = b.onpointercancel = () => holds.set(root, { dir: null, until: 0 }); });
    }
    else
        root.onkeydown = null;
    animateArcade(root, s);
}
function sortView(s) { return `<nav class="arcade-foods">${sortFoods.map((n, i) => `<button data-sort-food="${i}" aria-pressed="${s.selected === i}">${arcadeArt(i, n)}<span>${n}</span></button>`).join('')}</nav><div class="sort-orders">${s.queue.map(o => `<section data-sort-order="${o.id}"><header><h3>주문 ${o.id + 1}</h3><b data-sort-clock="${o.id}"></b></header><div class="sort-request">${o.need.map((n, i) => n ? `<span>${arcadeArt(i, sortFoods[i])}<b>${n}개</b></span>` : '').join('')}</div><div class="sort-tray"><div>${o.placed.map((n, i) => n ? `<button data-sort-remove="${o.id}:${i}" aria-label="주문 ${o.id + 1} ${sortFoods[i]} 하나 빼기">${arcadeArt(i, sortFoods[i])}<b>${n}개 −</b></button>` : '').join('') || '<span>음식을 올려 주세요</span>'}</div></div><button data-sort-put="${o.id}">선택 음식 올리기</button><button class="arcade-primary" data-sort-submit="${o.id}">손님에게 전달</button></section>`).join('')}</div>`; }
function pipeSvg(mask, flow) { return `<svg viewBox="0 0 60 60" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke="${flow ? '#63c3d4' : '#bd9062'}" stroke-width="12">${[1, 2, 4, 8].map((bit, i) => mask & bit ? `<path d="M30 30 L${[30, 60, 30, 0][i]} ${[0, 30, 60, 30][i]}"/>` : '').join('')}</g><circle cx="30" cy="30" r="8" fill="${flow ? '#b6eff2' : '#e9d2a9'}"/></svg>`; }
function machineView(s) { const flow = machineFlow(s); return `<div class="machine-work"><aside>${arcadeArt(6, '커피 머신')}<p>수리 ${s.puzzle + 1}/3 · 회전 ${s.moves}회</p><button id="machine-power" aria-pressed="${s.power}">${s.power ? '전원 켜짐' : '전원 켜기'}</button></aside><section><div class="machine-labels"><span>왼쪽 물 입구</span><span>오른쪽 아래 추출구</span></div><div class="machine-grid" style="--size:${s.size}">${s.pieces.map((m, i) => `<button data-machine-cell="${i}" data-mask="${m}" class="${flow.has(i) ? 'flow' : ''}" aria-label="부품 ${i + 1}: ${[1, 2, 4, 8].filter(b => m & b).map(b => ({ 1: '위', 2: '오른쪽', 4: '아래', 8: '왼쪽' }[b])).join('·') || '빈 칸'}${s.heaters.includes(i) ? ' · 가열 장치' : ''}">${m ? pipeSvg(m, flow.has(i)) : ''}${s.heaters.includes(i) ? '<small>가열</small>' : ''}${i === 0 ? '<em>입구</em>' : i === s.pieces.length - 1 ? '<em>출구</em>' : ''}</button>`).join('')}</div><button id="machine-check" class="arcade-primary">연결 확인 · 커피 추출</button></section></div>`; }
function trayView(s) { return `<div class="tray-info"><span>배달 ${s.deliveries}/3</span><span>음식 ${s.food}개</span><span>충돌 ${s.collisions}회</span><span>균형 ${Math.round(s.balance)}%</span></div><div class="tray-balance"><i style="width:${s.balance}%"></i></div><div class="tray-board" data-round="${s.deliveries}" role="img" aria-label="9칸×7칸 카페. 왼쪽 출발, 오른쪽 가운데 손님에게 배달"><span class="tray-start">출발</span><div class="tray-goal">${arcadeArt(9, '배달 손님')}</div><div id="tray-obstacles"></div><div class="tray-player" style="left:${(s.x + .5) / 9 * 100}%;top:${(s.y + .5) / 7 * 100}%;--wobble:${(100 - s.balance) / 10}deg">${arcadeArt(5, '트레이를 든 사장')}<div class="tray-cargo">${Array.from({ length: s.food }, (_, i) => arcadeArt(i % 4, '운반 음식 ' + (i + 1))).join('')}</div><small>${s.food}개</small></div></div><div class="tray-dpad"><button data-tray-dir="up" aria-label="위로">↑</button><div><button data-tray-dir="left" aria-label="왼쪽으로">←</button><button data-tray-dir="down" aria-label="아래로">↓</button><button data-tray-dir="right" aria-label="오른쪽으로">→</button></div></div><p class="arcade-note">방향 버튼을 꾹 누르면 계속 이동해요. 손을 떼면 멈춰요. 급회전 전 잠깐 쉬면 균형을 지킬 수 있어요. 빈 트레이는 배달 성공으로 세지 않아요.</p>`; }
export function animateArcade(root, s, now = Date.now()) { const c = root.querySelector('#arcade-seconds'); if (c)
    c.textContent = s.endedAt === undefined ? Math.max(0, Math.ceil((s.startedAt + 45000 - now) / 1000)) + '초' : '도전 완료'; if (s.kind === 'sort')
    for (const o of s.queue) {
        const n = root.querySelector(`[data-sort-clock="${o.id}"]`);
        if (n) {
            n.textContent = Math.max(0, Math.ceil((o.expiresAt - now) / 1000)) + '초';
            n.classList.toggle('urgent', o.expiresAt - now < 5000);
        }
    } if (s.kind === 'tray') {
    const held = holds.get(root);
    if (held?.dir && held.until > now && now >= s.nextMoveAt && s.endedAt === undefined) {
        moveActions.get(root)?.(held.dir);
        return;
    }
    const host = root.querySelector('#tray-obstacles');
    if (host) {
        const key = String(Math.floor((now - s.startedAt) / trayMotionPeriod(s)));
        if (host.dataset.frame !== key) {
            host.dataset.frame = key;
            host.innerHTML = trayObstacles(s, now).map(o => `<span data-obstacle="${o.x},${o.y}" style="left:${(o.x + .5) / 9 * 100}%;top:${(o.y + .5) / 7 * 100}%">${arcadeArt(o.moving ? 8 : 7, o.moving ? '지나가는 손님' : '화분 장애물')}</span>`).join('');
        }
    }
} }
