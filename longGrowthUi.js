import { unlocked } from './progressiveFeatures.js';
import { downloadShowcase } from './cafeShowcase.js';
import { openManagementAlbum } from './managementAlbumUi.js';
import { growthRuntime } from './growthRuntime.js';
import { syncFurniture } from './furnitureUnlocks.js';
import { furnitureCatalog } from './furnitureCatalog.js';
import { freeKey } from './freeLayoutModel.js';
import { layoutKey } from './layoutModel.js';
import { branchRoom } from './growthBranch.js';
import { createLongGrowth, offerBoard, selectBoard, pollBoard, observeVisitors, allVisitorCatalog as visitorCatalog, guestCollectionId } from './longGrowth.js';
import { allBoardCatalog as boardCatalog, allDecorationCatalog as decorationCatalog, decorSlots } from './longGrowthConfig.js';
import { escapeText as esc } from './questionRenderer.js';
import { customerPoseArt, selectCustomerPose } from './customerPoses.js';
const prepared = new WeakMap(), states = new WeakMap();
let active = null, save = () => { }, currentBusiness = '';
let lastProjection = '', lastLevel = 0, notice = '', noticeStamp = '', noticeUntil = 0;
export const longStateFor = (g) => states.get(g);
export function prepareLongState(g, state) { prepared.set(g, state); }
export function chooseLongMission(base, pool) { const state = structuredClone(base.longTerm ?? createLongGrowth()), id = crypto.randomUUID(), first = pool[0]; const previous = base.campaign?.studies[first.packId]; const b = offerBoard(state, id, base.cafeLevel, new Set(pool.map(q => q.skillId)).size, !!previous && Object.values(previous.progress.questions).some(q => q.priority > 0), base.specialization?.selected); return new Promise(resolve => { const dialog = document.createElement('section'); dialog.className = 'mode-confirm long-dialog'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-label', '오늘의 미션 선택'); dialog.innerHTML = '<div><p class="eyebrow">새로운 15분의 작은 목표</p><button id="cancel-board" class="secondary">학습 선택으로 돌아가기</button><h2>오늘은 무엇을 해 볼까요?</h2><p>선택한 미션은 영업에서 진행돼요. 실패 벌금은 없어요.</p><div class="mission-options">' + b.offered.map(id => { const original = boardCatalog.find(m => m.id === id), m = base.growthBranch && id === 'bakery' ? { ...original, name: '구석구석 따뜻하게', description: '대표 좌석 네 곳에도 음식을 가져다줘요.' } : original; return '<button class="mission-choice" data-board="' + id + '"><span>' + ({ learning: '학습', review: '복습', operations: '카페 운영', visitors: '손님', events: '특별 이벤트' }[m.kind]) + '</span><strong>' + m.name + '</strong><p>' + m.description + '</p><small>보상 · ' + decorationCatalog.find(d => d.id === m.reward).name + ' / 기념 칭호</small></button>'; }).join('') + '</div><p class="hint">이미 가진 장식은 중복 지급하지 않아요. 15분 완주와 학습 활동 조건을 채우면 미션 성장 지원금을 받아요. 미션 종류별 지원금은 같아요. 미션을 달성하면 새 가구도 열려요.</p></div>'; document.body.append(dialog); dialog.querySelector('#cancel-board').onclick = () => { dialog.remove(); resolve(null); }; dialog.querySelectorAll('[data-board]').forEach(button => button.onclick = () => { const rate = previous?.attempted ? previous.correct / previous.attempted : .7; selectBoard(state, id, button.dataset.board, base.cafeLevel, rate); dialog.remove(); resolve({ id, state }); }); }); }
export function beginLongGrowth(g, base, businessId, onSave) { document.getElementById('progressive-unlock')?.remove(); document.getElementById('collected-decor')?.remove(); document.getElementById('long-tools')?.remove(); document.getElementById('collection-panel')?.remove(); if (g.mode !== 'CAFE_GROWTH' || !unlocked(g, 'missions')) {
    active = null;
    return;
} active = g; currentBusiness = businessId; save = onSave; lastProjection = ''; lastLevel = g.cafeLevel; notice = ''; const state = prepared.get(g) ?? structuredClone(base.longTerm ?? createLongGrowth()); states.set(g, state); if (!state.albums.includes(g.cafeLevel))
    state.albums.push(g.cafeLevel); const controls = document.createElement('section'); controls.id = 'long-tools'; controls.className = 'long-tools'; controls.innerHTML = '<button id="open-board" class="secondary">오늘의 미션</button><button id="open-collection" class="secondary">손님 도감</button><button id="open-interior" class="secondary">인테리어</button><button id="open-album" class="secondary">카페 앨범</button><button id="cafe-photo" class="secondary">내 카페 사진 PNG</button><p id="long-notice" role="status"></p>'; document.getElementById('playing').after(controls); g.growthObserver = guest => { const fake = { ...g, guests: [guest] }; const found = observeVisitors(state, fake); if (found.length)
    notice = '새로운 만남! ' + found.join(' · '); const b = state.boards.find(b => b.businessId === currentBusiness); if (b && !guestCollectionId(guest).startsWith('normal:')) {
    b.specialIds ??= [];
    if (!b.specialIds.includes(guest.id))
        b.specialIds.push(guest.id);
} if (b && guest.servedAt !== undefined) {
    b.servedIds ??= [];
    if (!b.servedIds.includes(guest.id)) {
        b.servedIds.push(guest.id);
        if (g.cafeLevel >= 11 && guest.seat % 7 < 4)
            b.upstairs = (b.upstairs ?? 0) + 1;
    }
    b.soldMenus ??= [];
    for (const o of guest.order)
        if (!b.soldMenus.includes(o.menuId))
            b.soldMenus.push(o.menuId);
} }; document.getElementById('open-board').onclick = () => openPanel('board'); document.getElementById('open-collection').onclick = () => openPanel('collection'); document.getElementById('open-interior').onclick = () => openPanel('interior'); document.getElementById('open-album').onclick = () => { const s = growthRuntime.savedFor(g) ?? base; if (s.management)
    openManagementAlbum(s);
else
    openPanel('album'); }; document.getElementById('cafe-photo').onclick = () => { const b = document.getElementById('cafe-photo'); b.disabled = true; notice = '카페 사진을 준비하고 있어요.'; void downloadShowcase(g).catch(e => { notice = e.message; }).finally(() => { b.disabled = false; }); }; }
function openPanel(tab) { if (!active || !unlocked(active, tab === 'interior' ? 'decor' : tab === 'album' ? 'landmark' : 'missions'))
    return; document.getElementById('collection-panel')?.remove(); const state = states.get(active), dialog = document.createElement('section'); dialog.id = 'collection-panel'; dialog.className = 'mode-confirm long-dialog'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-label', '카페 수집과 성장'); const titles = { board: '오늘의 미션', collection: '함께한 손님들', interior: '나만의 작은 장식', album: '카페 추억 앨범' }; let content = ''; if (tab === 'board') {
    const b = state.boards.find(b => b.businessId === currentBusiness), original = boardCatalog.find(m => m.id === b?.selected), m = active.branchId && original?.id === 'bakery' ? { ...original, name: '구석구석 따뜻하게', description: '대표 좌석 네 곳에도 음식을 가져다줘요.' } : original;
    content = b && m ? '<h3>' + m.name + '</h3><p>' + m.description + '</p><p>목표 ' + b.target + ' · ' + (b.complete ? '완료! 장식·칭호 획득 · 성장 지원금은 15분 완주와 학습 조건 확인 후 정산해요.' : b.closed ? '이번 영업 종료 · 다음에 다시 도전해요.' : '영업 중 진행돼요.') + '</p><p>다른 종류의 미션도 다음 영업에서 만나 보세요.</p>' : '<p>다음 영업을 시작할 때 미션을 골라요.</p>';
} if (tab === 'collection')
    content = '<p>발견 ' + Object.keys(state.visitors).length + ' / ' + visitorCatalog.length + ' · 정상 서빙 보상은 장식이에요.</p><div class="collection-grid">' + visitorCatalog.map(c => { const r = state.visitors[c.id]; return '<article class="visitor-card ' + (r ? '' : 'undiscovered') + '">' + (r ? customerPoseArt(selectCustomerPose(c.visual, 'ENTERING', 'left')) : '<span class="unknown-visitor">?</span>') + '<strong>' + esc(r ? c.name : '아직 만나지 않았어요') + '</strong>' + (r ? '<p>' + esc(r.line) + '</p><small>첫 방문 ' + esc(r.firstVisit.slice(0, 10)) + ' · ' + (r.served ? '서빙 성공 · 보상 받음' : '다음에는 대접해요') + '</small>' : '') + '</article>'; }).join('') + '</div>'; if (tab === 'interior')
    content = '<p>모은 장식과 테마 가구는 영업 전·후 카페 꾸미기에서 배치해요. 장식 자체의 매출 보너스는 없어요.</p><div class="decor-collection">' + decorationCatalog.map(d => '<article><img loading="lazy" src="assets/art/long-growth/' + d.id + '.svg" alt="' + d.name + '"><strong>' + d.name + '</strong><small>' + (state.owned.includes(d.id) ? '획득' : '미션·손님 보상으로 획득') + '</small></article>').join('') + '</div>'; if (tab === 'album')
    content = '<p>지난 가게의 모습은 사진처럼 보관해요. 다시 열어도 보상이 지급되지 않아요.</p><div class="album-grid">' + state.albums.map(level => '<article><img loading="lazy" src="' + (level === active.cafeLevel && active.branchId ? branchRoom(active.branchId) : level >= 11 ? 'assets/web/long-growth/bakery.webp' : level >= 7 ? 'assets/web/art/room-7.webp' : level === 1 ? 'assets/web/art/room.webp' : 'assets/web/art/room-' + level + '.webp') + '" alt="' + level + '단계 카페"><strong>카페 ' + level + '단계</strong></article>').join('') + '</div>'; dialog.innerHTML = '<div><div class="collection-head"><h2>' + titles[tab] + '</h2><button id="close-collection" class="secondary" aria-label="카페로 돌아가기">닫기 · 카페로</button></div>' + content + '</div>'; document.body.append(dialog); document.getElementById('close-collection').onclick = () => dialog.remove(); }
function paintDecor() { if (!active)
    return; const state = states.get(active); let layer = document.getElementById('collected-decor'); if (!layer) {
    layer = document.createElement('div');
    layer.id = 'collected-decor';
    document.getElementById('cafe-room').append(layer);
} const plan = active.freeLayouts?.plans[freeKey(active.cafeLevel, active.branchId)] ?? active.layouts?.plans[layoutKey(active.cafeLevel, active.branchId)]; const html = plan ? plan.decor.map(d => '<img src="assets/art/long-growth/' + d.decorId + '.svg" alt="' + esc(decorationCatalog.find(c => c.id === d.decorId).name) + '" style="left:' + d.x + '%;top:' + d.y + '%;width:' + (d.decorId === 'showcase' ? 10 : d.decorId === 'bread' ? 8 : 6) + '%;z-index:' + Math.round(d.y * 10) + ';transform:translate(-50%,-100%) scaleX(' + (d.rotation === 180 ? -1 : 1) + ')">').join('') : Object.entries(state.placed).map(([slot, id]) => { const s = decorSlots.find(s => s.id === slot), d = decorationCatalog.find(d => d.id === id); return '<img src="assets/art/long-growth/' + id + '.svg" alt="' + d.name + ' · ' + s.name + '" style="left:' + s.x + '%;top:' + s.y + '%">'; }).join(''); if (layer.innerHTML !== html)
    layer.innerHTML = html; }
export function pollLongGrowth(g, learning) { if (g !== active)
    return; const state = states.get(g); const album = document.getElementById('open-album'); if (album && g.management) {
    album.disabled = g.status !== 'CLOSED';
    album.title = album.disabled ? '영업이 끝나면 성장 앨범을 볼 수 있어요.' : '통합 성장 앨범';
} const b = state.boards.find(b => b.businessId === currentBusiness); const metrics = { correct: g.stats.correct, skills: new Set(learning.attempts.filter(a => a.correct).map(a => a.skillId)).size, review: learning.attempts.filter(a => a.correct && a.isRemediation).length, served: g.stats.servedCustomers, menus: b?.soldMenus?.length ?? 0, special: b?.specialIds?.length ?? 0, events: g.events.records.filter(r => r.outcome === 'success').length, specialization: Math.min(g.stats.correct, g.stats.servedCustomers), upstairs: b?.upstairs ?? 0 }; if (pollBoard(state, currentBusiness, metrics, g.status === 'CLOSED'))
    notice = '오늘의 목표 달성! 장식과 기념 칭호를 받았어요.'; if (g.cafeLevel !== lastLevel) {
    lastLevel = g.cafeLevel;
    if (!state.albums.includes(g.cafeLevel))
        state.albums.push(g.cafeLevel);
    if ([7, 11].includes(g.cafeLevel)) {
        notice = g.cafeLevel === 7 ? '어떤 가게로 성장할지 골라 보세요!' : g.branchId ? '가게가 한 단계 더 성장했어요!' : '복층 베이커리가 문을 열었어요!';
    }
} const newFurniture = unlocked(g, 'decor') ? syncFurniture({ state, level: g.cafeLevel, branch: g.branchId, events: metrics.events }) : []; if (newFurniture.length)
    notice = '새 가구 해금! ' + newFurniture.map(id => furnitureCatalog.find(d => d.id === id).name).join(' · '); if (notice !== noticeStamp) {
    noticeStamp = notice;
    noticeUntil = performance.now() + 6500;
} const el = document.getElementById('long-notice'); if (el)
    el.textContent = performance.now() < noticeUntil ? notice : ''; const boardButton = document.getElementById('open-board'); if (boardButton && b) {
    const m = boardCatalog.find(m => m.id === b.selected);
    boardButton.textContent = m ? m.name + ' ' + Math.min(b.target, (metrics[m.metric] ?? 0)) + '/' + b.target + (b.complete ? ' ✓' : '') : '오늘의 미션';
} if (unlocked(g, 'decor'))
    paintDecor(); const projection = JSON.stringify(state); if (projection !== lastProjection) {
    const initial = !lastProjection;
    lastProjection = projection;
    if (!initial)
        save();
} }
