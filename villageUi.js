import { progressiveTown } from './progressiveTown.js';
import { progressiveTownName } from './progressiveEconomy.js';
import { unlocked } from './progressiveFeatures.js';
import { acknowledgeGrowth, growthReaction } from './villageGrowthVisual.js';
import { VillageGrowthUi } from './villageGrowthUi.js';
import { VillageSocial } from './villageSocial.js';
import { VillageDialogue } from './villageDialogue.js';
import { residentLine, lifeProfiles } from './villageLife.js';
import { ensurePortfolio, syncSharedFurniture } from './cafePortfolio.js';
import { syncLake } from './lakeDistrict.js';
import { beginVillageProgression, syncVillageProgression, progressionPoints, villageStages, festivalCatalog, villageRecipes, materialLabels, beginFestival, finishFestival, craftVillage, useVillageMarket, claimMarketSouvenir } from './villageProgression.js';
import { ensureGrowthWriteLock } from './growthWriteLock.js';
import { createGrowthSave } from './growthSave.js';
import { customerPoseArt, selectCustomerPose } from './customerPoses.js';
import { escapeText as esc } from './questionRenderer.js';
import { buildings, residents, materialNodes, createVillage, syncVillage, villageMetrics, questAvailable, acceptQuest, talkVillage, visitVillagePoint, claimQuest, questReady, questCatalog, metricNames } from './village.js';
import { restoreSceneLocation, sceneTarget, nearestScenePoint, sceneWalkable } from './villageNavigation.js';
import { sceneMarkup, ensureVillageSceneStyle } from './villageSceneArt.js';
import { VillageExplorer } from './villageExplorer.js';
let destroy;
const art = (visual) => customerPoseArt(selectCustomerPose(visual, 'ENTERING', 'right'));
export async function openVillage(repo, enterCafe, back) {
    const check = repo.read();
    if (check.status === 'ready' && !unlocked(check.save, 'village'))
        return;
    destroy?.();
    let explorer, social, rpg, growth;
    let reopening = false;
    const turns = new Map();
    const root = document.createElement('section');
    root.className = 'village-overlay';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', '햇살 골목 마을');
    root.innerHTML = '<article class="village-shell"><p>마을 저장을 확인하고 있어요…</p><button id="village-cancel">모드 선택으로</button></article>';
    document.body.append(root);
    document.getElementById('app')?.setAttribute('inert', '');
    const cleanup = () => { growth?.destroy(); rpg?.destroy(); social?.destroy(); explorer?.destroy(); root.remove(); document.getElementById('app')?.removeAttribute('inert'); destroy = undefined; };
    destroy = cleanup;
    root.querySelector('#village-cancel').addEventListener('click', () => { cleanup(); back(); });
    if (!document.getElementById('village-style')) {
        const link = document.createElement('link');
        link.id = 'village-style';
        link.rel = 'stylesheet';
        link.href = 'village.css?v=v2a';
        document.head.append(link);
    }
    ensureVillageSceneStyle();
    if (!await ensureGrowthWriteLock()) {
        root.querySelector('p').textContent = '다른 창이 카페를 저장하고 있어요. 그 창을 닫고 다시 들어와 주세요.';
        return;
    }
    if (!root.isConnected)
        return;
    const read = repo.read();
    if (read.status !== 'empty' && read.status !== 'ready') {
        root.querySelector('p').textContent = '저장을 확인할 수 없어 기존 카페를 보존했어요. 백업을 확인해 주세요.';
        return;
    }
    let saved = read.status === 'ready' ? read.save : createGrowthSave();
    if (saved.campaign?.run && !saved.campaign.run.closed) {
        cleanup();
        enterCafe();
        return;
    }
    const first = structuredClone(saved);
    first.village ??= createVillage();
    if (first.v26)
        first.village.progressiveLevel = first.cafeLevel;
    ensurePortfolio(first);
    syncSharedFurniture(first);
    syncLake(first);
    beginVillageProgression(first);
    syncVillageProgression(first);
    first.village.visits++;
    first.village.event = ['lost', 'materials', 'festival'][(first.village.visits - 1) % 3];
    syncVillage(first.village, villageMetrics(first));
    const scene = progressiveTown(first);
    const restored = restoreSceneLocation(scene, first.village.position, first.village.scenePosition);
    if (!first.village.scenePosition || JSON.stringify(restored) !== JSON.stringify(first.village.scenePosition))
        first.village.scenePositionBackup ??= { legacy: { ...first.village.position }, visual: first.village.scenePosition ?? null };
    first.village.scenePosition = restored;
    first.updatedAt = new Date().toISOString();
    const initial = repo.write(first, read.status === 'ready' ? saved : undefined);
    if (!initial.ok) {
        root.querySelector('p').textContent = initial.message;
        return;
    }
    saved = first;
    if (saved.portfolio.district.region === 'lake' && saved.village.progression.stage === 5) {
        cleanup();
        const { openLake } = await import('./lakeUi.js');
        void openLake(repo, () => { void openVillage(repo, enterCafe, back); }, enterCafe);
        return;
    }
    let position = { x: restored.x, y: restored.y }, pendingResident, dialogResident, pendingCafe = false, pendingLake = false, pendingBuilding;
    root.innerHTML = `<article class="village-shell"><header class="village-header"><div><p class="eyebrow">함께 배우고 함께 자라는</p><h1>햇살 골목 마을</h1></div><button id="village-home">모드 선택</button><button id="village-cafe" class="primary">카페로 →</button></header><p class="village-sub">길이나 건물을 눌러 걸어가요. 이웃 가까이에서 이야기할 수 있어요. 마을에서는 영업 시간이 흐르지 않아요.</p><div class="village-hud"><span id="village-development"></span><span id="village-collection"></span><button id="village-lake" ${saved.village.progression.stage < 5 ? 'hidden' : ''}>호숫가 상권으로</button><button id="village-progress">마을 발전 · 시설</button><button id="village-journal">의뢰 수첩</button><button id="village-album">성장 앨범</button></div><div class="village-layout"><section><div class="scene-shortcuts"><button data-scene-destination="plaza">중앙 광장</button><button data-scene-destination="flowers">꽃집</button><button data-scene-destination="market">시장</button><button data-scene-destination="workshop">공방</button></div><div class="village-scroll scene-viewport"><div class="village-map scene-map" tabindex="0" role="group" aria-label="터치로 이동하는 햇살 골목 지도">${sceneMarkup(scene)}<button class="scene-spot" data-scene-exit style="left:1515px;top:650px">${saved.village.progression.stage >= 5 ? '호숫가로 →' : '외곽 길 · 5단계 개방'}</button></div></div><div class="scene-toolbar"><p>방향키·WASD / 길 터치 / 버튼 길게 누르기</p><button id="scene-overview">전체 지도</button></div><div class="village-controls"><button data-village-dir="up" aria-label="마을 위로">↑</button><div><button data-village-dir="left" aria-label="마을 왼쪽으로">←</button><button data-village-dir="down" aria-label="마을 아래로">↓</button><button data-village-dir="right" aria-label="마을 오른쪽으로">→</button></div></div></section><aside class="village-aside" aria-live="polite"><div id="village-story"></div></aside></div><p id="village-message" role="status"></p><p class="village-storage">카페·공부·마을은 이 브라우저에 저장돼요. 기기 변경 전 카페에서 JSON 백업을 받아 주세요.</p></article>`;
    const map = root.querySelector('.village-map'), story = root.querySelector('#village-story'), msg = root.querySelector('#village-message');
    const paintPlayer = () => explorer?.setPosition(position);
    function commit(change) { const next = structuredClone(saved); if (change(next.village, next) === false)
        return false; next.village.scenePosition = { version: 2, region: 'town', ...position }; syncVillage(next.village, villageMetrics(next)); syncVillageProgression(next); const revised = progressiveTown(next); if (!sceneWalkable(revised, position)) {
        position = nearestScenePoint(revised, position);
        next.village.scenePosition = { version: 2, region: 'town', ...position };
    } next.updatedAt = new Date().toISOString(); const result = repo.write(next, saved); if (!result.ok) {
        msg.textContent = result.message + ' · 기존 저장은 그대로예요.';
        explorer?.stop();
        const p = restoreSceneLocation(scene, saved.village.position, saved.village.scenePosition);
        position = { x: p.x, y: p.y };
        paintPlayer();
        return false;
    } saved = next; summary(); return true; }
    function persistLocation() { const old = saved.village.scenePosition; if (!old || Math.hypot(old.x - position.x, old.y - position.y) > .2)
        commit(() => { }); }
    function summary() { if (saved.v26) {
        root.setAttribute('aria-label', progressiveTownName(saved));
        root.querySelector('h1').textContent = progressiveTownName(saved);
    } const v = saved.village; if (v.progression.stage !== scene.progressionStage && !reopening) {
        reopening = true;
        queueMicrotask(() => { if (root.isConnected)
            void openVillage(repo, enterCafe, back); });
    } map.dataset.stage = String(v.progression.stage); root.querySelector('#village-development').textContent = villageStages[v.progression.stage - 1].name + ' · ' + progressionPoints(v) + '점'; root.querySelector('#village-collection').textContent = '기념품 ' + v.souvenirs.length + '/8 · 만난 이웃 ' + Object.keys(v.residents).length + '/6'; root.querySelector('#village-lake').hidden = v.progression.stage < 5; root.querySelectorAll('[data-material]').forEach(n => n.classList.toggle('collected', Object.values(v.quests).some(q => q.materials.includes(n.dataset.material)))); }
    function closeDialogue() { rpg?.destroy(); social?.end(); dialogResident = undefined; root.classList.remove('village-talking'); }
    function journal(show = true) { closeDialogue(); if (show)
        social?.showSheet(); const v = saved.village; const eventText = { lost: '길을 찾는 손님이 광장에 왔어요. 여울에게 길 안내를 배워 볼까요?', materials: '시장에 재료가 부족해요. 길가의 재료와 다온의 의뢰를 확인해요.', festival: '꽃과 케이크로 작은 축제를 준비하고 있어요. 소담과 해솔을 찾아요.' }; story.innerHTML = '<h2>우리 마을 의뢰</h2><p class="village-event-note">' + eventText[v.event ?? 'lost'] + '</p><p>받은 뒤의 활동만 세어요. 영업에서 공부하고, 미니게임에 도전한 뒤 주민에게 돌아와 주세요.</p>' + questCatalog.map(q => { const r = v.quests[q.id]; return `<article class="village-quest"><h3>${esc(q.name)}</h3><p>${r ? r.claimed ? '해결 완료 · ' + esc(q.reward) : Object.entries(q.goal).map(([k, n]) => `${esc(metricNames[k])} ${Math.min(n, r.progress[k] ?? 0)}/${n}`).join(' · ') : '주민을 만나 의뢰를 받아요'}</p><button data-journal-resident="${q.resident}">${esc(residents.find(n => n.id === q.resident).name)} 찾아가기</button></article>`; }).join('') + `<h3>내 기념품</h3><p>${v.souvenirs.length ? v.souvenirs.map(id => esc(questCatalog.find(q => q.id === id).reward)).join(' · ') : '첫 의뢰를 해결하면 여기에 모여요.'}</p><p>꽃집·시장·제분소·공방 이용 가능 · ${saved.portfolio?.founded ? "호숫가 2호점 운영 중이에요." : "호숫가에서 2호점을 준비할 수 있어요."}</p>`; story.querySelectorAll('[data-journal-resident]').forEach(b => b.onclick = () => approach(b.dataset.journalResident)); }
    function dialogue(id, reaction) {
        const npc = residents.find(r => r.id === id);
        if (!npc) {
            const visitor = scene.residents.find(r => r[0] === id);
            if (!visitor || !social?.begin(id))
                return;
            dialogResident = id;
            rpg.show({ id, name: visitor[1], role: lifeProfiles[id].role, visual: visitor[2], lines: ['장터가 넓어졌다는 소식을 듣고 호숫가에서 구경하러 왔어!', id === 'photographer' ? '이웃들이 함께 만든 시장을 사진으로 남기고 싶어.' : '새 진열대를 둘러보고 호숫가 산책길도 걸어 볼 거야.'], quests: [], onClose: closeDialogue, onStudy: goCafe, onAction: () => { } });
            return;
        }
        if (!social?.begin(id))
            return;
        const first = !saved.village.residents[id]?.met;
        if (!reaction && !commit(v => talkVillage(v, id))) {
            social.end();
            return;
        }
        dialogResident = id;
        const turn = turns.get(id) ?? 0;
        if (!reaction)
            turns.set(id, turn + 1);
        const festival = Object.entries(saved.village.progression.festivals).find(([, v]) => v.status !== 'complete');
        rpg.show({ id, name: scene.residents.find(r => r[0] === id)[1], role: lifeProfiles[id].role, visual: npc.visual, lines: [(!reaction && turn === 0 ? growthReaction(id, saved.village.progression.stage) : undefined) ?? residentLine(id, { first, stage: saved.village.progression.stage, festival: festival ? festivalCatalog.find(f => f.id === festival[0])?.name : undefined, reaction, turn }), npc.line], quests: questCatalog.filter(q => questAvailable(saved.village, q.id) && q.resident === id).map(q => { const r = saved.village.quests[q.id], ready = questReady(saved.village, q.id); return { id: q.id, name: q.name, story: q.story, status: r?.claimed ? 'complete' : ready ? 'ready' : r ? 'active' : 'available', progress: Object.entries(q.goal).map(([k, n]) => metricNames[k] + ' ' + (r?.progress[k] ?? 0) + '/' + n).join(' · '), reward: q.reward + ' · 마을 발전 ' + q.points + '점', action: r?.claimed ? '해결 완료' : ready ? '완료 보고 · 기념품 받기' : r ? '카페에서 이어가요' : '의뢰 받기', note: q.mini ? '관련 미니게임은 다음 영업에서 우선 준비해요. 공부로 재료를 마련해요.' : undefined }; }), onClose: closeDialogue, onStudy: goCafe, onAction: qid => { const q = questCatalog.find(q => q.id === qid && q.resident === id); if (!q)
                return; const claimed = !!saved.village.quests[qid]; if (commit(v => claimed ? claimQuest(v, qid) : acceptQuest(v, qid, villageMetrics(saved)))) {
                dialogue(id, claimed ? 'complete' : 'accept');
                msg.textContent = claimed ? q.reward + ' 획득!' : '의뢰를 받았어요. 지금부터의 활동이 기록돼요.';
            } } });
    }
    function progressPanel() {
        closeDialogue();
        social?.showSheet();
        story.parentElement.scrollTop = 0;
        root.classList.remove('village-talking');
        dialogResident = undefined;
        const v = saved.village, p = v.progression, d = villageStages[p.stage - 1], next = villageStages[p.stage];
        story.innerHTML = '<h2>' + d.name + ' · ' + p.stage + '/5</h2><p>' + d.message + '</p>' + (next ? '<h3>다음: ' + next.name + '</h3><p>발전 ' + progressionPoints(v) + '/' + next.points + '점 · 학습 영업 ' + p.sessions.length + '/' + next.sessions + '회 · 주민 의뢰 ' + v.souvenirs.length + '/' + next.quests + '개 · 신뢰 ' + Object.values(v.residents).reduce((n, r) => n + r.trust, 0) + '/' + next.trust + '</p>' : '<p>외곽 길이 열렸어요. 호숫가에서 새 이웃을 만나고 2호점을 준비해요.</p>') + '<p>완주하고 서로 다른 문제 8개·정답 5개부터 영업 활동을 기록해요. 이전 영업은 소급 보상하지 않아요.</p><button id="v19b-memory">발전 단계 기록</button><h3>마을 재료</h3><p>' + Object.entries(p.inventory).map(([k, n]) => materialLabels[k] + ' ' + n).join(' · ') + '</p><small>음식 재고와 다른 제작 전용 재료예요.</small><h3>광장 행사 · 축제 의뢰</h3>' + festivalCatalog.map(f => { const r = p.festivals[f.id]; return '<article class="village-quest"><h4>' + f.name + '</h4><p>' + f.line + '</p><p>의뢰 받은 뒤 정답 2개 + 관련 미니게임 성공 + 학습 영업 완주</p><button data-festival="' + f.id + '" ' + (p.stage < f.stage || r?.status === 'complete' ? 'disabled' : '') + '>' + (p.stage < f.stage ? f.stage + '단계 개방' : r?.status === 'complete' ? '완료 · 장식 보관함에 저장' : r ? '완료 보고 · 장식 받기' : '축제 의뢰 받기') + '</button></article>'; }).join('') + '<h3>공방 · 가구와 장식 제작</h3>' + villageRecipes.map(r => '<article class="village-quest"><h4>' + r.name + '</h4><p>' + Object.entries(r.cost).map(([k, n]) => materialLabels[k] + ' ' + n).join(' · ') + '</p><button data-craft="' + r.id + '" ' + (p.stage < r.stage || p.crafted.includes(r.id) ? 'disabled' : '') + '>' + (p.crafted.includes(r.id) ? '제작 완료' : p.stage < r.stage ? r.stage + '단계 개방' : '제작 · 카페에서 배치하기') + '</button></article>').join('') + '<h3>시장 · 특별 재료 교환</h3><p>4단계부터 학습 영업 1회당 한 번, 리본 1개를 재료 2개로 바꿔요.</p>' + ['wood', 'petals', 'flour'].map(k => '<button data-market="' + k + '" ' + (p.stage < 4 ? 'disabled' : '') + '>' + materialLabels[k] + ' 교환</button>').join('') + '<p>시장 기념품: ' + (p.marketSouvenirs?.length ? '다온의 시장 도장' : '아직 없어요') + '</p><button id="v19b-market-gift" ' + (p.stage < 4 || p.marketSouvenirs?.length ? 'disabled' : '') + '>리본 3개 · 시장 도장 수집</button><h3>꽃집 · 제분소</h3><p>꽃집은 꽃 축제, 제분소는 빵 축제 준비 의뢰를 함께해요. 기존 주민 의뢰 8개도 계속할 수 있어요.</p><button id="v19b-neighbors">주민 의뢰 보기</button>';
        story.querySelectorAll('[data-festival]').forEach(b => b.onclick = () => { const id = b.dataset.festival; const existing = saved.village.progression.festivals[id]; const ok = commit((_v, s) => existing ? finishFestival(s, id) : beginFestival(s, id)); progressPanel(); msg.textContent = ok ? (existing ? '축제 완료! 카페 장식 보관함에 보상을 저장했어요.' : '축제 의뢰를 받았어요. 공부하러 카페로 가요!') : '아직 준비 중이에요. 의뢰 후 정답 2개와 관련 미니게임 성공·영업 완주를 확인해 주세요.'; });
        story.querySelectorAll('[data-craft]').forEach(b => b.onclick = () => { const ok = commit((_v, s) => craftVillage(s, b.dataset.craft)); progressPanel(); msg.textContent = ok ? '제작 완료! 카페 꾸미기에서 사용할 수 있어요.' : '재료가 부족하거나 이미 가진 가구예요. 재료는 사용하지 않았어요.'; });
        story.querySelectorAll('[data-market]').forEach(b => b.onclick = () => { const ok = commit((_v, s) => useVillageMarket(s, b.dataset.market)); progressPanel(); msg.textContent = ok ? '재료를 교환했어요.' : '리본과 아직 교환하지 않은 학습 영업 기록이 필요해요.'; });
        story.querySelector('#v19b-market-gift').addEventListener('click', () => { const ok = commit((_v, s) => claimMarketSouvenir(s)); progressPanel(); msg.textContent = ok ? '다온의 시장 도장을 모았어요!' : '리본 3개가 필요해요.'; });
        story.querySelector('#v19b-neighbors').addEventListener('click', () => journal());
        story.querySelector('#v19b-memory').addEventListener('click', () => { social?.hideSheet(); growth?.album(); });
    }
    function goCafe() { cleanup(); enterCafe(); }
    async function goLake() { if (saved.village.progression.stage < 5) {
        msg.textContent = '마을5단계에서 호숫가 길이 열려요.';
        return;
    } if (!commit((_v, s) => { s.portfolio.district.region = 'lake'; }))
        return; cleanup(); const { openLake } = await import('./lakeUi.js'); void openLake(repo, () => { void openVillage(repo, enterCafe, back); }, enterCafe); }
    function clearIntent() { social?.cancel(); social?.hideSheet(); pendingResident = undefined; pendingCafe = false; pendingLake = false; pendingBuilding = undefined; dialogResident = undefined; root.classList.remove('village-talking'); }
    function target(p) { explorer?.target(p); }
    function approach(id) { root.dataset.lastInteraction = "approach:" + id; if (rpg?.active)
        return; clearIntent(); if (social?.ready(id)) {
        root.dataset.lastInteraction = "near:" + id;
        dialogue(id);
        return;
    } const p = social?.approach(id); if (!p)
        return; pendingResident = id; target(p); root.querySelector('.scene-viewport').scrollIntoView({ block: 'nearest' }); }
    function buildingTarget(id) { if (rpg?.active)
        return; const person = id === 'pavilion' ? 'host' : id === 'cafe' ? undefined : residents.find(r => r.home === id)?.id; if (person) {
        approach(person);
        pendingBuilding = id;
        return;
    } clearIntent(); pendingCafe = id === 'cafe'; pendingBuilding = id; const p = sceneTarget(scene, id); if (p)
        target(p); }
    function arrive() { if (!commit(v => { if (Math.hypot(position.x - 680, position.y - 720) < 100)
        visitVillagePoint(v, { x: 12, y: 9 }); for (const [id, node] of [['ribbon', 'west'], ['wood', 'east'], ['seeds', 'park']]) {
        const p = sceneTarget(scene, node);
        if (Math.hypot(position.x - p.x, position.y - p.y) < 35)
            visitVillagePoint(v, materialNodes.find(n => n.id === id));
    } const b = buildings.find(b => b.id === pendingBuilding); if (b) {
        const p = sceneTarget(scene, b.id);
        if (p && Math.hypot(position.x - p.x, position.y - p.y) < 60)
            visitVillagePoint(v, b.door);
    } }))
        return; if (pendingCafe) {
        pendingCafe = false;
        const p = sceneTarget(scene, "cafe");
        if (Math.hypot(position.x - p.x, position.y - p.y) < 60) {
            goCafe();
            return;
        }
    } if (pendingLake) {
        pendingLake = false;
        const p = sceneTarget(scene, "exit");
        if (Math.hypot(position.x - p.x, position.y - p.y) < 60) {
            void goLake();
            return;
        }
    } if (pendingResident) {
        const id = pendingResident;
        pendingResident = undefined;
        if (social?.ready(id))
            dialogue(id);
        else
            msg.textContent = '이웃 가까이의 길을 골라 주세요.';
    }
    else if (!dialogResident)
        journal(false); }
    social = new VillageSocial({ scene: scene, root, map, viewport: root.querySelector('.scene-viewport'), player: () => position, talk: id => dialogue(id), message: text => { msg.textContent = text; } });
    rpg = new VillageDialogue(root);
    explorer = new VillageExplorer({ scene: scene, map, viewport: root.querySelector('.scene-viewport'), controls: root.querySelector('.village-controls'), position, onPosition: p => { position = p; }, onArrive: arrive, onCheckpoint: persistLocation, onReject: () => { msg.textContent = '건물과 화단을 피해 길을 골라 주세요.'; }, canMove: () => !rpg?.active && !growth?.busy, canEnter: (a, b) => social.world.canPlayerMove(a, b), resolveStep: (a, b) => social.world.resolvePlayerStep(a, b), crowded: p => social.world.crowded(p), onFrame: dt => social?.tick(dt), onManual: clearIntent });
    social.attach(explorer);
    map.addEventListener('click', e => { if (rpg?.active || growth?.busy)
        return; const button = e.composedPath().find(n => n instanceof HTMLButtonElement); const id = button?.dataset.resident; if (id) {
        approach(id);
        return;
    } if (button?.dataset.building) {
        buildingTarget(button.dataset.building);
        return;
    } if (button?.dataset.material) {
        clearIntent();
        const node = { ribbon: 'west', wood: 'east', seeds: 'park' }[button.dataset.material];
        target(sceneTarget(scene, node));
        return;
    } if (button)
        return; const p = explorer.clickPoint(e), picked = social?.pick(p); if (picked) {
        approach(picked);
        return;
    } clearIntent(); target(p); });
    root.querySelectorAll('[data-scene-destination]').forEach(b => b.onclick = () => { const id = b.dataset.sceneDestination; if (id === 'plaza') {
        clearIntent();
        target(sceneTarget(scene, id));
    }
    else
        buildingTarget(id); });
    const lakeRoute = () => { if (saved.village.progression.stage < 5) {
        msg.textContent = '마을5단계에서 호숫가 길이 열려요.';
        return;
    } clearIntent(); pendingLake = true; target(sceneTarget(scene, 'exit')); };
    root.querySelector('[data-scene-exit]').addEventListener('click', lakeRoute);
    root.querySelector('#village-lake').addEventListener('click', lakeRoute);
    root.querySelector('#scene-overview').addEventListener('click', () => { root.querySelector('#scene-overview').textContent = explorer.toggleOverview() ? '가까이 보기' : '전체 지도'; });
    root.querySelector('#village-cafe').addEventListener('click', () => buildingTarget('cafe'));
    root.querySelector('#village-home').addEventListener('click', () => { cleanup(); back(); });
    root.querySelector('#village-journal').addEventListener('click', () => journal());
    root.querySelector('#village-progress').addEventListener('click', progressPanel);
    growth = new VillageGrowthUi({ root, map, stage: saved.village.progression.stage, seen: saved.village.progression.seenStage, acknowledge: () => commit(v => acknowledgeGrowth(v.progression, v.progression.stage)), onFreeze: freeze => { if (freeze) {
            explorer?.stop();
            social?.cancel();
        } }, facility: progressPanel });
    root.querySelector('#village-album').addEventListener('click', () => { closeDialogue(); social?.hideSheet(); growth?.album(); });
    summary();
    journal(false);
    map.focus({ preventScroll: true });
}
