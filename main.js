import { renderProgressiveGuidance } from './progressiveGuidance.js';
import { unlocked } from './progressiveFeatures.js';
import { applyProgressiveVisibility } from './progressiveVisibility.js';
import { prepareCompletedShowcase } from './cafeShowcase.js';
import { beginManagementUi, pollManagementUi } from './managementLive.js';
import { setArcadeSound } from './arcadeUi.js';
import { setCraftSound } from './craftUi.js';
import { setRushSound } from './cakeRushUi.js';
import { beginMiniUi, pollMiniUi } from './miniGameUi.js';
import { miniAnswer, activeMini } from './miniGames.js';
import { beginSpecializationUi, pollSpecializationUi, specializationArt } from './specializationUi.js';
import { specializationById } from './specializationConfig.js';
import { freeMealAnchor } from './furnitureAnchors.js';
import { freeFurniture, freeHallLayers, furnitureVisualVersion } from './freeFurniture.js';
import { growthStaffPanel } from './recruitUi.js';
import { workerBaseArt } from "./recruitArt.js";
import { branchCatalog, branchRoom } from "./growthBranch.js";
import { beginBranchUi, pollBranchUi } from "./growthBranchUi.js";
import { createGrowthSave } from './growthSave.js';
import { beginLongGrowth, pollLongGrowth } from './longGrowthUi.js';
import { growthRuntime } from './growthRuntime.js';
import { webAsset } from './webAsset.js';
import { imageReady } from './imageLoading.js';
import { motionFrame, bubbleCorrection } from './animationPresentation.js';
import { workerPoseArt, preloadMotionSheets, workerTrayPlacement } from './motionSprites.js';
import { EventRecovery } from './eventRecovery.js';
import { renderEventPanel } from './eventUi.js';
import { guestMotion, workerMotion, motionArt } from './characterMotion.js';
import { restoreClassroomCafe } from './classroomCheckpoint.js';
import { LearningAnalyticsV1 } from './learningAnalytics.js';
import { mountCafeResults } from './cafeResults.js';
import { questionCatalog } from './questionPack.js';
import { ClassroomUi } from './classroomUi.js';
import { passageHtml, materialHtml } from './reading.js';
import { CafeRunUi } from './cafeRunUi.js';
import { specialQuestions } from './hospitalityConfig.js';
import { productionReceipt, stockStatus } from './playLoop.js';
import { FinalUx } from './finalUx.js';
import { SessionClock, ActionGate } from './uxState.js';
import { installAssetFallbacks } from './assetFallback.js';
import { createLearning } from './learningIntegration.js';
import { renderQuestionText, escapeText, renderDiagram } from './questionRenderer.js';
import { GameFeel } from './gameFeel.js';
import { ModeFlow } from './modeUi.js';
import { itemCatalog, specialNames, specialIcons } from './phase4Config.js';
import { showOrderBubble, syncOrderBubble, assetSignature } from './presentation.js';
import { personalityLabels } from './customerRules.js';
import { selectCustomerPose, customerPoseArt, poseGeometry, preloadCustomerPoses, selectedPoseAsset } from './customerPoses.js';
import { SpatialScene, hallGrowthSpecs, createSpace } from './spatial.js';
import { DepartureDialogue } from './departureDialogue.js';
import { icon } from './uiIcons.js';
import { sprite } from './art.js';
import { staffBalance } from './config.js';
import { staffDefinitions } from './staff.js';
import { foodVisual } from './foodVisual.js';
import { CafeGame } from './game.js';
import { customers, menuDefinitions } from './data.js';
let classroomElapsed = null;
const developerMode = new URLSearchParams(location.search).has('dev');
const clock = new SessionClock(), purchaseGate = new ActionGate();
const feel = new GameFeel();
setRushSound(id => { void feel.audio.effect(id); });
setCraftSound(id => { void feel.audio.effect(id); });
setArcadeSound(id => { void feel.audio.effect(id); });
const app = document.querySelector('#app');
const readVisits = new Set();
let rereading = false;
let specialAttempt = null;
let game = null;
let engine = createLearning(undefined, false);
let active = null;
let feedback = null;
let panelOpen = false;
let last = performance.now();
let productionUntil = 0;
let investmentOpen = false;
let investmentTab = 'cafe';
let investmentMessage = '';
let celebrationUntil = 0;
let celebrationLevel = 0;
let renderedInvestmentKey = '';
let receipt = [];
let stockKey = "";
let outcomeTimer = 0;
let departure = new DepartureDialogue();
let departureKey = "";
let manualTipShown = false, autoTipShown = false, lastStaffCount = 0, hintUntil = 0;
let analytics = new LearningAnalyticsV1('legacy-demo');
let displayedResult = null;
let deliveryMenu = 'coffee';
let scene = null;
const guestLooks = new Map();
let selectedGuest = null;
let selectedUntil = 0;
let detailKey = '';
const format = (s) => Math.floor(Math.ceil(s) / 60).toString().padStart(2, '0') + ':' + (Math.ceil(s) % 60).toString().padStart(2, '0');
const labels = { ENTERING: '어서 오세요!', MOVING_TO_SEAT: '자리로 가는 중', ORDERING: '메뉴 고르는 중', WAITING_FOR_FOOD: '음식을 기다려요', PREPARING: '주문 준비 중', SERVING: '음식 배달 중', EATING: '맛있게 먹는 중', PAYING: '결제 중', LEAVING: '다음에 또 올게요' };
app.innerHTML = `<main class="shell"><header class="brand"><span class="logo">${sprite('coffee')}</span><div><p class="eyebrow">CAFE LEARNING TYCOON</p><h1>카페 학습 타이쿤</h1><p>문제 하나, 맛있는 한 걸음</p></div></header><section id="setup" class="setup"><div class="setup-people">${sprite('owner', 'welcome-owner')}${sprite('staff-1', 'welcome-staff')}</div><div class="welcome-card"></div><div class="welcome-note">공부하는 만큼, 나만의 카페가 완성돼요.</div></section><section id="playing" hidden><div class="session-tools"><span class="tools-title">카페 영업 중</span><details id="session-menu" class="session-menu"><summary aria-label="영업 메뉴">메뉴</summary><div class="session-menu-content"></div></details></div><div class="hud"><div><span>남은 시간</span><strong id="timer"></strong></div><div><span>푼 문제</span><strong id="question-count">0</strong></div><div class="money-card"><span>보유금</span><strong id="money"></strong></div><div class="level-card"><span>나의 카페</span><strong id="cafe-level"></strong></div></div><div class="game-layout"><section class="cafe" id="cafe-room"><span id="cafe-name" class="room-name"></span><div id="decor" class="decor"></div><div class="seats" id="seats"></div><div class="pickup-marker">음식 받는 곳</div><div class="workers" id="workers"></div><div class="counter-foreground"></div></section><section class="lesson-card"><button id="make" class="primary" aria-label="음식 만들기">${icon('menu')}<span>음식 만들기</span></button><button id="serve" class="secondary">서빙</button><button id="special-order" class="secondary" hidden>특별 주문 만들기</button><p id="hospitality-note" class="hospitality-note" role="status" hidden></p><span id="service-status" role="status"></span><p id="service-hint" class="service-hint" role="status" hidden></p></section><div id="departure-talks" class="departure-talks" role="log" aria-live="polite" hidden></div><aside class="pantry"><div class="pantry-head"><h2>부족 재고</h2><span id="warehouse-caption"></span><span id="stock-count"></span></div><div id="stocks"></div><div id="production" class="production" aria-live="polite"></div></aside><nav class="scene-actions" aria-label="카페 관리"><button id="invest" aria-label="카페 키우기"><span class="nav-symbol">${icon('grow')}</span>성장</button><button data-focus-tab="staff" aria-label="직원 관리"><span class="nav-symbol">${icon('staff')}</span>직원</button><button data-focus-tab="menu" aria-label="메뉴 강화"><span class="nav-symbol">${icon('menu')}</span>메뉴</button><button data-focus-tab="warehouse" aria-label="창고 관리"><span class="nav-symbol">${icon('warehouse')}</span>창고</button></nav><div id="live-stats"></div><div id="item-effects" class="item-effects"></div><div class="mode-status"><span id="mode-label"></span><span id="save-status"></span><button id="end-business" hidden>영업 마치기</button><button id="leave-game">나가기</button></div><aside id="guest-detail" class="guest-detail" hidden aria-label="선택한 손님 상세"></aside></div></section><section id="results" class="results" hidden></section></main><section id="problem-panel" class="problem-panel" hidden aria-label="음식 만들기 학습 패널"></section><section id="investment-panel" class="investment-panel" hidden aria-label="카페 투자 패널"></section><div id="celebration" class="celebration" hidden aria-live="polite"></div>`;
const el = (id) => document.getElementById(id);
const ux = new FinalUx(() => game);
installAssetFallbacks();
el('playing').before(document.querySelector('.session-tools'));
document.querySelector('.session-menu-content').append(el('game-help'), el('sound-settings'), el('leave-game'), el('end-business'));
el('session-menu').addEventListener('click', e => { if (e.target.closest('button'))
    el('session-menu').removeAttribute('open'); });
document.querySelector('.game-layout').prepend(el('first-guide'));
const runUi = new CafeRunUi(() => game);
el('serve').onclick = () => { advanceTime(); if (game?.serveReadyOrder())
    render(); };
export function startSession(session, pool, questionRandom, learningOptions = {}) { classroomElapsed = null; el('workers').innerHTML = ''; el('seats').innerHTML = ''; el('decor').innerHTML = ''; delete el('cafe-room').dataset.artLevel; guestLooks.clear(); preloadMotionSheets(); selectedGuest = null; detailKey = ''; app.classList.add('in-session'); game = session; game.enableEvents(); if (game.mode === 'CLASS_MATCH' && game.status === 'RUNNING')
    game.events.align(game.elapsedTime, game); if (game.status === 'CLOSED')
    game.events.close(); runUi.start(); clearTimeout(outcomeTimer); game.service.manualOwner = true; game.enableHallGrowth(); departure = new DepartureDialogue(); departureKey = ''; manualTipShown = false; autoTipShown = game.service.paid.length > 0; lastStaffCount = game.service.paid.length; hintUntil = 0; el('service-hint').hidden = true; receipt = []; stockKey = ""; displayedResult = null; clock.start(); ux.start(); feel.start(session); scene = new SpatialScene(game.cafeLevel, game.cafe.maxCustomers, true); scene.sync(game); readVisits.clear(); rereading = false; engine = createLearning(pool, session.policy.persistence === 'saved-cafe', questionRandom, learningOptions); analytics = new LearningAnalyticsV1(engine.provider.packId); const growthState = growthRuntime.begin(session, pool, { engine, analytics, readVisits: [] }, () => ({ engine, analytics, readVisits: [...readVisits], specialAttempt })); engine = growthState.engine; analytics = growthState.analytics; readVisits.clear(); growthState.readVisits.forEach(n => readVisits.add(n)); const sessionAnalytics = analytics; analytics.packName = pool?.[0]?.unit ?? '기본 학습'; void questionCatalog.list().then(list => { if (analytics === sessionAnalytics)
    analytics.packName = list.find(p => p.packId === engine.provider.packId)?.selectionLabel ?? list.find(p => p.packId === engine.provider.packId)?.title ?? analytics.packName; }).catch(() => { }); game.enableHospitality(specialQuestions(engine.provider.list()).map(q => q.questionId)); specialAttempt = growthState.specialAttempt ?? null; active = null; feedback = null; panelOpen = false; investmentOpen = false; investmentMessage = ''; renderedInvestmentKey = ''; celebrationUntil = 0; productionUntil = 0; beginLongGrowth(session, growthRuntime.savedFor(session) ?? createGrowthSave(), growthRuntime.businessId(), () => modeFlow.flush()); modeFlow.attach(session, pool); beginMiniUi(session, () => modeFlow.flush()); beginManagementUi(session, () => modeFlow.flush()); beginSpecializationUi(session, () => modeFlow.flush(), () => growthRuntime.businessId()); beginBranchUi(session, growthRuntime.savedFor(session) ?? createGrowthSave(), () => modeFlow.flush()); el('setup').hidden = true; el('results').hidden = true; el('problem-panel').hidden = true; el('playing').hidden = false; el('make').disabled = false; el('investment-panel').hidden = true; last = performance.now(); render(); }
document.querySelectorAll('[data-focus-tab]').forEach(b => b.onclick = () => { if (game?.status !== 'RUNNING')
    return; investmentTab = b.dataset.focusTab; selectedGuest = null; detailKey = ''; el('guest-detail').hidden = true; investmentOpen = true; panelOpen = false; renderProblem(); renderInvestment(true); });
el('invest').addEventListener('click', () => { investmentTab = 'cafe'; if (game?.status !== 'RUNNING')
    return; selectedGuest = null; detailKey = ''; el('guest-detail').hidden = true; investmentOpen = true; panelOpen = false; renderProblem(); renderInvestment(true); });
el('special-order').addEventListener('click', () => { const g = game?.specialOrder; if (!game || !g || game.status !== 'RUNNING' || (active && !feedback))
    return; const ids = game.hospitality.questions, q = engine.present(ids[g.id % ids.length], ids); if (!q)
    return; clearTimeout(outcomeTimer); active = q; feedback = null; specialAttempt = g.id; selectedGuest = null; investmentOpen = false; el('investment-panel').hidden = true; panelOpen = true; renderProblem(); });
el('make').addEventListener('click', () => { if (game?.status !== 'RUNNING' || activeMini(game))
    return; selectedGuest = null; detailKey = ''; el('guest-detail').hidden = true; investmentOpen = false; el('investment-panel').hidden = true; panelOpen = true; if (!active)
    active = engine.next(game?.events.mission?.id === 'gourmet' ? 'challenge' : game?.events.active ? 'standalone' : undefined); renderProblem(); if (active.type === 'short_answer' && !feedback)
    el('answer-input')?.focus(); });
function renderProblem() {
    if (active && game)
        game.events.questionPresented(active.questionId ?? active.question, !!active.readingContext || active.question.includes('\n'));
    const context = active?.readingContext;
    const visit = context?.visit ?? 0;
    const reading = !!context && (!readVisits.has(visit) || rereading);
    if (panelOpen && context && reading) {
        const p = el('problem-panel');
        p.hidden = false;
        p.innerHTML = '<div class="problem-head"><span>국어 파일럿 · 교사 검토 대기</span><button id="close-reading" aria-label="카페로 돌아가기">✕</button></div><p class="eyebrow">지문 읽기 · ' + context.position + '/5</p><h2>' + escapeText(context.title) + '</h2>' + passageHtml(context) + '<button id="reading-ready" class="primary">' + (rereading ? '문제로 돌아가기' : '읽었어요 · 문제 풀기') + '</button><p class="hint">30문항 파일럿 · 한 묶음이 끝나면 다음 지문을 읽어요.</p>';
        el('close-reading').onclick = () => { rereading = false; returnToCafe(); };
        el('reading-ready').onclick = () => { readVisits.add(visit); rereading = false; renderProblem(); };
        p.scrollTop = 0;
        return;
    }
    const p = el('problem-panel');
    p.hidden = !panelOpen;
    if (!panelOpen || !active)
        return;
    p.dataset.spacedReview = String(!!active.spacedReview);
    p.innerHTML = `<div class="problem-head"><span>${specialAttempt !== null ? '특별 주문 · 시그니처 도전' : '✦ 음식을 만드는 작은 도전'}</span><button id="close-problem" aria-label="문제 패널 닫기">✕</button></div><p class="eyebrow">${escapeText(active.subject)}${active.learningPhase === 'review' ? ' · 개념 복습' : active.learningPhase === 'mastery' ? ' · 숙달 확인' : ''} · ${active.grade}학년 · ${active.type === 'ox' ? 'OX' : active.type === 'short_answer' ? '단답형' : '객관식'}${game?.mode === 'CAFE_GROWTH' ? ' · ' + (game.elapsedTime < 180 ? '준비' : game.elapsedTime < 660 ? '연습' : '도전·복습') + ' · 난이도 ' + active.difficulty : ''}</p>${feedback?.correct ? '<h2 class="production-result-title">' + (feedback.productionAllowed === false ? '복습을 확인했어요!' : '음식이 완성됐어요!') + '</h2>' : '<h2>' + renderQuestionText(active.question) + '</h2>' + renderDiagram(active.diagram, active.spacedReview ? '과학 그림' : '도형')}${feedback ? '<div class="feedback ' + (feedback.correct ? 'correct' : 'incorrect') + '"><strong>' + (feedback.correct ? (feedback.productionAllowed === false ? '이번에는 정확히 알았어요! 다음 문제에서도 확인해 볼까요?' : '정답! 음식이 만들어졌어요.') : (engine.progress.spaced ? '아쉽지만 이번에는 음식이 만들어지지 않았어요. 설명을 확인하고 다시 도전해요!' : '괜찮아요, 함께 확인해요')) + '</strong>' + (feedback.correct ? '<p class="production-summary">' + receipt.filter(r => r.quantity > 0).length + '종 · ' + receipt.reduce((n, r) => n + r.quantity, 0) + '개 추가 보관 · MAX ' + receipt.filter(r => r.quantity === 0).length + '종</p><details class="answer-review"><summary>정답·풀이 보기</summary><p>정답: ' + renderQuestionText(feedback.answer) + '</p><p>' + renderQuestionText(feedback.explanation) + '</p></details>' : '<p>정답: ' + renderQuestionText(feedback.answer) + '</p><p>' + renderQuestionText(feedback.explanation) + '</p>') + '</div><button class="primary" id="return-cafe">카페로 돌아가기 →</button>' : active.type === 'short_answer' ? '<form id="answer-form"><label>답<input id="answer-input" maxlength="500" autocomplete="off" inputmode="text" required></label><button class="primary">정답 확인</button></form>' : '<div class="choices">' + active.choices.map(c => '<button data-answer="' + escapeText(c) + '">' + renderQuestionText(c) + '</button>').join('') + '</div>'}<p class="hint">문제를 푸는 동안에도 영업 시간과 손님 대기시간은 흘러요.</p>`;
    if (context) {
        const meta = document.createElement('div');
        meta.className = 'reading-progress';
        meta.innerHTML = '<span>교사 검토 대기 · ' + escapeText(context.title) + ' · ' + context.position + '/5' + (active.isRemediation ? ' · 오답 복습' : '') + '</span><button id="reopen-passage" class="secondary">지문 다시 보기</button>';
        p.querySelector('.problem-head').after(meta);
        el('reopen-passage').onclick = () => { rereading = true; renderProblem(); };
        if (context.materialRequired && !feedback) {
            const m = document.createElement('div');
            m.innerHTML = materialHtml(context);
            p.querySelector('h2').after(m);
        }
    }
    if (context && feedback && context.position === 5 && !active.isRemediation) {
        const done = document.createElement('p');
        done.className = 'reading-complete';
        done.textContent = '이 지문 5문항을 마쳤어요. 다음 음식 만들기로 이어가세요.';
        p.querySelector('.feedback').append(done);
    }
    if (active.material && !feedback) {
        void classroom.material(active, p);
        const m = active.material;
        if ((m.selectionCount ?? 1) > 1) {
            const choices = p.querySelector('.choices');
            choices.innerHTML = '<form id="publisher-multi"><p>' + m.selectionCount + '개를 고르세요.</p>' + m.originalChoices.map(c => '<label><input type="checkbox" value="' + escapeText(c) + '">' + escapeText(c) + '</label>').join('') + '<button class="primary" disabled>정답 확인</button></form>';
            const form = p.querySelector('#publisher-multi');
            form.onchange = () => { form.querySelector('button').disabled = form.querySelectorAll('input:checked').length !== m.selectionCount; };
            form.onsubmit = e => { e.preventDefault(); const selected = [...form.querySelectorAll('input:checked')].map(n => n.value); if (selected.length === m.selectionCount)
                submit(selected.sort((a, b) => m.originalChoices.indexOf(a) - m.originalChoices.indexOf(b)).join(' ')); };
        }
    }
    el('close-problem').onclick = returnToCafe;
    el('return-cafe')?.addEventListener('click', returnToCafe);
    if (feedback?.correct) {
        const reward = document.createElement('div');
        reward.className = 'production-receipt';
        reward.setAttribute('aria-label', '이번 정답으로 만든 음식');
        reward.innerHTML = receipt.map(r => '<div data-reward="' + r.menuId + '">' + foodVisual(game.menus.find(m => m.menuId === r.menuId)) + '<b>' + r.name + '</b><strong>' + (r.quantity ? '+' + r.quantity : 'MAX · +0') + '</strong><small>' + r.stock + '/' + r.maxStock + '</small></div>').join('');
        p.querySelector('.feedback').append(reward);
    }
    p.querySelectorAll('[data-answer]').forEach(b => b.onclick = () => submit(b.dataset.answer));
    el('answer-form')?.addEventListener('submit', e => { e.preventDefault(); submit(el('answer-input').value); });
    el('next')?.addEventListener('click', () => { if (game?.status !== 'RUNNING')
        return; active = engine.next(game?.events.mission?.id === 'gourmet' ? 'challenge' : game?.events.active ? 'standalone' : undefined); feedback = null; renderProblem(); if (active.type === 'short_answer')
        el('answer-input')?.focus(); });
}
function submit(answer) { advanceTime(); if (!classroom.canSubmit() || game?.status !== 'RUNNING' || activeMini(game) || feedback || !answer.trim() || active?.material && el('problem-panel').dataset.materialReady !== 'true')
    return; const r = engine.submit(answer); if (!r)
    return; feedback = r; const aq = active; analytics.record({ questionId: aq.questionId ?? r.questionId, questionPackId: engine.provider.packId, questionType: aq.type, learningObjective: { id: aq.skillId ?? r.skillId, label: aq.skillLabel ?? aq.unit }, question: aq.question, choices: aq.choices, diagram: aq.diagram, answer: r.answer, explanation: r.explanation, passage: aq.readingContext ? [...aq.readingContext.paragraphs, ...aq.readingContext.tables.map(t => t.caption + '\n' + t.columns.join(' · ') + '\n' + t.rows.map(row => row.join(' · ')).join('\n'))].join('\n') : undefined, restricted: !!aq.material || aq.publicExportAllowed === false }, answer, r.correct, { isTwin: r.isTwin, isRemediation: r.isRemediation, sourceQuestionId: r.sourceQuestionId }); const learningSaved = true; const before = game.successfulProduction, quantity = aq.spacedReview ? 1 : game.boosterRemaining ? 3 : 1; const stocksBefore = new Map(game.menus.map(m => [m.menuId, m.stock])); game.recordAnswer(r.correct, aq.difficulty, aq.spacedReview ? 1 : undefined); analytics.spacedReview = engine.spacedReport(); miniAnswer(game, r.correct, aq.questionId ?? r.questionId); const signatureMade = specialAttempt !== null && game.completeSignature(specialAttempt, r.correct); specialAttempt = null; receipt = r.correct ? productionReceipt(stocksBefore, game.menus) : []; if (!r.correct)
    productionUntil = 0; if (r.correct)
    productionUntil = performance.now() + 1800; renderProblem(); if (signatureMade) {
    const note = document.createElement('p');
    note.className = 'signature-ready';
    note.textContent = game.service.paid.length ? '시그니처 플레이트 완성! 직원들이 가져다드려요.' : '시그니처 플레이트 완성! 서빙하기를 눌러 가져다주세요.';
    document.querySelector('.feedback')?.append(note);
} if (r.hint) {
    const hint = document.createElement('p');
    hint.className = 'concept-hint';
    hint.textContent = '개념 힌트: ' + r.hint;
    document.querySelector('.feedback')?.append(hint);
} if (!r.correct && ux.wrong()) {
    const note = document.createElement('p');
    note.textContent = '비슷한 문제가 나중에 다시 나와요.';
    document.querySelector('.feedback')?.append(note);
} if (!learningSaved) {
    const warning = document.createElement('p');
    warning.className = 'save-error';
    warning.textContent = '학습 기록을 저장하지 못했어요. 이번 영업에서는 복습이 계속됩니다.';
    document.querySelector('.feedback')?.append(warning);
} const chosen = document.createElement('p'); chosen.className = 'answer-outcome'; chosen.textContent = '내 답: ' + answer + ' · 정답: ' + r.answer; document.querySelector('.feedback')?.append(chosen); if (game.mode === 'CAFE_GROWTH')
    modeFlow.flush(); document.dispatchEvent(new CustomEvent('classroom-answer')); feel.answer(r.correct, game.successfulProduction - before, quantity, game.menus.length); render(); if (r.correct) {
    const session = game, answer = r;
    clearTimeout(outcomeTimer);
    outcomeTimer = window.setTimeout(() => { if (game === session && game.status === 'RUNNING' && feedback === answer && panelOpen && !document.querySelector('.answer-review[open]'))
        returnToCafe(); }, 2300);
} }
export function render() {
    if (game) {
        applyProgressiveVisibility(game);
        renderProgressiveGuidance(game);
    }
    if (!game)
        return;
    recovery.poll();
    runUi.poll();
    if (game.status === 'CLOSED' && displayedResult === game) {
        if (game.mode === 'CAFE_GROWTH') {
            pollLongGrowth(game, engine);
            pollBranchUi(game);
            pollSpecializationUi(game);
            pollMiniUi(game);
            pollManagementUi(game);
        }
        modeFlow.refresh(game);
        if (game.status === 'CLOSED') {
            analytics.spacedReview = engine.spacedReport();
            mountCafeResults(game, analytics);
        }
        renderEventPanel(game, false);
        feel.poll(game);
        ux.poll(game);
        return;
    }
    el('question-count').textContent = String(game.stats.attempted);
    el('timer').textContent = format(game.remainingSeconds);
    el('timer').classList.toggle('ending-time', game.remainingSeconds <= 60);
    el('money').textContent = game.money.toLocaleString('ko-KR', game.money >= 1000000 ? { notation: 'compact', maximumFractionDigits: 1 } : {}) + ' 원';
    el('money').title = game.money.toLocaleString() + ' 원';
    el('cafe-level').textContent = game.cafeLevel + '단계';
    el('cafe-level').title = cafeDisplayName(game.cafeLevel);
    el('cafe-name').textContent = game.specialization ? specializationById(game.specialization.selected).name : game.branchId ? branchCatalog.find(b => b.id === game.branchId).name : cafeDisplayName(game.cafeLevel);
    el('warehouse-caption').textContent = '창고 ' + (game.warehouseLevel === 6 ? 'MAX' : game.warehouseLevel + '단계') + ' · 최대 ' + game.warehouse.capacity + '개';
    el('stock-count').textContent = game.menus.length + '종';
    scene.sync(game);
    renderRoom();
    renderWorkers();
    renderCompactStock();
    el('production').textContent = performance.now() < productionUntil ? '생산 완료 · 총 ' + receipt.reduce((sum, r) => sum + r.quantity, 0) + '개 보관' : '';
    const serve = el('serve');
    serve.hidden = game.service.paid.length > 0;
    serve.disabled = !game.readyToServe.length || game.service.workers[0].state !== 'IDLE';
    serve.textContent = '서빙하기 (' + game.readyToServe.length + ')';
    serve.setAttribute('aria-label', '서빙하기 · 준비 주문 ' + game.readyToServe.length + '개');
    el('service-status').textContent = game.service.paid.length ? '자동 서빙 · 사장님 + 직원 ' + game.service.paid.length + '명' : game.service.workers[0].state === 'IDLE' ? '준비된 주문을 눌러 서빙해요' : '사장님이 음식을 운반하고 돌아와요';
    el('live-stats').textContent = '응대한 손님 ' + game.stats.servedCustomers + '명 · 푼 문제 ' + game.stats.attempted + '개 · 총매출 ' + game.stats.revenue.toLocaleString() + '원';
    renderEventPanel(game, panelOpen);
    renderHospitality();
    renderSeats();
    renderGuestDetail();
    renderDepartureTalks();
    renderServiceHint();
    document.querySelector('.tools-title').textContent = game.status === 'RUNNING' ? '나의 카페' : '오늘의 영업 결과';
    el('leave-game').disabled = game.status !== 'RUNNING';
    el('end-business').disabled = game.status !== 'RUNNING';
    el('item-effects').textContent = [game.goldenRemaining ? '✦ 황금시간 ' + game.goldenRemaining + '주문' : '', game.boosterRemaining ? '생산 UP ' + game.boosterRemaining + '정답' : '', game.vipPending ? '★ VIP 예약' : '', game.elapsedTime < game.hospitality.influenceUntil ? '카페 소개 중' : '', game.elapsedTime < game.hospitality.couponUntil ? '메뉴 강화 할인 1회' : '', game.elapsedTime < game.hospitality.patissierUntil && game.hospitality.patissierOrders ? '파티시에 ' + game.hospitality.patissierOrders + '주문' : '', game.elapsedTime < game.hospitality.criticUntil ? '평론가 추천 1주문' : '', game.elapsedTime < game.hospitality.travelerUntil ? '여행 노트 추천' : ''].filter(Boolean).join(' · ');
    renderInvestment();
    renderCelebration();
    if (game.status === 'CLOSED') {
        clearTimeout(outcomeTimer);
        el('departure-talks').hidden = true;
        el('service-hint').hidden = true;
        displayedResult = game;
        if (game.mode === 'CAFE_GROWTH')
            prepareCompletedShowcase(game);
        document.querySelectorAll('#mode-confirm,#game-method,#sound-panel').forEach(n => n.remove());
        el('guest-detail').hidden = true;
        investmentOpen = false;
        el('investment-panel').hidden = true;
        el('celebration').hidden = true;
        panelOpen = false;
        renderProblem();
        el('make').disabled = true;
        el('playing').hidden = true;
        if (game.policy.persistence === 'none') {
            const r = game.result;
            el('results').hidden = false;
            el('results').innerHTML = `<p class="eyebrow">오늘도 수고했어요</p><h2>오늘의 카페 운영 결과</h2><p>작은 도전들이 맛있는 하루를 만들었어요.</p><p>${game.telemetry.phase4.vipVisits ? '★ VIP ' + game.telemetry.phase4.vipVisits + '명 방문 · ' : ''}${game.telemetry.phase4.regularHighestTier ? '♥ 단골 최고 단계 ' + game.telemetry.phase4.regularHighestTier : ''}</p><div class="result-grid">${[['최종 카페', game.cafeLevel + '단계'], ['총매출', r.revenue.toLocaleString() + ' 원'], ['손님', r.servedCustomers + '명'], ['판매 음식', r.soldFood + '개'], ['푼 문제', r.attempted + '개'], ['정답', r.correct + '개'], ['정답률', r.accuracy + '%']].map(([k, v]) => '<div>' + k + '<strong>' + v + '</strong></div>').join('')}</div><details class="analysis"><summary>개발자 플레이 분석</summary><p>재고 부족: ${game.stockoutEvents}개 주문 · 생산 낭비: ${game.wastedProduction}개 · 성공 생산: ${game.successfulProduction}개 · 대기 중 퇴장: ${game.customersLeft}명</p><button id="export-log" class="secondary">플레이 로그 JSON 저장</button><pre id="log-preview"></pre></details><button class="primary" id="restart">모드 선택으로</button>`;
            el('log-preview').textContent = JSON.stringify(({ ...game.telemetry.export(game.snapshot), cafeRun: game.run?.report() ?? null, learning: engine.report() }), null, 2);
            el('export-log').onclick = () => { if (!game)
                return; const blob = new Blob([JSON.stringify(({ ...game.telemetry.export(game.snapshot), learning: engine.report() }), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cafe-play-log.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
            el('restart').onclick = () => { classroom.leaveFinished(); modeFlow.showModes(); game = null; app.classList.remove('in-session'); investmentOpen = false; el('investment-panel').hidden = true; el('results').hidden = true; el('setup').hidden = false; el('make').disabled = false; };
            if (!developerMode)
                el('results').querySelector('.analysis')?.remove();
        }
    }
    if (game.mode === 'CAFE_GROWTH') {
        pollLongGrowth(game, engine);
        pollBranchUi(game);
        pollSpecializationUi(game);
        pollMiniUi(game);
        pollManagementUi(game);
    }
    modeFlow.refresh(game);
    if (game.status === 'CLOSED') {
        analytics.spacedReview = engine.spacedReport();
        mountCafeResults(game, analytics);
    }
    feel.poll(game);
    ux.poll(game);
}
let nextRender = 0, nextActors = 0;
function frame(now) { if (game?.status === 'CLOSED') {
    if (game.mode === 'CAFE_GROWTH') {
        pollLongGrowth(game, engine);
        pollBranchUi(game);
        pollSpecializationUi(game);
        pollMiniUi(game);
        pollManagementUi(game);
    }
    modeFlow.refresh(game);
    if (game.status === 'CLOSED') {
        analytics.spacedReview = engine.spacedReport();
        mountCafeResults(game, analytics);
    }
    feel.poll(game);
    ux.poll(game);
} last = now; if (game?.status === 'RUNNING') {
    game.tick(growthRuntime.delta(game) ?? (classroomElapsed ? Math.max(0, classroomElapsed() - game.elapsedTime) : clock.take(Date.now(), now)));
    scene.sync(game);
    if (!document.hidden && now >= nextActors) {
        renderActors();
        fitFarewells();
        renderWorkers();
        nextActors = now + 1000 / 30;
    }
    feel.poll(game);
    ux.poll(game);
    if (!document.hidden && (now >= nextRender || game.remainingSeconds === 0)) {
        render();
        nextRender = now + 150;
    }
} requestAnimationFrame(frame); }
requestAnimationFrame(frame);
function cafeDisplayName(level) { return game?.branchId ? branchCatalog.find(b => b.id === game.branchId).name + ' Lv.' + level : game.economy.cafes[level - 1].name; }
function renderRoom() { if (!game)
    return; pollBranchUi(game); pollSpecializationUi(game); pollMiniUi(game); pollManagementUi(game); const room = el('cafe-room'); room.className = 'cafe cafe-lv-' + game.cafeLevel; room.dataset.theme = game.cafe.theme; room.style.setProperty('--room-zoom', String(hallGrowthSpecs[game.cafeLevel - 1].zoom)); room.dataset.hall = hallGrowthSpecs[game.cafeLevel - 1].name; const branch = game.branchId; room.dataset.branch = branch ?? ''; room.dataset.freeLayout = String(!!scene?.space.freeModel); const specArt = specializationArt(game); const roomKey = (specArt ?? 'base') + ':' + String(scene?.space.freeModel) + ':' + game.cafeLevel + ':' + (branch ?? 'legacy') + ':' + JSON.stringify(scene?.space.tables.map(t => [t.x, t.y, t.rotation, t.tableKind, t.furnitureId])) + ':' + (scene?.space.freeModel ? furnitureVisualVersion(scene.space.tables) : 'legacy'); if (room.dataset.artLevel === roomKey) {
    if (!specArt && branch && imageReady(branchRoom(branch))) {
        const url = 'url(' + branchRoom(branch) + ')';
        if (room.style.getPropertyValue('--room') !== url)
            room.style.setProperty('--room', url);
    }
    return;
} room.dataset.artLevel = roomKey; const file = specArt ?? (scene?.space.freeModel ? branchRoom(branch ?? 'garden') : branch ? branchRoom(branch) : game.mode === 'CAFE_GROWTH' && game.cafeLevel >= 11 ? 'assets/art/long-growth/bakery.png' : game.mode === 'CAFE_GROWTH' && game.cafeLevel >= 7 ? 'assets/art/room-7.png' : 'assets/art/' + (game.cafeLevel === 1 ? 'room.png' : 'room-' + game.cafeLevel + '.png')), level = roomKey; const apply = () => { if (room.dataset.artLevel === level)
    room.style.setProperty('--room', 'url(' + webAsset(file) + ')'); }; if (imageReady(file))
    apply();
else {
    let checks = 0;
    const wait = setInterval(() => { if (room.dataset.artLevel !== level || ++checks > 120)
        clearInterval(wait);
    else if (imageReady(file)) {
        clearInterval(wait);
        apply();
    } }, 250);
} renderFurniture(); }
function renderHospitality() { if (!game)
    return; const h = game.hospitality, b = el('special-order'); b.hidden = !game.specialOrder; b.disabled = !!active && !feedback; const n = el('hospitality-note'), event = h.events.at(-1); n.hidden = !event || game.elapsedTime - event.time > 6; n.textContent = event ? event.message : ''; el('cafe-room').classList.toggle('flower-gift', game.elapsedTime < h.flowersUntil); }
function orderArt(menuId) { if (menuId === 'event-signature')
    return '<img class="food-art signature-art" src="' + webAsset('assets/art/hospitality/signature-plate.png') + '" alt="오늘의 시그니처 플레이트">'; const m = game.menus.find(m => m.menuId === menuId); return foodVisual(m); }
// Appearance allocation is UI-only. Original customer definition/patience/RNG are untouched.
function allocateLooks() { if (!game)
    return; const active = new Set(game.guests.map(g => g.id)); for (const id of guestLooks.keys())
    if (!active.has(id))
        guestLooks.delete(id); for (const g of game.guests)
    guestLooks.set(g.id, g.definition.visualKey); }
function lookName(id) { const g = game?.guests.find(g => g.id === id); if (g?.specializationId)
    return g.definition.name; if (g?.specialType)
    return specialNames[g.specialType]; if (g?.helperType || g?.signature)
    return g.definition.name; return customers.find(c => c.visualKey === guestLooks.get(id))?.name ?? '손님'; }
function renderCompactStock() { if (!game)
    return; const demand = new Map(); for (const g of game.guests.filter(g => g.state === 'WAITING_FOR_FOOD'))
    for (const o of g.order)
        demand.set(o.menuId, (demand.get(o.menuId) ?? 0) + o.quantity); const shortage = game.menus.filter(m => m.stock < (demand.get(m.menuId) ?? 0)).length; el('stocks').dataset.menus = String(game.menus.length); document.querySelector('.pantry-head h2').textContent = '음식 재고'; el('stock-count').textContent = game.menus.length + '종 · 부족 주문 ' + shortage + '종'; const key = JSON.stringify(game.menus.map(m => [m.menuId, m.stock, m.maxStock, m.currentLevel, demand.get(m.menuId)])); if (key !== stockKey) {
    stockKey = key;
    const offset = el('stocks').scrollLeft;
    el('stocks').innerHTML = [...game.menus].sort((a, b) => Number(b.stock < (demand.get(b.menuId) ?? 0)) - Number(a.stock < (demand.get(a.menuId) ?? 0))).map(m => { const status = stockStatus(m.stock, m.maxStock, demand.get(m.menuId)); return '<div class="stock" data-stock="' + m.menuId + '" data-status="' + status + '" data-needed="' + ((demand.get(m.menuId) ?? 0) > m.stock) + '" aria-label="' + m.name + ' 재고 ' + m.stock + '/' + m.maxStock + ' ' + (status === '0' ? '품절' : status) + '">' + foodVisual(m) + '<b>' + m.name + '</b><strong>' + m.stock + '/' + m.maxStock + ' · ' + (status === '0' ? '품절' : status) + '</strong></div>'; }).join('');
    el('stocks').scrollLeft = offset;
} for (const n of el('stocks').querySelectorAll('[data-stock]'))
    n.classList.toggle('staff-radar', game.staffAbilities.run?.radarMenu === n.dataset.stock && (game.staffAbilities.run?.radarUntil ?? 0) > game.elapsedTime); el('make').classList.toggle('needs-production', shortage > 0); }
function returnToCafe() { clearTimeout(outcomeTimer); const rewards = [...document.querySelectorAll('[data-reward]')].filter(n => receipt.some(r => r.menuId === n.dataset.reward && r.quantity > 0)).slice(0, 6).map(n => ({ id: n.dataset.reward, rect: n.getBoundingClientRect(), html: n.querySelector('.food-art')?.outerHTML ?? '' })); panelOpen = false; if (feedback) {
    active = null;
    feedback = null;
} renderProblem(); render(); for (const reward of rewards) {
    const target = document.querySelector('[data-stock="' + reward.id + '"]');
    if (!target)
        continue;
    const dest = target.getBoundingClientRect(), shelf = el('stocks').getBoundingClientRect();
    target.classList.add('stock-received');
    setTimeout(() => target.classList.remove('stock-received'), 1000);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches)
        continue;
    const token = document.createElement('div');
    token.className = 'food-transfer';
    token.innerHTML = reward.html;
    token.style.left = reward.rect.left + 'px';
    token.style.top = reward.rect.top + 'px';
    document.body.append(token);
    const animation = token.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + ((Math.min(dest.left, shelf.right - 40)) - reward.rect.left) + 'px,' + (dest.top - reward.rect.top) + 'px) scale(.65)', opacity: .2 }], { duration: 650, easing: 'ease-in-out' });
    animation.onfinish = () => token.remove();
} el('make').focus(); }
function renderFurniture() { if (!game || !scene)
    return; el('seats').innerHTML = ''; if (scene.space.freeModel) {
    el('decor').innerHTML = freeHallLayers(scene.space, specializationArt(game)) + freeFurniture(scene.space);
    return;
} el('decor').innerHTML = scene.space.tables.map(t => { const art = sprite(t.artKey ?? (game.cafeLevel >= 5 ? 'premium-table' : 'table')); return '<div class="space-table" data-table="' + t.tableId + '" style="left:' + t.x + '%;top:' + t.y + '%;--table-scale:' + t.scale + ';--table-flip:' + (t.rotation === 180 ? -1 : 1) + ';z-index:' + Math.round(t.y * 10 - 5) + '">' + art + '</div><div class="table-front" style="left:' + t.x + '%;top:' + t.y + '%;--table-scale:' + t.scale + ';--table-flip:' + (t.rotation === 180 ? -1 : 1) + ';z-index:' + Math.round(t.y * 10 + 2) + '">' + art + '</div>'; }).join(''); }
function renderSeats() { renderActors(); }
const actorMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
function renderActors() {
    if (!game || !scene || !roomVisible)
        return;
    const reduceActors = document.hidden || document.body.classList.contains('motion-low') || actorMotionPreference.matches;
    allocateLooks();
    const layer = el('seats');
    const ids = new Set(game.guests.map(g => String(g.id)));
    for (const token of layer.querySelectorAll('[data-meal-guest]'))
        if (!ids.has(token.dataset.mealGuest))
            token.remove();
    for (const node of layer.querySelectorAll('[data-guest-id]'))
        if (!ids.has(node.dataset.guestId))
            node.remove();
    for (const g of game.guests) {
        const seat = scene.space.seats[g.seat], pose = scene.guest(g);
        let node = layer.querySelector('[data-guest-id="' + g.id + '"]');
        if (!node) {
            preloadCustomerPoses([guestLooks.get(g.id)]);
            node = document.createElement('div');
            node.className = 'spatial-guest';
            node.dataset.guestId = String(g.id);
            node.innerHTML = '<button class="guest" data-select-guest="' + g.id + '">' + customerPoseArt(selectCustomerPose(guestLooks.get(g.id), pose.action, pose.facing)) + '</button>' + motionArt() + '<div class="guest-bubble"></div><span class="seated-meal"></span>';
            layer.append(node);
        }
        const selection = selectCustomerPose(guestLooks.get(g.id), pose.action, pose.facing, guestMotion(g, game.events), motionFrame(g.elapsed, g.id, reduceActors)), geometry = poseGeometry(selection);
        const projection = JSON.stringify([selection.key, pose, g.state, g.specialType, g.regularTier, g.helperType, g.signature, g.runFinal, Math.round(g.patienceRemaining / g.definition.patienceSeconds * 100), g.order, selectedGuest === g.id, panelOpen, el('departure-talks').hidden, game.guests.filter(x => x.state === 'PAYING').slice(0, 2).map(x => x.id)]);
        if (node.dataset.renderProjection === projection)
            continue;
        node.dataset.renderProjection = projection;
        let badge = node.querySelector('.special-badge');
        if (g.specialType) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'special-badge';
                node.append(badge);
            }
            badge.textContent = specialIcons[g.specialType] + (g.specialType === 'regular' ? String(g.regularTier ?? 1) : '');
            badge.title = specialNames[g.specialType];
            node.dataset.special = g.specialType;
            node.classList.toggle('vip-arrival', g.specialType === 'vip' && ['ENTERING', 'MOVING_TO_SEAT'].includes(g.state));
        }
        if (g.specializationId || g.helperType || g.signature || g.runFinal) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'special-badge hospitality-badge';
                node.append(badge);
            }
            badge.textContent = g.specializationId ? specializationById(g.specializationId).name : g.runFinal ? '감사 파티' : g.signature ? '특별 주문' : '도움';
            badge.title = g.definition.name + ' · ' + g.definition.characterTrait;
        }
        node.dataset.actualPose = String(selectedPoseAsset(selection).file.includes('/motion-v15'));
        node.dataset.pose = selection.kind;
        node.dataset.renderIdentity = selection.walk;
        node.dataset.assetFile = selectedPoseAsset(selection).file;
        node.dataset.assetSignature = assetSignature(selectedPoseAsset(selection));
        node.style.setProperty('--pose-size', String(selectedPoseAsset(selection).displayScale ?? 1));
        node.style.setProperty('--anchor-x', geometry.anchorX + '%');
        node.style.setProperty('--anchor-y', geometry.anchorY + '%');
        node.style.aspectRatio = String(geometry.ratio);
        if (node.dataset.poseKey !== selection.key) {
            node.dataset.poseKey = selection.key;
            node.querySelector('button').innerHTML = customerPoseArt(selection);
        }
        node.dataset.seat = seat.seatId;
        node.dataset.bubbleSide = g.seat % 2 === 0 ? 'right' : 'left';
        node.dataset.floor = game.mode === 'CAFE_GROWTH' && game.cafeLevel >= 11 && g.seat % scene.space.tables.length < 4 ? 'upper' : 'ground';
        node.dataset.table = seat.tableId;
        node.dataset.state = pose.action;
        node.dataset.engineState = g.state;
        node.dataset.motion = guestMotion(g, game.events);
        node.dataset.reactionTalk = String(!panelOpen && el('departure-talks').hidden && game.guests.filter(x => x.state === 'PAYING').slice(0, 2).some(x => x.id === g.id));
        node.classList.toggle('motion-muted', game.guests.indexOf(g) >= 12 || document.hidden);
        node.style.setProperty('--motion-delay', String(-(g.id % 5) * .19) + 's');
        node.dataset.visual = guestLooks.get(g.id);
        node.dataset.facing = pose.facing;
        node.dataset.rear = String(seat.rear);
        node.classList.toggle('seated', pose.seated);
        node.classList.toggle('walking', pose.action === 'ENTERING' || pose.action.startsWith('WALKING'));
        node.style.left = pose.x + '%';
        node.style.top = pose.y + '%';
        node.style.opacity = String(pose.opacity);
        node.style.setProperty('--actor-scale', String(seat.scale));
        node.style.zIndex = String(scene.space.freeModel && pose.seated ? Math.round(seat.standPoint.y * 10 + 1) : pose.seated ? Math.round(scene.space.tables.find(t => t.tableId === seat.tableId).y * 10 + (seat.rear ? -1 : 3)) : Math.round(pose.y * 10));
        const button = node.querySelector('button');
        button.setAttribute('aria-label', lookName(g.id) + ' 주문 상세');
        button.setAttribute('aria-pressed', String(selectedGuest === g.id));
        const pending = showOrderBubble(g) && (game.mode !== 'CAFE_GROWTH' || game.cafeLevel < 11 || !game.guests.some(other => other.id < g.id && showOrderBubble(other) && scene.space.seats[other.seat]?.tableId === seat.tableId)), patience = Math.max(0, g.patienceRemaining / g.definition.patienceSeconds);
        const bubble = node.querySelector('.guest-bubble');
        const key = [pending, g.order.map(o => o.menuId + ':' + o.quantity).join(','), Math.round(patience * 100)].join('/');
        node.dataset.orderUi = pending ? 'pending' : 'hidden';
        syncOrderBubble(bubble, pending, key, () => '<div class="bubble ' + (patience < .25 ? 'urgent' : patience < .5 ? 'concern' : '') + '" aria-label="주문 음식"><div class="order-foods">' + g.order.map(o => '<span>' + orderArt(o.menuId) + '<small>×' + o.quantity + '</small></span>').join('') + '</div><span class="patience-meter" role="progressbar" aria-label="인내심" aria-valuenow="' + Math.round(patience * 100) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + patience * 100 + '%"></i></span></div>');
        let meal = layer.querySelector('[data-meal-guest="' + g.id + '"]');
        if (g.state === 'EATING') {
            if (!meal) {
                meal = document.createElement('span');
                meal.className = 'table-meal-token';
                meal.dataset.mealGuest = String(g.id);
                meal.innerHTML = orderArt(g.order[0].menuId);
                layer.append(meal);
            }
            const table = scene.space.tables.find(t => t.tableId === seat.tableId);
            const mealPoint = scene.space.freeModel ? freeMealAnchor(scene.space, seat) : { x: table.x + (g.seat % 2 === 0 ? 2 : -2) * table.scale, y: table.y - 11 * table.scale };
            meal.style.left = mealPoint.x + '%';
            meal.style.top = mealPoint.y + '%';
            meal.style.zIndex = String(Math.round(table.y * 10 + 4));
        }
        else
            meal?.remove();
    }
}
el('seats').addEventListener('click', event => { const target = event.target.closest('[data-select-guest]'); if (!target || !game)
    return; selectedGuest = Number(target.dataset.selectGuest); selectedUntil = game.elapsedTime + 8; detailKey = ''; renderGuestDetail(); });
function renderGuestDetail() { const box = el('guest-detail'), g = game?.guests.find(g => g.id === selectedGuest); if (!game || !g || game.elapsedTime >= selectedUntil || game.status !== 'RUNNING') {
    box.hidden = true;
    selectedGuest = null;
    detailKey = '';
    return;
} box.hidden = false; const key = [g.id, g.state, scene.guest(g).action, Math.ceil(g.patienceRemaining)].join('/'); if (key === detailKey)
    return; detailKey = key; box.innerHTML = '<div><strong>' + lookName(g.id) + '</strong><button aria-label="손님 상세 닫기">×</button></div><p>' + ({ SITTING: '자리에 앉는 중', WALKING_TO_SEAT: '자리로 가는 중', FINISHING: '식사를 마쳤어요', STANDING_UP: '자리에서 일어나는 중', WALKING_TO_EXIT: '다음에 또 올게요' }[scene.guest(g).action] ?? labels[g.state]) + (['WAITING_FOR_FOOD', 'PREPARING', 'SERVING'].includes(g.state) ? ' · 남은 ' + Math.ceil(g.patienceRemaining) + '초' : '') + '</p><p>' + personalityLabels[g.definition.personality] + ' · ' + g.definition.characterTrait + '</p><div class="detail-order">' + g.order.map(o => '<span>' + orderArt(o.menuId) + '<small>' + (o.menuId === 'event-signature' ? '오늘의 시그니처 플레이트' : game.menus.find(m => m.menuId === o.menuId).name) + ' ×' + o.quantity + '</small></span>').join('') + '</div>'; box.querySelector('button').onclick = () => { selectedGuest = null; box.hidden = true; detailKey = ''; }; }
function renderCelebration() { const box = el('celebration'); box.hidden = !game || game.status === 'CLOSED' || performance.now() > celebrationUntil; if (box.hidden)
    return; if (box.dataset.level !== String(celebrationLevel)) {
    box.dataset.level = String(celebrationLevel);
    box.innerHTML = '<button id="skip-celebration" aria-label="축하 연출 닫기">✕</button><p>카페 ' + celebrationLevel + '단계!</p><h2>' + cafeDisplayName(celebrationLevel) + ' OPEN!</h2><p class="hall-unlock">' + hallGrowthSpecs[celebrationLevel - 1].name + ' · 테이블 ' + createSpace(celebrationLevel, true).tables.length + '개 · 이용 좌석 ' + game.cafe.maxCustomers + '석</p><p>' + (celebrationLevel <= 6 ? '새 메뉴' : '더 넓어진 카페') + '</p><div>' + menuDefinitions.filter(m => m.unlockCafeLevel === celebrationLevel).map(m => '<span>' + sprite(m.menuId) + ' ' + m.name + '</span>').join('') + '</div>' + (customers.some(c => c.unlockCafeLevel === celebrationLevel) ? '<p>새로운 손님 ' + customers.filter(c => c.unlockCafeLevel === celebrationLevel).length + '명이 찾아오기 시작했어요!</p>' : '');
    box.onclick = () => { celebrationUntil = 0; box.hidden = true; };
    el('skip-celebration').onclick = box.onclick;
} }
function closeInvestment() { investmentOpen = false; el('investment-panel').hidden = true; const trigger = document.querySelector('[data-focus-tab="' + investmentTab + '"]') ?? el('invest'); trigger.focus({ preventScroll: true }); }
function renderInvestment(force = false) {
    const panel = el('investment-panel');
    panel.hidden = !investmentOpen || !game || game.status !== 'RUNNING';
    if (panel.hidden || !game)
        return;
    const key = JSON.stringify([investmentTab, game.money, game.cafeLevel, game.warehouseLevel, game.menus.map(m => [m.stock, m.currentLevel]), game.service.paid.map(w => w.level), game.itemPurchases, game.goldenRemaining, game.boosterRemaining, game.vipPending, investmentMessage, purchaseGate.blocked, performance.now() < celebrationUntil]);
    if (!force && key === renderedInvestmentKey)
        return;
    renderedInvestmentKey = key;
    const affordability = (cost) => '<p class="afford ' + (game.money < cost ? 'insufficient' : '') + '"><span>보유 ' + game.money.toLocaleString() + '원 / 필요 ' + cost.toLocaleString() + '원</span><strong>' + (game.money < cost ? (cost - game.money).toLocaleString() + '원 부족' : '구매 가능') + '</strong></p>';
    const next = game.nextCafe;
    const warehouse = game.nextWarehouse;
    let content = '';
    if (investmentTab === 'cafe') {
        content = '<div class="investment-card"><p>현재 카페 ' + game.cafeLevel + '단계' + ' · ' + cafeDisplayName(game.cafeLevel) + '</p>' + (next ? '<h2><small>카페 ' + next.level + '단계</small><span class="cafe-upgrade-name">' + cafeDisplayName(next.level) + '</span></h2><p>홀 확장 · 테이블 ' + scene.space.tables.length + ' → ' + createSpace(next.level, true).tables.length + '개</p><p>이용 좌석 ' + game.cafe.maxCustomers + ' → ' + next.maxCustomers + '석</p><div class="unlock-preview">' + menuDefinitions.filter(m => m.unlockCafeLevel === next.level).map(m => '<span>' + sprite(m.menuId) + ' ' + m.name + '</span>').join('') + '</div>' + affordability(next.expansionCost) + '<button class="primary" data-buy="cafe">카페 확장 · ' + next.expansionCost.toLocaleString() + '원</button>' : '<h2>✦ 드림 카페 완성!</h2><p>최고 단계에 도달했어요. 영업은 남은 시간 동안 계속됩니다.</p>') + '</div>';
    }
    else if (investmentTab === 'warehouse') {
        content = '<div class="investment-card"><p>현재 창고 ' + (game.warehouseLevel === 6 ? 'MAX' : game.warehouseLevel + '단계') + '</p><h2>메뉴마다 ' + game.warehouse.capacity + '개 보관</h2>' + (warehouse ? '<p>최대 재고 ' + game.warehouse.capacity + ' → ' + warehouse.capacity + '개</p>' + affordability(warehouse.cost) + '<button class="primary" data-buy="warehouse">창고 확장 · ' + warehouse.cost.toLocaleString() + '원</button>' : '<p>최대 크기의 창고예요.</p>') + '</div>';
    }
    else if (investmentTab === 'staff') {
        content = '<p>사장님 1명 + 직원 ' + game.service.paid.length + '명 / 현재 최대 ' + game.staffLimit + '명</p><div class="menu-investments">' + staffDefinitions.map((d, i) => {
            const w = game.service.paid.find(w => w.staffId === d.staffId);
            if (w) {
                const cost = game.getStaffUpgradeCost(w.staffId);
                const next = staffBalance.levels[w.level];
                return '<article class="investment-card staff-row">' + sprite(d.staffId, 'staff-portrait') + '<h3>' + w.name + ' · ' + w.level + '레벨' + '</h3><p>' + (cost === null ? '최고 수준의 서빙!' : next.carryCapacity > w.carryCapacity ? '다음: 한 번에 음식 ' + next.carryCapacity + '개 운반' : '다음: 더 빠른 이동과 서빙') + '</p>' + (cost === null ? '' : affordability(cost) + '<button class="secondary" data-buy="staff-upgrade" data-staff="' + w.staffId + '" aria-label="' + w.name + ' 직원 강화">직원 강화 · ' + cost.toLocaleString() + '원</button>') + '</article>';
            }
            const unlock = staffBalance.limits.findIndex(n => n >= i + 1) + 1;
            const locked = i >= game.staffLimit;
            return '<article class="investment-card staff-row ' + (locked ? 'locked' : '') + '">' + sprite(d.staffId, 'staff-portrait') + '<h3>' + d.name + '</h3><p>' + (locked ? '카페 ' + unlock + '단계에서 열려요' : i > game.service.paid.length ? '이전 직원을 먼저 고용해요.' : '함께 카페를 운영해요.') + '</p>' + (!locked && i === game.service.paid.length ? affordability(game.economy.staff.hireCosts[i]) + '<button class="primary" data-buy="staff-hire">' + d.name + ' 고용 · ' + game.economy.staff.hireCosts[i].toLocaleString() + '원</button>' : '') + '</article>';
        }).join('') + '</div>';
    }
    else if (investmentTab === 'items') {
        content = '<p class="item-status">황금시간 ' + game.goldenRemaining + '주문 · 부스터 ' + game.boosterRemaining + '정답' + (game.vipPending ? ' · VIP 방문 예약 중' : '') + '</p><div class="menu-investments">' + itemCatalog.map(item => { const rule = { ...game.phase4Profile.items[item.id], price: game.getItemPrice(item.id) }, remaining = game.itemRemaining(item.id); const blocked = !remaining || game.money < rule.price || (item.id === 'golden' && game.goldenRemaining > 0) || (item.id === 'booster' && game.boosterRemaining > 0) || (item.id === 'invite' && (game.vipPending || game.cafeLevel < game.phase4Profile.rules.vip.unlock)); return '<article class="investment-card item-card"><h3>' + item.name + '</h3><p>' + ({ 'stock-five': '모든 음식 +5 · 창고가 가득 차면 멈춰요', delivery: '고른 음식을 창고 가득 채워요', golden: '다음 5주문에서 버는 돈 2배', invite: '다음 가능한 손님을 VIP로 초대해요', booster: '다음 3번 정답 · 음식마다 +3' }[item.id]) + '</p><p>' + rule.price.toLocaleString() + '원 · 남은 구매 ' + remaining + '/' + rule.limit + '회</p>' + affordability(rule.price) + (item.id === 'delivery' ? '<label>배송 메뉴<select id="delivery-menu">' + game.menus.map(m => '<option value="' + m.menuId + '" ' + (deliveryMenu === m.menuId ? 'selected' : '') + '>' + m.name + '</option>').join('') + '</select></label>' : '') + '<button class="secondary" data-item="' + item.id + '" ' + (blocked ? 'disabled' : '') + '>' + (!remaining ? '구매 완료' : item.id === 'invite' && game.cafeLevel < game.phase4Profile.rules.vip.unlock ? '카페 ' + game.phase4Profile.rules.vip.unlock + '단계에서 열려요' : '구매 · 사용') + '</button></article>'; }).join('') + '</div>';
    }
    else {
        content = '<div class="menu-investments">' + menuDefinitions.map(def => { const m = game.menus.find(m => m.menuId === def.menuId); if (!m)
            return '<article class="investment-card locked"><span class="lock">잠김</span><h3>' + def.name + '</h3><p>카페 ' + def.unlockCafeLevel + '단계에서 열려요</p></article>'; const cost = game.getMenuUpgradeCost(m); return '<article class="investment-card menu-row">' + foodVisual(m) + '<div><h3>' + m.name + ' <small>★' + m.currentLevel + '</small></h3><p>재고 ' + m.stock + '/' + m.maxStock + ' · 판매 ' + game.getPrice(m) + (cost !== null ? ' → ' + game.getPrice(m, m.currentLevel + 1) : '') + '원</p>' + (cost !== null ? affordability(cost) : '') + '</div>' + (cost !== null ? '<button class="secondary" data-buy="menu" data-menu="' + m.menuId + '" ' + (game.money < cost ? 'disabled' : '') + ' aria-label="' + m.name + ' 강화">강화 ' + cost.toLocaleString() + '원</button>' : '<span class="max-label">MAX ★5</span>') + '</article>'; }).join('') + '</div>';
    }
    if (investmentTab === 'staff' && game.mode === 'CAFE_GROWTH' && unlocked(game, 'recruitment'))
        content = growthStaffPanel(game);
    const scroll = panel.querySelector('.investment-content')?.scrollTop ?? 0;
    let body = panel.querySelector('.investment-body');
    if (!body) {
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', '카페 관리');
        panel.innerHTML = '<div class="problem-head investment-header"><h2>카페 관리</h2><button id="close-invest" aria-label="카페 관리 닫고 카페로 돌아가기">← 카페로</button></div><div class="investment-body"></div><footer class="investment-footer"><button id="return-invest" class="primary">카페로 돌아가기</button><p class="hint">관리 중에도 영업은 계속 진행돼요.</p></footer>';
        body = panel.querySelector('.investment-body');
        el('close-invest').onclick = closeInvestment;
        el('return-invest').onclick = closeInvestment;
    }
    body.innerHTML = '<p class="investment-money">보유금 ' + game.money.toLocaleString() + '원 · 총매출 ' + game.stats.revenue.toLocaleString() + '원</p><div class="investment-tabs" role="tablist">' + [['cafe', '카페 확장'], ['warehouse', '창고'], ['menu', '메뉴 강화'], ['staff', '직원'], ...(game.phase4Enabled && !game.progressive ? [['items', '아이템']] : [])].map(([id, title]) => '<button role="tab" aria-selected="' + (id === investmentTab) + '" data-tab="' + id + '">' + title + '</button>').join('') + '</div><p class="investment-message" aria-live="polite">' + investmentMessage + '</p><div class="investment-content">' + content + '</div>';
    panel.querySelector('.investment-content').scrollTop = scroll;
    const delivery = panel.querySelector('#delivery-menu');
    if (delivery)
        delivery.onchange = () => { deliveryMenu = delivery.value; };
    panel.querySelectorAll('[data-item]').forEach(b => b.onclick = () => { advanceTime(); if (!game || game.status !== 'RUNNING' || !purchaseGate.run(() => { }))
        return; const menu = panel.querySelector('#delivery-menu')?.value; const result = game.buyItem(b.dataset.item, b.dataset.item === 'delivery' ? menu : undefined); investmentMessage = result.reason.replace(/Cafe Lv\.(\d+)/g, '카페 $1단계'); render(); });
    panel.querySelectorAll('[data-buy],[data-item]').forEach(b => { if (purchaseGate.blocked || b.closest('article,.investment-card')?.querySelector('.afford.insufficient') || (b.dataset.buy === 'cafe' && performance.now() < celebrationUntil))
        b.disabled = true; });
    panel.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { investmentTab = b.dataset.tab; investmentMessage = ''; renderInvestment(true); panel.querySelector('.investment-content').scrollTop = 0; });
    panel.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { advanceTime(); if (!game || game.status !== 'RUNNING' || !purchaseGate.run(() => { }))
        return; const kind = b.dataset.buy; if (kind === 'cafe' && performance.now() < celebrationUntil)
        return; const result = kind === 'cafe' ? game.expandCafe() : kind === 'warehouse' ? game.upgradeWarehouse() : kind === 'staff-hire' ? game.hireStaff() : kind === 'staff-upgrade' ? game.upgradeStaff(b.dataset.staff) : game.upgradeMenu(b.dataset.menu); investmentMessage = result.reason; if (result.ok && kind === 'cafe') {
        celebrationLevel = game.cafeLevel;
        celebrationUntil = performance.now() + 2700;
        el('celebration').dataset.level = '';
    } render(); });
}
function renderWorkers() {
    if (!game || !roomVisible)
        return;
    const layer = el('workers');
    const names = { IDLE: '', CLAIMING_ORDER: '주문 확인', MOVING_TO_PICKUP: '픽업으로', PICKING_UP: '음식 픽업', MOVING_TO_TABLE: '서빙 중', SERVING: '서빙', RETURNING: '복귀' };
    for (const w of game.service.workers) {
        let node = layer.querySelector('[data-worker="' + w.staffId + '"]');
        if (!node) {
            preloadMotionSheets([w.staffId]);
            node = document.createElement('div');
            node.className = 'worker';
            node.dataset.worker = w.staffId;
            node.innerHTML = workerBaseArt(w.staffId) + '<span class="worker-tray"></span><span class="staff-ability"></span><b></b><small></small><em></em>';
            layer.append(node);
        }
        const point = scene.worker(w, game);
        node.style.left = point.x + '%';
        node.style.top = point.y + '%';
        node.style.zIndex = String(Math.min(790, Math.round(point.y * 10)));
        node.dataset.facing = point.facing;
        node.dataset.state = w.state;
        node.dataset.motion = workerMotion(w);
        node.dataset.order = String(w.orderId ?? '');
        const ability = game.staffAbilities.messages.find(m => m.staffId === w.staffId && m.until > game.elapsedTime);
        const bubble = node.querySelector('.staff-ability');
        if (bubble) {
            bubble.textContent = ability?.text ?? '';
            bubble.hidden = !ability;
        }
        const displayCargo = w.state === 'PICKING_UP' ? w.remaining.slice(0, w.carryCapacity) : w.cargo;
        const actual = workerPoseArt(w.staffId, workerMotion(w), point.facing);
        const visualKey = [actual ? 'actual' : 'base', point.facing, w.state, w.level, displayCargo.join(','), game.elapsedTime < w.upgradeFeedbackUntil].join('/');
        if (node.dataset.visualKey === visualKey)
            continue;
        node.dataset.visualKey = visualKey;
        const tray = workerTrayPlacement(w.staffId, workerMotion(w), point.facing);
        if (tray) {
            node.style.setProperty('--tray-left', tray.left + '%');
            node.style.setProperty('--tray-top', tray.top + '%');
            node.style.setProperty('--tray-width', tray.width + '%');
        }
        node.dataset.actualPose = String(!!actual);
        node.querySelector('.worker-art').outerHTML = actual ?? workerBaseArt(w.staffId);
        node.querySelector('b').textContent = w.name + (w.owner ? '' : ' Lv.' + w.level);
        node.querySelector('small').textContent = names[w.state];
        node.querySelector('em').textContent = game.elapsedTime < w.upgradeFeedbackUntil ? 'LEVEL UP · Lv.' + w.level : '';
        node.querySelector('.worker-tray').innerHTML = displayCargo.map(orderArt).join('');
        node.classList.toggle('carrying', w.cargo.length > 0);
        node.classList.toggle('upgraded', w.level >= 3);
        node.classList.toggle('walking', w.state.startsWith('MOVING') || w.state === 'RETURNING');
    }
}
const modeFlow = new ModeFlow(startSession, () => game, undefined, appendLearningAnalysis, () => ux.beforeStart(), () => render());
export function configureSaveRepository(repository) { modeFlow.setRepository(repository); }
export function feedbackDiagnostics() { return feel.diagnostics(); }
export function learningDiagnostics() { return { progress: structuredClone(engine.progress), metrics: engine.report(), active: active ? structuredClone(active) : null }; }
function appendLearningAnalysis() { if (!game || !developerMode)
    return; const detail = document.createElement('details'); detail.className = 'analysis'; detail.innerHTML = '<summary>개발자 플레이 분석</summary><button id="growth-export-log" class="secondary">플레이 로그 JSON 저장</button><pre id="growth-log-preview"></pre>'; el('results').append(detail); el('growth-log-preview').textContent = JSON.stringify({ ...game.telemetry.export(game.snapshot), learning: engine.report() }, null, 2); el('growth-export-log').onclick = () => { if (!game)
    return; const url = URL.createObjectURL(new Blob([JSON.stringify({ ...game.telemetry.export(game.snapshot), learning: engine.report() }, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'cafe-play-log.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }; }
export function closeSessionForQA() { game?.endBusiness(); render(); }
function advanceTime() { if (game?.status !== 'RUNNING')
    return; game.tick(growthRuntime.delta(game) ?? (classroomElapsed ? Math.max(0, classroomElapsed() - game.elapsedTime) : clock.take())); if (game.status === 'CLOSED')
    render(); }
addEventListener('visibilitychange', () => { advanceTime(); if (game) {
    render();
    modeFlow.flush();
} });
addEventListener('pagehide', () => { advanceTime(); modeFlow.flush(); });
export function configureUxPreference(storage, key) { ux.configure(storage, key); }
export function uxDiagnostics() { return { tutorialCompleted: ux.preference.completed, status: game?.status, cafe: game?.snapshot, learning: engine.report() }; }
export function refreshForQA() { render(); }
export function sessionForQA() { return game; }
function renderDepartureTalks() { if (!game)
    return; const messages = departure.observe(game.guests, game.elapsedTime).filter(m => game.guests.some(g => g.id === m.guestId)), key = JSON.stringify(messages.map(m => m.guestId)); for (const pop of document.querySelectorAll('.farewell-pop'))
    if (!messages.some(m => String(m.guestId) === pop.dataset.farewell))
        pop.remove(); for (const m of messages) {
    const actor = document.querySelector('[data-guest-id="' + m.guestId + '"]');
    if (actor && !actor.querySelector('.farewell-pop')) {
        const pop = document.createElement('span');
        pop.className = 'farewell-pop';
        pop.dataset.farewell = String(m.guestId);
        pop.textContent = m.text;
        pop.setAttribute('aria-hidden', 'true');
        actor.append(pop);
    }
} fitFarewells(); const lane = el('departure-talks'); lane.hidden = messages.length === 0; lane.setAttribute('aria-live', panelOpen ? 'off' : 'polite'); if (key === departureKey)
    return; departureKey = key; lane.innerHTML = messages.map(m => '<div class="departure-bubble" data-departure="' + m.guestId + '" data-outcome="' + m.outcome + '"><b>' + escapeText(m.name) + '</b><span>' + escapeText(m.text) + '</span></div>').join(''); }
function renderServiceHint() { if (!game)
    return; const box = el('service-hint'), paid = game.service.paid.length; let text = ''; if (!paid && game.readyToServe.length && !manualTipShown) {
    manualTipShown = true;
    text = '음식이 준비됐어요! 서빙하기를 눌러 손님에게 가져다주세요.';
} if (paid > lastStaffCount && !autoTipShown) {
    autoTipShown = true;
    text = '이제 직원이 자동으로 서빙해요!';
} lastStaffCount = paid; if (text) {
    box.textContent = text;
    hintUntil = performance.now() + 4500;
} box.hidden = performance.now() > hintUntil || game.status !== 'RUNNING'; }
const classroom = new ClassroomUi(() => game, startSession, () => { if (game?.status === "RUNNING") {
    game.leaveClassMatch();
    render();
} }, (start, now) => { const mono = performance.now(); classroomElapsed = () => Math.max(0, (now + performance.now() - mono - start) / 1000); }, () => { const r = engine.report(); return { ...r, twinQuestionsGenerated: r.attempts.filter(a => a.isTwin).length }; }, () => ({ session: engine.checkpoint(), readVisits: [...readVisits], analytics: analytics.checkpoint() }), (snapshot) => { const s = snapshot; if (!s || !engine.restoreCheckpoint(s.session))
    return false; if (s.analytics)
    analytics.restore(s.analytics); readVisits.clear(); if (Array.isArray(s.readVisits))
    s.readVisits.filter(n => Number.isSafeInteger(n) && n >= 0).forEach(n => readVisits.add(n)); return true; }, (n) => engine.resumeNormalCursor(n), (value, stats, room) => { const cp = value; const a = cp?.learning?.analytics; if (!a?.questionPackId)
    return false; const restored = new LearningAnalyticsV1(a.questionPackId); if (!restored.restore(a))
    return false; const g = new CafeGame(room.seconds); if (room.mode === 'run')
    g.enableRun(room.room, 'coffee'); if (!restoreClassroomCafe(g, cp.cafe))
    return false; startSession(g); analytics = restored; g.stats.attempted = Math.max(stats.attempted, analytics.report().total.attempted); g.stats.correct = Math.max(stats.correct, analytics.report().total.correct); g.remainingSeconds = Math.max(0, room.seconds - Math.max(0, ((room.endAt ?? room.serverNow) - (room.startAt ?? room.serverNow)) / 1000)); g.leaveClassMatch(); render(); return true; });
const recovery = new EventRecovery(() => game, () => ({ packId: engine.provider.packId, learning: { session: engine.checkpoint(), readVisits: [...readVisits], analytics: analytics.checkpoint() } }), (g, pool) => startSession(g, pool), (value) => { const s = value; if (!s || !engine.restoreCheckpoint(s.session) || !analytics.restore(s.analytics))
    return false; readVisits.clear(); if (Array.isArray(s.readVisits))
    s.readVisits.forEach(n => readVisits.add(n)); return true; });
document.addEventListener('v15-restored', () => { document.getElementById('learning-report')?.remove(); render(); });
function fitFarewells() { if (!roomVisible)
    return; const pops = document.querySelectorAll('.farewell-pop'); if (!pops.length)
    return; const room = el('cafe-room').getBoundingClientRect(); for (const pop of pops) {
    pop.style.setProperty('--farewell-shift-x', '0px');
    pop.style.setProperty('--farewell-shift-y', '0px');
    const correction = bubbleCorrection(pop.getBoundingClientRect(), room);
    pop.style.setProperty('--farewell-shift-x', correction.x + 'px');
    pop.style.setProperty('--farewell-shift-y', correction.y + 'px');
} }
let roomVisible = true;
if (typeof IntersectionObserver !== 'undefined')
    new IntersectionObserver(entries => { roomVisible = entries[0]?.isIntersecting ?? true; }, { rootMargin: '100px' }).observe(el('cafe-room'));
export function openVillageMode() { modeFlow.villageSetup(); }
export function flushForQA() { return modeFlow.flush(); }
