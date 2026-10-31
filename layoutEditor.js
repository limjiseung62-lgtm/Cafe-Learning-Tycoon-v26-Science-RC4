import { openFreeEditor } from './freeLayoutEditor.js';
import { planFor, defaultPlan, validatePlan, commitPlan } from './cafeLayout.js';
import { layoutFacilities, tableRect, decorRect } from './layoutModel.js';
import { createSpace, floorPath, hallGrowthSpecs } from './spatial.js';
import { branchRoom, branchCatalog } from './growthBranch.js';
import { sprite } from './art.js';
import { allDecorationCatalog as decorationCatalog } from './longGrowthConfig.js';
import { escapeText as esc } from './questionRenderer.js';
import { ensureGrowthWriteLock, supportsGrowthLock } from './growthWriteLock.js';
export async function openLegacyLayoutEditor(repo, initial, onClose) {
    document.getElementById('layout-editor')?.remove();
    const dialog = document.createElement('section');
    dialog.id = 'layout-editor';
    dialog.className = 'mode-confirm layout-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '카페 꾸미기');
    document.body.append(dialog);
    document.documentElement.classList.add('layout-editing');
    const close = () => { dialog.remove(); document.documentElement.classList.remove('layout-editing'); onClose(); };
    const stop = (message) => { dialog.innerHTML = '<div><h2>카페 꾸미기</h2><p>' + esc(message) + '</p><button id="layout-close">닫기</button></div>'; dialog.querySelector('#layout-close').onclick = close; };
    if (!supportsGrowthLock() || !await ensureGrowthWriteLock()) {
        stop('다른 창에서 카페를 운영 중인지 확인해 주세요. 저장 보호를 위해 최신 브라우저의 HTTPS 또는 localhost 접속이 필요해요.');
        return;
    }
    const loaded = repo.read();
    if (loaded.status !== 'ready' && loaded.status !== 'empty') {
        stop('저장 데이터를 먼저 복구해 주세요. 기존 저장은 보존했어요.');
        return;
    }
    const save = structuredClone(loaded.status === 'ready' ? loaded.save : initial);
    if (save.campaign?.run && !save.campaign.run.closed) {
        stop('중단한 영업을 먼저 마쳐 주세요. 카페 꾸미기는 영업 전·후에 할 수 있어요.');
        return;
    }
    let draft = planFor(save), selected = draft.tables[0].id, message = '', history = [], showPaths = false;
    const base = createSpace(draft.level, true, draft.branch ?? undefined), facilities = layoutFacilities(base), room = draft.branch ? branchRoom(draft.branch) : draft.level >= 11 ? 'assets/web/long-growth/bakery.webp' : draft.level >= 7 ? 'assets/web/art/room-7.webp' : draft.level === 1 ? 'assets/web/art/room.webp' : 'assets/web/art/room-' + draft.level + '.webp';
    const selectedItem = () => [...draft.tables, ...draft.decor].find(t => t.id === selected);
    const change = (fn) => { history.push(structuredClone(draft)); if (history.length > 30)
        history.shift(); fn(); message = ''; render(); };
    const move = (x, y) => { if (!selectedItem())
        return; change(() => { const t = selectedItem(); t.x = Math.max(4, Math.min(96, Math.round(x / 2) * 2)); t.y = Math.max(8, Math.min(90, Math.round(y / 2) * 2)); }); };
    const render = () => {
        const scroll = dialog.querySelector('.layout-shell')?.scrollTop ?? 0;
        const space = createSpace(draft.level, true, draft.branch ?? undefined, draft), issues = validatePlan(draft), item = selectedItem(), footprint = selected.startsWith('table-') ? tableRect(space.tables.find(t => t.tableId === selected)) : decorRect(draft.decor.find(d => d.id === selected)), name = selected.startsWith('table-') ? '테이블 ' + selected.split('-')[1] : decorationCatalog.find(d => 'decor-' + d.id === selected)?.name ?? '가구';
        let routes = '';
        if (showPaths && !issues.length) {
            const seat = space.seats.find(s => s.tableId === selected) ?? space.seats[0];
            const lines = [floorPath(space, space.entrance, seat.approach), floorPath(space, space.pickup, seat.servicePoint)];
            routes = '<svg class="layout-routes" viewBox="0 0 100 100" preserveAspectRatio="none">' + lines.map((p, i) => '<polyline fill="none" stroke="' + (i ? '#aa2e92' : '#0063ab') + '" stroke-width=".6" points="' + p.map(p => p.x + ',' + p.y).join(' ') + '"/>').join('') + '</svg>';
        }
        dialog.innerHTML = '<div class="layout-shell"><header class="layout-heading"><div><p class="eyebrow">MY LITTLE CAFE</p><h2>카페 꾸미기</h2></div><button id="layout-cancel" class="secondary">취소 · 돌아가기</button></header><p class="layout-intro">' + (branchCatalog.find(b => b.id === draft.branch)?.name ?? '내 카페') + ' · ' + draft.level + '단계<br>가구를 고르고 놓을 칸을 눌러요. PC에서는 끌어서 옮길 수도 있어요.</p><div class="layout-workspace"><div class="layout-canvas-wrap"><div class="layout-board ' + (issues.length ? 'invalid' : 'valid') + '" tabindex="0" role="group" aria-label="카페 배치 격자. 선택한 가구를 방향키로 이동할 수 있어요" style="background-image:url(' + room + ');background-position:center;background-size:' + (draft.branch ? 100 : hallGrowthSpecs[draft.level - 1].zoom * 100) + '% ' + (draft.branch ? 100 : hallGrowthSpecs[draft.level - 1].zoom * 100) + '%">' + facilities.fixed.concat(facilities.reserved).map(r => '<span class="layout-fixed" style="left:' + r.left + '%;top:' + r.top + '%;width:' + (r.right - r.left) + '%;height:' + (r.bottom - r.top) + '%" title="' + r.name + '">' + (r.right - r.left > 5 ? r.name : '') + '</span>').join('') + space.tables.map(t => '<span class="layout-object ' + (t.tableId === selected ? 'selected' : '') + '" data-object="' + t.tableId + '" style="left:' + t.x + '%;top:' + t.y + '%;width:' + 14 * t.scale + '%;transform:translate(-50%,-100%) scaleX(' + (t.rotation === 180 ? -1 : 1) + ')">' + sprite(t.artKey ?? 'table') + '</span>').join('') + draft.decor.map(d => '<img class="layout-object ' + (d.id === selected ? 'selected' : '') + '" data-object="' + d.id + '" src="assets/art/long-growth/' + d.decorId + '.svg" alt="' + esc(decorationCatalog.find(c => c.id === d.decorId).name) + '" style="left:' + d.x + '%;top:' + d.y + '%;width:' + (d.decorId === 'showcase' ? 10 : d.decorId === 'bread' ? 8 : 6) + '%;transform:translate(-50%,-100%) scaleX(' + (d.rotation === 180 ? -1 : 1) + ')">').join('') + '<span class="layout-footprint ' + (issues.length ? 'blocked' : 'clear') + '" style="left:' + footprint.left + '%;top:' + footprint.top + '%;width:' + (footprint.right - footprint.left) + '%;height:' + (footprint.bottom - footprint.top) + '%"></span>' + routes + issues.map(i => '<span class="layout-error-dot" style="left:' + i.x + '%;top:' + i.y + '%" title="' + esc(i.message) + '">!</span>').join('') + '</div><p class="layout-legend">초록 테두리: 배치 가능 · 빨간 테두리: 수정 필요<br>줄무늬: 고정 시설·입구·직원 통로</p></div><aside class="layout-inventory"><h3>가구 고르기</h3><div class="layout-choices">' + draft.tables.map((t, i) => '<button class="secondary ' + (selected === t.id ? 'chosen' : '') + '" data-select="' + t.id + '">테이블 ' + (i + 1) + '</button>').join('') + '</div><h3>모은 장식</h3><div class="layout-choices">' + decorationCatalog.filter(d => save.longTerm?.owned.includes(d.id)).map(d => '<button class="secondary ' + (selected === 'decor-' + d.id ? 'chosen' : '') + '" data-decor="' + d.id + '"><img src="assets/art/long-growth/' + d.id + '.svg" alt="">' + d.name + (draft.decor.some(x => x.decorId === d.id) ? ' · 배치 중' : ' · 놓기') + '</button>').join('') + '</div>' + (!save.longTerm?.owned.length ? '<p>미션과 손님 도감에서 장식을 모아 보세요.</p>' : '') + '</aside></div><section class="layout-controls"><strong>' + name + (item ? ' · ' + item.x + ', ' + item.y : '') + '</strong><div class="layout-actions"><button id="layout-left" aria-label="왼쪽 한 칸">←</button><button id="layout-right" aria-label="오른쪽 한 칸">→</button><button id="layout-up" aria-label="위쪽 한 칸">↑</button><button id="layout-down" aria-label="아래쪽 한 칸">↓</button><button id="layout-rotate">좌우 방향 바꾸기</button><button id="layout-remove" ' + (selected.startsWith('decor-') ? '' : 'disabled') + '>장식 치우기</button><button id="layout-undo" ' + (history.length ? '' : 'disabled') + '>되돌리기</button><button id="layout-default">기본 배치</button><button id="layout-paths">' + (showPaths ? '동선 숨기기' : '동선 보기') + '</button></div><p class="layout-status" role="status">' + esc(message || (issues.length ? issues[0].message + ' (' + issues.length + '곳)' : '모든 좌석과 직원 통로를 확인했어요.')) + '</p><button id="layout-confirm" class="primary" ' + (issues.length ? 'disabled' : '') + '>배치 확정 · 저장</button><p class="hint">배치는 현재 가게 종류·단계에 저장해요. 확장하면 새 공간의 기본 배치로 시작해요.<br>작은 화면에서는 방향 버튼으로 정확하게 옮길 수 있어요. 벽 장식은 위쪽 벽에 놓아요.</p></section></div>';
        const bind = (id, fn) => dialog.querySelector('#' + id).onclick = fn;
        bind('layout-cancel', close);
        bind('layout-undo', () => { if (history.length) {
            draft = history.pop();
            if (!selectedItem())
                selected = draft.tables[0].id;
            message = '';
            render();
        } });
        bind('layout-default', () => change(() => { draft = defaultPlan(base, save); selected = draft.tables[0].id; }));
        bind('layout-rotate', () => change(() => { selectedItem().rotation = selectedItem().rotation === 0 ? 180 : 0; }));
        bind('layout-remove', () => change(() => { draft.decor = draft.decor.filter(d => d.id !== selected); selected = draft.tables[0].id; }));
        bind('layout-paths', () => { showPaths = !showPaths; render(); });
        for (const [direction, dx, dy] of [['left', -2, 0], ['right', 2, 0], ['up', 0, -2], ['down', 0, 2]])
            bind('layout-' + direction, () => move(item.x + dx, item.y + dy));
        dialog.querySelectorAll('[data-select]').forEach(b => b.onclick = () => { selected = b.dataset.select; render(); });
        dialog.querySelectorAll('[data-decor]').forEach(b => b.onclick = () => { const id = b.dataset.decor; selected = 'decor-' + id; if (draft.decor.some(d => d.id === selected))
            render();
        else
            change(() => { const wall = decorationCatalog.find(d => d.id === id).slot === 'wall'; draft.decor.push({ id: selected, decorId: id, x: 20, y: wall ? 16 : 30, rotation: 0 }); }); });
        bind('layout-confirm', () => { const current = repo.read(); if (current.status === 'ready' && JSON.stringify(current.save) !== JSON.stringify(save) || current.status !== 'ready' && current.status !== 'empty') {
            message = '저장이 바뀌었어요. 닫고 다시 열어 주세요.';
            render();
            return;
        } const next = structuredClone(save); if (!commitPlan(next, draft)) {
            message = '통로와 가구를 다시 확인해 주세요.';
            render();
            return;
        } next.updatedAt = new Date().toISOString(); const r = repo.write(next, save); if (!r.ok) {
            message = r.message;
            render();
            return;
        } close(); });
        const board = dialog.querySelector('.layout-board');
        let start = null;
        board.onpointerdown = e => { const target = e.target.closest('[data-object]'); start = { x: e.clientX, y: e.clientY, id: target?.dataset.object ?? null, type: e.pointerType }; board.setPointerCapture(e.pointerId); };
        board.onpointerup = e => { if (!start)
            return; const r = board.getBoundingClientRect(), distance = Math.hypot(e.clientX - start.x, e.clientY - start.y), s = start; start = null; if (s.id) {
            selected = s.id;
            if (distance < 5 || s.type === 'touch') {
                render();
                return;
            }
            const t = selectedItem();
            move(t.x + (e.clientX - s.x) / r.width * 100, t.y + (e.clientY - s.y) / r.height * 100);
            return;
        } move((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100); };
        board.onpointercancel = () => { start = null; };
        board.onkeydown = e => { const d = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key]; if (d) {
            e.preventDefault();
            move(item.x + d[0], item.y + d[1]);
            dialog.querySelector('.layout-board').focus();
        } };
        dialog.querySelector('.layout-shell').scrollTop = scroll;
    };
    render();
}
export const openLayoutEditor = openFreeEditor;
