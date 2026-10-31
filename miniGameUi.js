import { desiredVillageMini } from './village.js';
import { newArcade } from './arcadeGames.js';
import { renderArcade, animateArcade, arcadeBriefing } from './arcadeUi.js';
import { createCraft } from './craftGames.js';
import { renderCraft, animateCraft, craftBriefing } from './craftUi.js';
import { newCakeRush, rushSeed } from './cakeRush.js';
import { renderRush, animateRush, rushBriefing } from './cakeRushUi.js';
import { escapeText as esc } from './questionRenderer.js';
import { miniInfo, miniTokens } from './miniGameConfig.js';
import { cakeTokens } from './miniCake.js';
import { flowerTokens } from './miniFlowers.js';
import { ovenPosition } from './miniOven.js';
import { activeMini, pollMini, startMini, placeMini, finishMini, retryMini, leaveMini, skipMini, canExtraMini, offerMini, miniRewardIds, miniPaused } from './miniGames.js';
import { miniArt, refreshMiniArt } from './miniArt.js';
import { longStateFor } from './longGrowthUi.js';
import { growthRuntime } from './growthRuntime.js';
let current = null, flush = () => false, projection = '', selected = null, raf = 0, error = '';
export function beginMiniUi(g, onSave) { cancelAnimationFrame(raf); document.getElementById('rush-briefing')?.remove(); document.getElementById('mini-dialog')?.remove(); document.getElementById('mini-banner')?.remove(); document.body.classList.remove('mini-active'); document.getElementById('app')?.removeAttribute('inert'); current = g.mode === 'CAFE_GROWTH' ? g : null; flush = onSave; projection = ''; selected = null; error = ''; if (current) {
    if (current.miniCollection)
        current.miniCollection.gameSet = 6;
    const requested = current.lakeMini ?? desiredVillageMini(current.village);
    if (requested && !current.miniGames?.offers.length && offerMini(current, requested))
        flush();
    if (!document.getElementById('mini-style')) {
        const link = document.createElement('link');
        link.id = 'mini-style';
        link.rel = 'stylesheet';
        link.href = 'mini-games.css';
        document.head.append(link);
    }
    animate();
} }
function gifts(g) { const state = longStateFor(g); if (!state)
    return false; let changed = false; for (const id of miniRewardIds(g))
    if (!state.owned.includes(id)) {
        state.owned.push(id);
        changed = true;
    } return changed; }
function transact(action) { const g = current; if (!g)
    return; g.tick(growthRuntime.delta(g) ?? 0); const before = structuredClone(g.miniGames), bank = structuredClone(g.miniCollection), state = longStateFor(g), owned = state ? [...state.owned] : null; const result = action(); if (result === false && JSON.stringify(g.miniGames) === JSON.stringify(before) && JSON.stringify(g.miniCollection) === JSON.stringify(bank))
    return; gifts(g); if (!flush()) {
    g.miniGames = before;
    g.miniCollection = bank;
    if (state && owned)
        state.owned = owned;
    error = '저장하지 못했어요. 기존 상태로 돌아왔어요. 다시 시도해 주세요.';
}
else
    error = ''; projection = ''; pollMiniUi(g); }
function tokenName(t) { return t ? miniTokens[t].name : '빈 자리'; }
function cell(t) { return t ? miniArt(miniTokens[t].cell, miniTokens[t].name) : '<span class="mini-empty" aria-hidden="true">·</span>'; }
function board(a, target) { const tokens = target ? a.target : a.placed; return '<div class="mini-pattern ' + (a.kind === 'flowers' ? 'flower-pattern' : 'cake-pattern') + ' ' + (target ? 'target-pattern' : 'work-pattern') + '">' + tokens.map((t, i) => target ? '<span class="mini-target-cell" aria-label="목표 ' + (i + 1) + '번 ' + tokenName(t) + '">' + cell(t) + '</span>' : '<button data-mini-position="' + i + '" aria-label="' + (i + 1) + '번 자리 ' + tokenName(t) + '">' + cell(t) + '</button>').join('') + '</div>'; }
function render(a) {
    const g = current, info = miniInfo(a.kind);
    if (a.arcade) {
        let box = document.getElementById('mini-dialog');
        if (!box) {
            box = document.createElement('section');
            box.id = 'mini-dialog';
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            document.body.append(box);
        }
        document.getElementById('app')?.setAttribute('inert', '');
        document.body.classList.add('mini-active');
        renderArcade(box, a.arcade, fn => transact(fn), () => transact(() => leaveMini(g)), g.miniCollection?.arcadeRecords?.[a.arcade.kind]?.[a.arcade.difficulty] ?? 0, true);
        if (error) {
            const warning = document.createElement('p');
            warning.setAttribute('role', 'alert');
            warning.textContent = error;
            box.querySelector('article')?.prepend(warning);
        }
        return;
    }
    if (a.craft) {
        let box = document.getElementById('mini-dialog');
        if (!box) {
            box = document.createElement('section');
            box.id = 'mini-dialog';
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            document.body.append(box);
        }
        document.getElementById('app')?.setAttribute('inert', '');
        document.body.classList.add('mini-active');
        renderCraft(box, a.craft, fn => transact(fn), () => transact(() => leaveMini(g)), g.miniCollection?.craftRecords?.[a.craft.kind]?.[a.craft.difficulty] ?? 0, true);
        if (error) {
            const warning = document.createElement('p');
            warning.className = 'mini-error';
            warning.setAttribute('role', 'alert');
            warning.textContent = error;
            box.querySelector('article')?.prepend(warning);
        }
        return;
    }
    if (a.rush) {
        let box = document.getElementById('mini-dialog');
        if (!box) {
            box = document.createElement('section');
            box.id = 'mini-dialog';
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            box.setAttribute('aria-label', '케이크 주문 폭주!');
            document.body.append(box);
        }
        document.getElementById('app')?.setAttribute('inert', '');
        document.body.classList.add('mini-active');
        renderRush(box, a.rush, fn => transact(fn), () => transact(() => leaveMini(g)), g.miniCollection?.cakeRecords, true);
        return;
    }
    let d = document.getElementById('mini-dialog');
    if (!d) {
        d = document.createElement('section');
        d.id = 'mini-dialog';
        d.className = 'mini-overlay';
        d.setAttribute('role', 'dialog');
        d.setAttribute('aria-modal', 'true');
        d.setAttribute('aria-label', info.name);
        document.body.append(d);
    }
    document.body.classList.add('mini-active');
    document.getElementById('app')?.setAttribute('inert', '');
    const playing = a.phase === 'playing', remaining = Math.max(0, Math.ceil((a.lease.deadlineAt - g.miniNow()) / 1000)), retry = a.phase === 'failed' && a.tries < 2 && a.lease.endedAt === undefined && remaining > 1;
    let content = '';
    if (playing && a.kind === 'oven')
        content = '<div class="mini-oven-art">' + miniArt(1, '따뜻한 오븐') + '</div><div class="oven-scale" role="meter" aria-label="굽기 게이지" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="oven-zone">맛있는 구간</span><i id="oven-pointer"></i></div><div class="oven-labels"><span>덜 익음</span><span>알맞음</span><span>너무 익음</span></div><button id="mini-finish" class="primary oven-stop">지금 빵 꺼내기</button>';
    else if (playing) {
        const palette = a.kind === 'cake' ? cakeTokens : flowerTokens;
        content = '<div class="mini-goal"><h3>주문 그림</h3>' + board(a, true) + '</div><p class="mini-instruction">' + info.instruction + '</p><div class="mini-palette">' + palette.map(t => '<button data-mini-token="' + t + '" aria-pressed="' + (selected === t) + '">' + cell(t) + '<span>' + miniTokens[t].name + '</span></button>').join('') + '<button data-mini-erase aria-pressed="' + (selected === null) + '">지우개</button></div><p class="mini-selection" role="status">선택: ' + (selected ? tokenName(selected) : '지우개') + '</p><div class="mini-work ' + (a.kind === 'cake' ? 'cake-work' : 'flower-work') + '"><div class="mini-base">' + (a.kind === 'cake' ? miniArt(0, '꾸미기 케이크') : Array.from({ length: 4 }, (_, i) => miniArt(2, (i + 1) + '번 꽃병')).join('')) + '</div>' + board(a, false) + '</div><button id="mini-finish" class="primary">완성하기</button>';
    }
    else
        content = '<div class="mini-outcome ' + (a.phase === 'success' ? 'success' : 'failed') + '">' + miniArt(a.phase === 'success' ? a.kind === 'oven' ? 3 : 7 : a.kind === 'oven' ? 1 : a.kind === 'cake' ? 0 : 2, a.phase === 'success' ? '완성 기념품' : '다음 도전') + '<h3>' + (a.phase === 'success' ? '멋지게 완성했어요!' : '다시 살펴볼까요?') + '</h3><p>' + esc(a.reason ?? '') + '</p><p>' + (a.phase === 'success' ? info.reward + ' · 처음 성공할 때 장식으로 보관해요.' : '연습 기록을 남겼어요. 카페 자산은 잃지 않아요.') + '</p>' + (retry ? '<button id="mini-retry" class="primary">같은 시간 안에 한 번 더</button>' : '') + '<button id="mini-leave" class="secondary">카페로 돌아가기</button></div>';
    d.innerHTML = '<article class="mini-sheet"><header><div><p class="eyebrow">준비한 재료로 만드는 작은 도전</p><h2>' + info.name + '</h2></div><button id="mini-close" class="secondary" aria-label="미니게임 그만하고 카페로">그만하기</button></header><p class="mini-clock" role="status">영업·손님 대기 멈춤 · <b id="mini-seconds">' + remaining + '</b>초 이내</p><p class="mini-error" role="alert">' + esc(error) + '</p>' + content + '<p class="mini-footnote">정답률에는 영향을 주지 않아요. 새로고침해도 제한시간은 같아요.</p></article>';
    d.querySelectorAll('[data-mini-token]').forEach(b => b.onclick = () => { selected = b.dataset.miniToken; projection = ''; pollMiniUi(g); });
    d.querySelector('[data-mini-erase]')?.addEventListener('click', () => { selected = null; projection = ''; pollMiniUi(g); });
    d.querySelectorAll('[data-mini-position]').forEach(b => b.onclick = () => transact(() => placeMini(g, Number(b.dataset.miniPosition), selected)));
    d.querySelector('#mini-finish')?.addEventListener('click', () => transact(() => finishMini(g)));
    d.querySelector('#mini-retry')?.addEventListener('click', () => transact(() => retryMini(g)));
    d.querySelector('#mini-leave')?.addEventListener('click', () => transact(() => leaveMini(g)));
    d.querySelector('#mini-close')?.addEventListener('click', () => transact(() => leaveMini(g)));
}
export function pollMiniUi(g) {
    if (g !== current || g.mode !== 'CAFE_GROWTH')
        return;
    const before = JSON.stringify([g.miniGames, g.miniCollection]);
    pollMini(g);
    const added = gifts(g);
    if (added || JSON.stringify([g.miniGames, g.miniCollection]) !== before)
        flush();
    const a = activeMini(g), banner = document.getElementById('mini-banner') ?? document.createElement('aside');
    banner.id = 'mini-banner';
    if (!banner.isConnected)
        document.getElementById('make')?.before(banner);
    const waiting = g.miniGames?.offers.find(a => a.phase === 'preparing' || a.phase === 'ready'), key = JSON.stringify([g.status, g.miniGames, g.miniCollection, selected, error]);
    if (key !== projection) {
        projection = key;
        banner.hidden = g.status !== 'RUNNING' || !!a || !waiting && !canExtraMini(g);
        if (waiting && !a && g.status === 'RUNNING') {
            const info = miniInfo(waiting.kind);
            banner.innerHTML = '<strong>작은 특별 주문' + ' · ' + info.name + '</strong><p>' + (waiting.phase === 'ready' ? '재료가 준비됐어요! 카페에서 도전해요.' : '재료 준비: 서로 다른 문제 정답 ' + waiting.answers.length + '/' + waiting.requiredCorrect) + '</p><button id="mini-start" class="secondary">' + (waiting.phase === 'ready' ? '준비 완료 · 미니게임 시작' : '재료 준비 · 문제 풀기') + '</button><button id="mini-skip" class="mini-link">이번에는 쉬기</button>';
            banner.querySelector('#mini-start').addEventListener('click', () => { if (waiting.phase === 'preparing') {
                document.getElementById('make')?.click();
                return;
            } if (!document.getElementById('problem-panel')?.hidden) {
                error = '문제 확인을 마치고 카페로 돌아와 주세요.';
                return;
            } if (['sort', 'machine', 'tray'].includes(waiting.kind) && !waiting.lease) {
                arcadeBriefing(waiting.kind, difficulty => transact(() => { waiting.arcade = newArcade(waiting.kind, difficulty, rushSeed(waiting.id), g.miniNow()); return startMini(g, waiting.id); }), () => { });
                return;
            } if ((waiting.kind === 'oven' || waiting.kind === 'flowers') && !waiting.lease) {
                craftBriefing(waiting.kind, difficulty => transact(() => { waiting.craft = createCraft(waiting.kind, difficulty, rushSeed(waiting.id), g.miniNow()); return startMini(g, waiting.id); }), () => { });
                return;
            } if (waiting.kind === 'cake' && !waiting.lease) {
                rushBriefing(difficulty => transact(() => { waiting.rush = newCakeRush(rushSeed(waiting.id), difficulty, g.miniNow()); return startMini(g, waiting.id); }), () => { }, g.cafeLevel, g.miniCollection?.cakeRecords);
                return;
            } selected = waiting.kind === 'cake' ? 'strawberry' : waiting.kind === 'flowers' ? 'pink' : null; transact(() => startMini(g, waiting.id)); });
            banner.querySelector('#mini-skip').addEventListener('click', () => transact(() => skipMini(g, waiting.id)));
        }
        else if (!a && canExtraMini(g)) {
            banner.innerHTML = '<strong>특별 주문을 한 번 더?</strong><p>이번 영업의 마지막 도전이에요. 재료는 정답 두 개로 준비해요.</p><button id="mini-extra" class="secondary">추가 도전 받기</button>';
            banner.querySelector('button').onclick = () => transact(() => offerMini(g, undefined, true));
        }
        if (a && g.status === 'RUNNING')
            render(a);
        else {
            document.getElementById('mini-dialog')?.remove();
            document.body.classList.remove('mini-active');
            document.getElementById('app')?.removeAttribute('inert');
        }
    }
    const seconds = document.getElementById('mini-seconds');
    if (seconds && a?.lease)
        seconds.textContent = String(Math.max(0, Math.ceil((a.lease.deadlineAt - g.miniNow()) / 1000)));
    const clock = document.querySelector('.mini-clock');
    if (clock && !miniPaused(g))
        clock.textContent = '도전 결과 · 영업은 다시 진행 중이에요.';
    const dialog = document.getElementById('mini-dialog');
    if (dialog)
        refreshMiniArt(dialog);
}
function animate() { if (!current)
    return; const live = activeMini(current), root = document.getElementById('mini-dialog'); if (live?.arcade && root)
    animateArcade(root, live.arcade); if (live?.craft && root)
    animateCraft(root, live.craft); if (live?.rush && root)
    animateRush(root, live.rush); const a = activeMini(current), pointer = document.getElementById('oven-pointer'); if (pointer && a?.kind === 'oven' && a.phase === 'playing') {
    const value = ovenPosition(a.gaugeStartedAt, current.miniNow());
    pointer.style.left = value + '%';
    pointer.parentElement?.setAttribute('aria-valuenow', String(Math.round(value)));
} raf = requestAnimationFrame(animate); }
