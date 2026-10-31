import { openProgressiveHub } from './progressiveHub.js';
import { growthReaction } from './villageGrowthVisual.js';
import { VillageSocial } from './villageSocial.js';
import { VillageDialogue } from './villageDialogue.js';
import { residentLine, lifeProfiles } from './villageLife.js';
import { ensureGrowthWriteLock } from './growthWriteLock.js';
import { ensurePortfolio, foundSecondCafe } from './cafePortfolio.js';
import { lakeResidents, lakeSpots, lakeQuests, talkLake, visitLake, acceptLakeQuest, syncLake, lakeQuestReady, claimLakeQuest } from './lakeDistrict.js';
import { escapeText as esc } from './questionRenderer.js';
import { lakeScene } from './villageSceneData.js';
import { restoreSceneLocation, sceneTarget } from './villageNavigation.js';
import { sceneMarkup, ensureVillageSceneStyle, markSceneFounded } from './villageSceneArt.js';
import { VillageExplorer } from './villageExplorer.js';
let destroyLake;
export async function openLake(repo, back, enterCafe) {
    destroyLake?.();
    if (!await ensureGrowthWriteLock())
        return;
    const read = repo.read();
    if (read.status !== 'ready' || read.save.village?.progression?.stage !== 5)
        return;
    if (read.save.campaign?.run && !read.save.campaign.run.closed) {
        enterCafe();
        return;
    }
    let saved = read.save;
    const first = structuredClone(saved);
    ensurePortfolio(first);
    first.portfolio.district.region = 'lake';
    first.portfolio.district.visits++;
    syncLake(first);
    const district = first.portfolio.district;
    const restored = restoreSceneLocation(lakeScene, district.position, district.scenePosition);
    if (!district.scenePosition || JSON.stringify(restored) !== JSON.stringify(district.scenePosition))
        district.scenePositionBackup ??= { legacy: { ...district.position }, visual: district.scenePosition ?? null };
    district.scenePosition = restored;
    first.updatedAt = new Date().toISOString();
    const initial = repo.write(first, saved);
    if (!initial.ok)
        return;
    saved = first;
    if (!document.getElementById('village-style')) {
        const link = document.createElement('link');
        link.id = 'village-style';
        link.rel = 'stylesheet';
        link.href = 'village.css?v=v2a';
        document.head.append(link);
    }
    ensureVillageSceneStyle();
    const root = document.createElement('section');
    root.className = 'village-overlay lake-overlay';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', '바람결 호숫가 탐험');
    document.body.append(root);
    document.getElementById('app')?.setAttribute('inert', '');
    let explorer, social, rpg;
    const turns = new Map();
    let pos = { x: restored.x, y: restored.y }, pendingResident, pendingSite = false, pendingBack = false, dialogResident = false;
    const cleanup = () => { rpg?.destroy(); social?.destroy(); explorer?.destroy(); root.remove(); document.getElementById('app')?.removeAttribute('inert'); destroyLake = undefined; };
    destroyLake = cleanup;
    root.innerHTML = `<article class="village-shell"><header class="village-header"><div><p>새로운 이웃과 다음 꿈을 만나요</p><h1>바람결 호숫가</h1></div><button id="lake-back">마을로 돌아가기</button><button id="lake-cafes" class="primary">운영할 카페 선택</button></header><p class="village-sub">호수와 물가는 바라보고, 산책로와 다리를 따라 걸어요. 영업 시간은 흐르지 않아요.</p><div class="village-layout"><section><div class="scene-shortcuts"><button data-lake-destination="lookout">전망대</button><button data-lake-destination="bridgeWest">다리 건너기</button><button data-lake-destination="kiosk">상점</button><button data-lake-destination="photo">사진 광장</button><button data-lake-destination="site">2호점 부지</button></div><div class="village-scroll scene-viewport"><div class="lake-map scene-map" tabindex="0" role="group" aria-label="호수와 산책로 지도">${sceneMarkup(lakeScene, !!saved.portfolio.founded)}<button class="scene-spot" data-lake-exit style="left:1490px;top:1145px">햇살 골목으로 →</button></div></div><div class="scene-toolbar"><p>방향키·WASD / 길 터치 / 버튼 길게 누르기</p><button id="scene-overview">전체 지도</button></div><div class="village-controls"><button data-lake-dir="up" aria-label="호숫가 위로">↑</button><div><button data-lake-dir="left" aria-label="호숫가 왼쪽으로">←</button><button data-lake-dir="down" aria-label="호숫가 아래로">↓</button><button data-lake-dir="right" aria-label="호숫가 오른쪽으로">→</button></div></div></section><aside class="village-aside"><div id="lake-story"></div></aside></div><p id="lake-message" role="status"></p></article>`;
    const map = root.querySelector('.lake-map'), story = root.querySelector('#lake-story'), message = root.querySelector('#lake-message');
    function write(change) { const next = structuredClone(saved); if (change(next) === false)
        return false; next.portfolio.district.scenePosition = { version: 2, region: 'lake', ...pos }; syncLake(next); next.updatedAt = new Date().toISOString(); const w = repo.write(next, saved); if (!w.ok) {
        message.textContent = w.message;
        explorer?.stop();
        const p = restoreSceneLocation(lakeScene, saved.portfolio.district.position, saved.portfolio.district.scenePosition);
        pos = { x: p.x, y: p.y };
        explorer?.setPosition(pos);
        return false;
    } saved = next; return true; }
    function persistLocation() { const p = saved.portfolio.district.scenePosition; if (!p || Math.hypot(p.x - pos.x, p.y - pos.y) > .2)
        write(() => { }); }
    function nearSite() { const p = sceneTarget(lakeScene, 'site'); return Math.hypot(pos.x - p.x, pos.y - p.y) < 95; }
    function closeDialogue() { rpg?.destroy(); social?.end(); dialogResident = false; }
    function overview(show = true) {
        closeDialogue();
        if (show)
            social?.showSheet();
        dialogResident = false;
        root.classList.remove('village-talking');
        story.innerHTML = '<h2>호숫가 탐험 수첩</h2><p>새 이웃4명 · 의뢰5개 · 마을과 학습 기록은 공통이에요.</p>' + lakeResidents.map(n => '<button data-talk-link="' + n.id + '">' + esc(n.name) + ' 찾아가기</button>').join('') + '<h3>2호점 창업 조건</h3><p>마을5단계 · 부지 정비 · 길 안내 · 여행객 주문 해결</p><p>' + lakeQuests.filter(q => q.core).map(q => q.name + ': ' + (saved.portfolio.district.quests[q.id]?.claimed ? '완료' : '진행 필요')).join('<br>') + '</p><p>마을 공동 지원으로 창업비0원 · 초기 자본0원. 1호점 돈과 자산은 그대로예요.</p>' + (saved.portfolio.founded ? '<p>창업 완료! 운영할 카페 선택에서 두 카페를 오갈 수 있어요.</p>' : '<button id="lake-found" ' + (['site', 'guide', 'orders'].every(id => saved.portfolio.district.quests[id]?.claimed) && nearSite() ? '' : 'disabled') + '>호숫가 2호점 창업하기</button>') + '<button id="lake-site-route">2호점 부지로 걸어가기</button><p>부지 앞에 도착하면 창업을 확인할 수 있어요.</p><h3>모은 기념품</h3><p>' + saved.portfolio.district.souvenirs.map(id => lakeQuests.find(q => q.id === id).reward).join(' · ') + '</p>';
        if (saved.v26) {
            const old = story.querySelector('#lake-found');
            if (old) {
                const b = document.createElement('button');
                b.textContent = '자동 운영 지점 창업·관리';
                b.onclick = () => { void openProgressiveHub(repo, () => { const read = repo.read(); if (read.status === 'ready')
                    saved = read.save; overview(); }); };
                old.replaceWith(b);
            }
            for (const p of story.querySelectorAll('p'))
                if (p.textContent?.includes('창업비0원'))
                    p.textContent = 'v2.6 지점은 유료 자동 운영 가게예요. 본점 Lv.14와 마을 3단계부터 투자 화면에서 창업해요.';
        }
        story.querySelector('#lake-site-route')?.addEventListener('click', siteRoute);
        story.querySelectorAll('[data-talk-link]').forEach(b => b.onclick = () => approach(b.dataset.talkLink));
        story.querySelector('#lake-found')?.addEventListener('click', () => { story.innerHTML = '<h2>2호점을 열까요?</h2><p>1호점과 분리된 새 Lv.1 카페를 만들어요. 돈·직원·배치는 독립, 공부 기록·가구 해금·마을은 공통이에요. 창업비0원, 초기 자본0원.</p><button id="lake-found-confirm">창업 확정 · 1호점 보존</button><button id="lake-found-cancel">취소</button>'; story.querySelector('#lake-found-cancel').addEventListener('click', () => overview()); story.querySelector('#lake-found-confirm').addEventListener('click', () => { if (write(s => foundSecondCafe(s))) {
            markSceneFounded(map);
            overview();
            message.textContent = '호숫가 2호점을 열었어요! 운영할 카페 선택에서 만나 봐요.';
        } }); });
    }
    function dialogue(id, reaction) {
        const npc = lakeResidents.find(r => r.id === id);
        if (!npc || !social?.begin(id))
            return;
        const first = !saved.portfolio.district.residents.includes(id);
        if (!reaction && !write(s => talkLake(s, id))) {
            social.end();
            return;
        }
        dialogResident = true;
        const turn = turns.get(id) ?? 0;
        if (!reaction)
            turns.set(id, turn + 1);
        rpg.show({ id, name: lakeScene.residents.find(r => r[0] === id)[1], role: lifeProfiles[id].role, visual: npc.visual, lines: [(!reaction && turn === 0 ? growthReaction(id, saved.village?.progression?.stage ?? 1) : undefined) ?? residentLine(id, { first, stage: saved.village.progression.stage, reaction, turn }), npc.line], quests: lakeQuests.filter(q => q.resident === id).map(q => { const r = saved.portfolio.district.quests[q.id], ready = lakeQuestReady(saved, q.id); return { id: q.id, name: q.name, story: q.core ? '새 이웃과 함께 호숫가 2호점 창업을 준비해요.' : '호숫가의 작은 추억을 함께 만들어요.', status: r?.claimed ? 'complete' : ready ? 'ready' : r ? 'active' : 'available', progress: Object.entries(q.goals).map(([k, n]) => ({ correct: '학습 정답', served: '서빙', talks: '다른 이웃 인사', spots: '장소 방문', mini: '미니게임 성공' }[k] + ' ' + (r?.progress[k] ?? 0) + '/' + n)).join(' · '), reward: q.reward + (q.core ? ' · 창업 핵심 의뢰' : ''), action: r?.claimed ? '해결 완료' : ready ? '완료 보고 · 기념품 받기' : r ? '카페에서 이어가요' : '의뢰 받기' }; }), onClose: closeDialogue, onStudy: () => { cleanup(); enterCafe(); }, onAction: qid => { const q = lakeQuests.find(q => q.id === qid && q.resident === id); if (!q)
                return; const existing = !!saved.portfolio.district.quests[qid]; if (write(s => existing ? claimLakeQuest(s, qid) : acceptLakeQuest(s, qid))) {
                dialogue(id, existing ? 'complete' : 'accept');
                message.textContent = existing ? '기념품을 받았어요.' : '의뢰를 받았어요. 지금부터의 활동이 기록돼요.';
            } } });
    }
    function clearIntent() { social?.cancel(); social?.hideSheet(); pendingResident = undefined; pendingSite = false; pendingBack = false; dialogResident = false; root.classList.remove('village-talking'); }
    function target(p) { explorer?.target(p); }
    function siteRoute() { clearIntent(); pendingSite = true; target(sceneTarget(lakeScene, 'site')); }
    function approach(id) { root.dataset.lastInteraction = "approach:" + id; if (rpg?.active)
        return; clearIntent(); if (social?.ready(id)) {
        root.dataset.lastInteraction = "near:" + id;
        dialogue(id);
        return;
    } const p = social?.approach(id); if (!p)
        return; pendingResident = id; target(p); root.querySelector('.scene-viewport').scrollIntoView({ block: 'nearest' }); }
    function arrive() { if (!write(s => { for (const spot of lakeSpots) {
        const p = sceneTarget(lakeScene, spot.id);
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < 55)
            visitLake(s, spot);
    } }))
        return; if (pendingBack) {
        pendingBack = false;
        const p = sceneTarget(lakeScene, "entry");
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < 60 && write(s => { s.portfolio.district.region = 'village'; })) {
            cleanup();
            back();
        }
        return;
    } if (pendingResident) {
        const id = pendingResident;
        pendingResident = undefined;
        if (social?.ready(id)) {
            dialogResident = true;
            dialogue(id);
        }
    }
    else {
        const show = pendingSite;
        pendingSite = false;
        overview(show);
    } }
    social = new VillageSocial({ scene: lakeScene, root, map, viewport: root.querySelector('.scene-viewport'), player: () => pos, talk: id => dialogue(id), message: text => { message.textContent = text; } });
    rpg = new VillageDialogue(root);
    const book = document.createElement('button');
    book.id = 'lake-journal';
    book.textContent = '탐험 수첩';
    root.querySelector('.scene-toolbar').prepend(book);
    book.onclick = () => overview();
    explorer = new VillageExplorer({ scene: lakeScene, map, viewport: root.querySelector('.scene-viewport'), controls: root.querySelector('.village-controls'), position: pos, onPosition: p => { pos = p; }, onArrive: arrive, onCheckpoint: persistLocation, onReject: () => { message.textContent = '호수와 건물을 피해 산책로를 골라 주세요.'; }, canMove: () => !rpg?.active, canEnter: (a, b) => social.world.canPlayerMove(a, b), resolveStep: (a, b) => social.world.resolvePlayerStep(a, b), crowded: p => social.world.crowded(p), onFrame: dt => social?.tick(dt), onManual: clearIntent });
    social.attach(explorer);
    map.addEventListener('click', e => { if (rpg?.active)
        return; const button = e.composedPath().find(n => n instanceof HTMLButtonElement); const id = button?.dataset.lakeResident; if (id) {
        approach(id);
        return;
    } if (button)
        return; const p = explorer.clickPoint(e), picked = social?.pick(p); if (picked) {
        approach(picked);
        return;
    } clearIntent(); target(p); });
    root.querySelectorAll('[data-building]').forEach(b => b.onclick = () => { const id = b.dataset.building; if (id === 'site')
        siteRoute();
    else if (id === 'kiosk')
        approach('seller');
    else {
        clearIntent();
        target(sceneTarget(lakeScene, id));
    } });
    root.querySelectorAll('[data-lake-spot]').forEach(b => b.onclick = () => { clearIntent(); target(sceneTarget(lakeScene, b.dataset.lakeSpot)); });
    root.querySelectorAll('[data-lake-destination]').forEach(b => b.onclick = () => { if (b.dataset.lakeDestination === 'site')
        siteRoute();
    else if (b.dataset.lakeDestination === 'kiosk')
        approach('seller');
    else {
        clearIntent();
        target(sceneTarget(lakeScene, b.dataset.lakeDestination));
    } });
    const returnVillage = () => { clearIntent(); pendingBack = true; target(sceneTarget(lakeScene, 'entry')); };
    root.querySelector('#lake-back').addEventListener('click', returnVillage);
    root.querySelector('[data-lake-exit]').addEventListener('click', returnVillage);
    root.querySelector('#lake-cafes').addEventListener('click', () => { cleanup(); enterCafe(); });
    root.querySelector('#scene-overview').addEventListener('click', () => { root.querySelector('#scene-overview').textContent = explorer.toggleOverview() ? '가까이 보기' : '전체 지도'; });
    overview(false);
    map.focus({ preventScroll: true });
}
