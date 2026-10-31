import { unlocked } from './progressiveFeatures.js';
import { imageReady } from './imageLoading.js';
import { specializationRoom } from './specializationConfig.js';
import { furnitureCatalog, furnitureFor } from './furnitureCatalog.js';
import { prepareFurniture, furnitureUnlocked } from './furnitureUnlocks.js';
import { placementCandidates, placementIsValid, autoArrangeDecor } from './freePlacementChoices.js';
import { freePlanFor, validateFree, commitFree, freePreset } from './freeLayout.js';
import { defaultFreePlan, tableKinds, seatBudget, freeParts, freeDecorBox, freeFixed, wallDecor } from './freeLayoutModel.js';
import { createSpace, floorPath } from './spatial.js';
import { freeFurniture, freeSprite, freeHallLayers, furnitureVisualVersion, refreshFurnitureArt } from './freeFurniture.js';
import { branchCatalog } from './growthBranch.js';
import { allDecorationCatalog as decorationCatalog } from './longGrowthConfig.js';
import { escapeText as esc } from './questionRenderer.js';
import { ensureGrowthWriteLock, supportsGrowthLock } from './growthWriteLock.js';
export async function openFreeEditor(repo, initial, onClose) {
    if (!unlocked(initial, 'decor'))
        return;
    document.getElementById('layout-editor')?.remove();
    const dialog = document.createElement('section');
    dialog.id = 'layout-editor';
    dialog.className = 'mode-confirm layout-dialog free-editor';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '나만의 카페 자유 배치');
    document.body.append(dialog);
    document.documentElement.classList.add('layout-editing');
    let imageTimer;
    let imageStamp = '';
    const close = () => { clearInterval(imageTimer); dialog.remove(); document.documentElement.classList.remove('layout-editing'); onClose(); };
    const stop = (text) => { dialog.innerHTML = '<div><h2>카페 꾸미기</h2><p>' + esc(text) + '</p><button id="free-close">돌아가기</button></div>'; dialog.querySelector('button').onclick = close; };
    if (!supportsGrowthLock() || !await ensureGrowthWriteLock()) {
        stop('다른 창에서 카페를 운영 중인지 확인해 주세요. 저장 보호를 위해 HTTPS 또는 localhost의 최신 브라우저가 필요해요.');
        return;
    }
    const loaded = repo.read();
    if (!['ready', 'empty'].includes(loaded.status)) {
        stop('기존 저장을 먼저 복구해 주세요. 카페를 덮어쓰지 않았어요.');
        return;
    }
    const save = structuredClone(loaded.status === 'ready' ? loaded.save : initial), expectedSave = structuredClone(save);
    prepareFurniture(save);
    if (save.campaign?.run && !save.campaign.run.closed) {
        stop('중단한 영업을 먼저 마쳐 주세요. 꾸미기는 영업 전·후에 해요.');
        return;
    }
    const prepared = freePlanFor(save);
    let draft = prepared.plan, selected = draft.tables[0]?.id ?? '', history = [], message = prepared.reason === 'converted' ? '기존 가구를 새 좌표로 옮겼어요. 저장하면 이전 배치도 보관해요.' : prepared.reason === 'fallback' ? '이전 배치를 보관하고 새 기본 배치를 준비했어요.' : '', paths = false;
    const budget = seatBudget(save.cafeLevel), current = () => [...draft.tables, ...draft.decor].find(o => o.id === selected), edit = (fn) => { history.push(structuredClone(draft)); if (history.length > 50)
        history.shift(); fn(); message = ''; render(); };
    const move = (x, y) => { const o = current(); if (!o)
        return; edit(() => { o.x = Math.max(2, Math.min(98, Math.round(x / 2) * 2)); o.y = Math.max(8, Math.min(96, Math.round(y / 2) * 2)); }); };
    function add(kind, furnitureId) { edit(() => { const ids = new Set(draft.tables.map(t => t.id)); let n = 1; while (ids.has('free-' + n))
        n++; const t = { id: 'free-' + n, kind, ...furnitureId ? { furnitureId } : {}, x: 50, y: 70, rotation: 0 }; let found = false; for (let y = 54; y <= 84 && !found; y += 4)
        for (let x = 14; x <= 86; x += 4) {
            t.x = x;
            t.y = y;
            const q = structuredClone(draft);
            q.tables.push({ ...t });
            if (validateFree(q).every(i => ['capacity', 'inventory'].includes(i.id))) {
                found = true;
                break;
            }
        } draft.tables.push(t); selected = t.id; }); }
    let suggestionRevision = 0, themeFilter = save.growthBranch?.active ?? 'classic', autoBusy = false;
    function render() {
        const revision = ++suggestionRevision;
        imageStamp = furnitureVisualVersion([...draft.tables, ...furnitureCatalog.filter(f => f.theme === themeFilter).map(f => ({ kind: f.kind, furnitureId: f.id }))]);
        const shell = dialog.querySelector('.layout-shell'), scroll = shell?.scrollTop ?? 0, inventoryScroll = dialog.querySelector('.layout-inventory')?.scrollTop ?? 0, focused = document.activeElement?.id, issues = validateFree(draft), valid = !issues.length, space = createSpace(draft.level, true, draft.branch ?? undefined, undefined, draft), item = current(), table = draft.tables.find(t => t.id === selected), parts = table ? freeParts(table) : item ? [freeDecorBox(item)] : [], name = table ? furnitureFor(table.kind, table.furnitureId).name : decorationCatalog.find(d => 'decor-' + d.id === selected)?.name ?? '가구를 골라 주세요', seats = draft.tables.reduce((n, t) => n + tableKinds[t.kind].seats, 0);
        let routes = '';
        if (paths && valid) {
            const seat = space.seats.find(s => s.tableId === selected) ?? space.seats[0];
            if (seat)
                routes = '<svg class="layout-routes" viewBox="0 0 100 100" preserveAspectRatio="none">' + [floorPath(space, space.entrance, seat.approach), floorPath(space, space.pickup, seat.servicePoint)].map((p, i) => '<polyline fill="none" stroke="' + (i ? '#ac3689' : '#196db3') + '" stroke-width=".55" points="' + p.map(p => p.x + ',' + p.y).join(' ') + '"/>').join('') + '</svg>';
        }
        dialog.innerHTML = '<div class="layout-shell"><header class="layout-heading"><div><p class="eyebrow">MAKE IT YOURS</p><h2>나만의 카페 꾸미기</h2></div><button id="free-cancel" class="secondary">취소 · 돌아가기</button></header><p class="layout-intro">' + (branchCatalog.find(b => b.id === draft.branch)?.name ?? '내 카페 빈 홀') + ' · ' + draft.level + '단계<br>가구를 골라 초록색 추천 자리 중 하나에 놓아요. 다른 빈 칸을 누르거나 끌어서 자유롭게 옮겨도 좋아요.</p><div class="free-summary"><strong>배치 좌석 ' + seats + ' / 보유 ' + budget + '석</strong><span>테이블 ' + draft.tables.length + '개 · 의자 ' + seats + '개</span></div><div class="layout-workspace"><div class="layout-canvas-wrap"><div class="free-selection-preview"><span>' + esc(name) + '</span>' + (item ? '<strong>' + item.x + ', ' + item.y + ' · ' + item.rotation + '°</strong>' : '') + '<small>선택 → 빈 칸 터치 / 끌어서 이동</small></div><div class="layout-board free-board ' + (valid ? 'valid' : 'invalid') + '" tabindex="0" role="group" aria-label="자유 배치 격자">' + freeHallLayers(space, save.specialization && imageReady(specializationRoom(save.specialization.selected)) ? specializationRoom(save.specialization.selected) : undefined) + freeFixed(draft.branch).map(r => '<span class="free-fixed-mark" style="left:' + r.left + '%;top:' + r.top + '%;width:' + (r.right - r.left) + '%;height:' + (r.bottom - r.top) + '%">' + r.name + '</span>').join('') + freeFurniture(space, selected) + draft.decor.map(d => '<img class="free-object free-decoration ' + (d.id === selected ? 'free-selected' : '') + '" data-object="' + d.id + '" src="assets/art/long-growth/' + d.decorId + '.svg" alt="' + esc(decorationCatalog.find(c => c.id === d.decorId).name) + '" style="left:' + d.x + '%;top:' + d.y + '%;width:' + (d.decorId === 'showcase' ? 8 : 6) + '%;z-index:' + Math.round(d.y * 10) + ';transform:translate(-50%,-100%) scaleX(' + (d.rotation === 180 ? -1 : 1) + ')">').join('') + parts.map(r => '<span class="layout-footprint ' + (valid ? 'clear' : 'blocked') + '" style="left:' + r.left + '%;top:' + r.top + '%;width:' + (r.right - r.left) + '%;height:' + (r.bottom - r.top) + '%"></span>').join('') + routes + issues.filter(i => !['capacity', 'inventory'].includes(i.id)).map(i => '<span class="layout-error-dot" style="left:' + i.x + '%;top:' + i.y + '%">!</span>').join('') + '<div class="free-placement-spots"></div><div class="free-drag-preview" hidden></div></div><p class="free-choice-status" role="status">놓을 수 있는 자리를 찾고 있어요.</p><div class="free-choice-buttons" aria-label="놓을 수 있는 자리"></div><p class="layout-legend">초록: 놓을 수 있어요 · 빨강: 수정해 주세요<br>검사는 실제 가구와 통로를 기준으로 해요.</p></div><aside class="layout-inventory"><h3>테마 가구</h3><div class="furniture-filters" aria-label="가구 분류">' + [['classic', '기본'], ['garden', '정원'], ['bakery', '베이커리'], ['dessert', '디저트']].map(([id, label]) => '<button data-theme="' + id + '" aria-pressed="' + (themeFilter === id) + '">' + label + '</button>').join('') + '</div><div class="furniture-catalog">' + furnitureCatalog.filter(d => d.theme === themeFilter).map(d => { const open = furnitureUnlocked(save.longTerm, d.id), k = tableKinds[d.kind], swap = table?.kind === d.kind, room = swap || seats + k.seats <= budget && draft.tables.length < 7; return '<article class="furniture-card ' + (open ? '' : 'locked') + '">' + freeSprite(d.row, 0, d.atlas, k.row) + '<strong>' + d.name + '</strong><small>' + k.seats + '석 · ' + ({ two: '소형', four: '중형', long: '대형' }[d.kind]) + ' · 90° 회전</small><small>' + (open ? '해금 완료 · 추가 구매비 없음' + (!room ? ' · 기존 테이블을 창고로 보내면 추가할 수 있어요.' : '') : esc(d.condition)) + '</small><button data-furnish="' + d.id + '" ' + (!open || !room ? 'disabled' : '') + '>' + (open ? swap ? '선택 테이블과 교체' : '이 가구 추가' : '아직 잠겨 있어요') + '</button></article>'; }).join('') + '</div><details><summary>기본 테이블 창고</summary><div class="free-stock">' + Object.keys(tableKinds).map(k => { const d = tableKinds[k], owned = Math.floor(budget / d.seats), placed = draft.tables.filter(t => t.kind === k).length; return '<button data-add="' + k + '" ' + (placed >= owned ? 'disabled' : '') + '>' + freeSprite(d.row, 0) + '<strong>' + d.name + ' 추가</strong><small>보유 ' + owned + ' · 배치 ' + placed + '</small></button>'; }).join('') + '</div></details><p class="hint">테이블 종류를 조합해도 보유 좌석은 늘어나지 않아요. 사용하지 않는 가구는 창고에 남아요.</p><h3>배치한 가구</h3><div class="layout-choices">' + draft.tables.map((t, i) => '<button data-select="' + t.id + '" class="secondary ' + (selected === t.id ? 'chosen' : '') + '">' + (i + 1) + '. ' + furnitureFor(t.kind, t.furnitureId).name + '</button>').join('') + '</div><h3>모은 장식</h3><button id="free-auto-decor" ' + (autoBusy ? 'disabled' : '') + '>모은 장식 자동 배치</button><div class="layout-choices">' + decorationCatalog.filter(d => save.longTerm?.owned.includes(d.id)).map(d => '<button data-decor="' + d.id + '" class="secondary ' + (selected === 'decor-' + d.id ? 'chosen' : '') + '"><img src="assets/art/long-growth/' + d.id + '.svg" alt="">' + d.name + '</button>').join('') + '</div></aside></div><section class="layout-controls"><div class="layout-actions"><button id="free-left" aria-label="왼쪽 한 칸" ' + (!item ? 'disabled' : '') + '>←</button><button id="free-right" aria-label="오른쪽 한 칸" ' + (!item ? 'disabled' : '') + '>→</button><button id="free-up" aria-label="위쪽 한 칸" ' + (!item ? 'disabled' : '') + '>↑</button><button id="free-down" aria-label="아래쪽 한 칸" ' + (!item ? 'disabled' : '') + '>↓</button><button id="free-rotate" ' + (!table ? 'disabled' : '') + '>90° 테이블 회전</button><button id="free-auto" ' + (!item ? 'disabled' : '') + '>선택 가구 자동 배치</button><button id="free-remove" ' + (!item ? 'disabled' : '') + '>선택 가구 창고로</button><button id="free-undo" ' + (!history.length ? 'disabled' : '') + '>되돌리기</button><button id="free-default">기본 배치</button><button id="free-empty">모두 창고로</button><button id="free-paths">' + (paths ? '동선 숨기기' : '동선 보기') + '</button></div><div class="free-examples"><span>배치 예시</span><button data-example="0">작은 모임</button><button data-example="1">단체 손님</button><button data-example="2">넓은 중앙홀</button></div><p class="layout-status" role="status">' + esc(message || (valid ? '모든 좌석에 손님과 직원이 갈 수 있어요.' : issues[0].message + ' (' + issues.length + '곳)')) + '</p><button id="free-confirm" class="primary" ' + (!valid || autoBusy ? 'disabled' : '') + '>배치 확정 · 저장</button><p class="hint">벽 장식은 위쪽 벽에, 화분·조명·쇼케이스는 바닥에 놓아요. 이번 배치는 현재 가게 종류·단계에 저장해요.</p></section></div>';
        const bind = (id, fn) => dialog.querySelector('#' + id).onclick = fn;
        bind('free-cancel', close);
        bind('free-default', () => edit(() => { draft = defaultFreePlan(save.cafeLevel, save.growthBranch?.active ?? null); selected = draft.tables[0].id; }));
        bind('free-empty', () => edit(() => { draft.tables = []; selected = ''; }));
        bind('free-undo', () => { if (history.length) {
            draft = history.pop();
            if (!current())
                selected = draft.tables[0]?.id ?? draft.decor[0]?.id ?? '';
            message = '';
            render();
        } });
        bind('free-rotate', () => { if (table)
            edit(() => table.rotation = ((table.rotation + 90) % 360)); });
        bind('free-remove', () => edit(() => { draft.tables = draft.tables.filter(t => t.id !== selected); draft.decor = draft.decor.filter(d => d.id !== selected); selected = draft.tables[0]?.id ?? draft.decor[0]?.id ?? ''; }));
        bind('free-paths', () => { paths = !paths; render(); });
        for (const [id, dx, dy] of [['left', -2, 0], ['right', 2, 0], ['up', 0, -2], ['down', 0, 2]])
            bind('free-' + id, () => { if (item)
                move(item.x + dx, item.y + dy); });
        dialog.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => { themeFilter = b.dataset.theme; const inventory = dialog.querySelector('.layout-inventory'); if (inventory)
            inventory.scrollTop = 0; render(); });
        dialog.querySelectorAll('[data-furnish]').forEach(b => b.onclick = () => { const f = furnitureCatalog.find(d => d.id === b.dataset.furnish); if (!furnitureUnlocked(save.longTerm, f.id))
            return; if (table?.kind === f.kind)
            edit(() => table.furnitureId = f.id);
        else
            add(f.kind, f.id); });
        bind('free-auto-decor', () => { if (autoBusy)
            return; autoBusy = true; message = '장식을 놓을 자리를 찾고 있어요.'; render(); const stamp = suggestionRevision; void autoArrangeDecor(draft, save.longTerm?.owned ?? [], () => new Promise(resolve => setTimeout(resolve, 16))).then(result => { autoBusy = false; if (!dialog.isConnected)
            return; if (stamp !== suggestionRevision) {
            message = '편집이 바뀌어 자동 배치를 취소했어요.';
            render();
            return;
        } edit(() => { draft = result.plan; selected = result.placed.length ? 'decor-' + result.placed[0] : selected; }); message = result.placed.length + '개 장식을 새로 놓았어요.' + (result.unplaced.length ? ' ' + result.unplaced.length + '개는 자리가 부족해 창고에 남았어요.' : ''); render(); }); });
        dialog.querySelectorAll('[data-add]').forEach(b => b.onclick = () => add(b.dataset.add));
        dialog.querySelectorAll('[data-select]').forEach(b => b.onclick = () => { selected = b.dataset.select; render(); });
        dialog.querySelectorAll('[data-example]').forEach(b => b.onclick = () => edit(() => { draft = freePreset(save.cafeLevel, save.growthBranch?.active ?? null, Number(b.dataset.example)); selected = draft.tables[0].id; }));
        dialog.querySelectorAll('[data-decor]').forEach(b => b.onclick = () => { const id = b.dataset.decor; selected = 'decor-' + id; if (draft.decor.some(d => d.id === selected))
            render();
        else
            edit(() => draft.decor.push({ id: selected, decorId: id, x: wallDecor(id) ? 20 : 36, y: wallDecor(id) ? 20 : 90, rotation: 0 })); });
        bind('free-confirm', () => { const latest = repo.read(); if (latest.status === 'ready' && JSON.stringify(latest.save) !== JSON.stringify(expectedSave) || !['ready', 'empty'].includes(latest.status)) {
            message = '다른 창에서 저장이 바뀌었어요. 닫고 다시 열어 주세요.';
            render();
            return;
        } const next = structuredClone(save); if (!commitFree(next, draft)) {
            message = '가구와 통로를 다시 확인해 주세요.';
            render();
            return;
        } next.updatedAt = new Date().toISOString(); const result = repo.write(next, expectedSave); if (!result.ok) {
            message = result.message;
            render();
            return;
        } close(); });
        const board = dialog.querySelector('.free-board');
        const choices = dialog.querySelector('.free-choice-buttons'), spotLayer = board.querySelector('.free-placement-spots'), choiceStatus = dialog.querySelector('.free-choice-status');
        const scan = placementCandidates(draft, selected), validChoices = [];
        const autoButton = dialog.querySelector('#free-auto');
        autoButton.disabled = true;
        autoButton.onclick = () => { const p = validChoices[0]; if (p)
            move(p.x, p.y); };
        let choiceCount = 0, checked = 0;
        const scanChunk = () => {
            if (revision !== suggestionRevision || !dialog.isConnected)
                return;
            const began = performance.now();
            let done = false;
            while (performance.now() - began < 12 && choiceCount < 16) {
                const step = scan.next();
                if (step.done) {
                    done = true;
                    break;
                }
                checked++;
                const point = step.value;
                if (!placementIsValid(draft, selected, point))
                    continue;
                choiceCount++;
                validChoices.push(point);
                autoButton.disabled = false;
                const n = choiceCount, make = (overlay) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = overlay ? String(n) : '자리 ' + n; b.className = overlay ? 'free-placement-spot' + (!table ? ' decor-choice' : '') : 'secondary'; b.setAttribute('aria-label', '추천 자리 ' + n + '에 배치'); if (overlay) {
                    b.style.left = point.x + '%';
                    b.style.top = point.y + '%';
                } b.onclick = e => { e.stopPropagation(); move(point.x, point.y); }; b.onpointerdown = e => e.stopPropagation(); return b; };
                spotLayer.append(make(true));
                choices.append(make(false));
            }
            choiceStatus.textContent = !item ? '가구를 먼저 골라 주세요.' : choiceCount ? '추천 자리 ' + choiceCount + '곳 · 통로까지 확인했어요. 다른 빈 칸에도 놓을 수 있어요.' : done ? '현재 방향으로 놓을 다른 자리가 없어요. 회전하거나 주변 가구를 옮겨 보세요.' : '놓을 수 있는 자리를 찾고 있어요.';
            if (!done && choiceCount < 16)
                setTimeout(scanChunk, 16);
        };
        if (item)
            setTimeout(scanChunk, 0);
        else
            choiceStatus.textContent = '가구를 먼저 골라 주세요.';
        let start = null;
        board.onpointerdown = e => { const target = e.target.closest('[data-object]'), id = target?.dataset.object ?? null, o = [...draft.tables, ...draft.decor].find(o => o.id === id); start = { x: e.clientX, y: e.clientY, id, ox: o?.x ?? 0, oy: o?.y ?? 0 }; board.setPointerCapture(e.pointerId); };
        board.onpointermove = e => { if (!start?.id || Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6)
            return; const r = board.getBoundingClientRect(), x = Math.round((start.ox + (e.clientX - start.x) / r.width * 100) / 2) * 2, y = Math.round((start.oy + (e.clientY - start.y) / r.height * 100) / 2) * 2, ghost = board.querySelector('.free-drag-preview'); ghost.hidden = false; ghost.style.left = Math.max(10, Math.min(88, x)) + '%'; ghost.style.top = Math.max(8, Math.min(86, y - 12)) + '%'; ghost.textContent = '미리보기 ' + x + ', ' + y; };
        board.onpointerup = e => { if (!start)
            return; const s = start; start = null; const r = board.getBoundingClientRect(); if (s.id) {
            selected = s.id;
            if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 6) {
                render();
                return;
            }
            move(s.ox + (e.clientX - s.x) / r.width * 100, s.oy + (e.clientY - s.y) / r.height * 100);
        }
        else
            move((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100); };
        board.onpointercancel = () => { start = null; board.querySelector('.free-drag-preview').hidden = true; };
        board.onkeydown = e => { const d = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key]; if (d && item) {
            e.preventDefault();
            move(item.x + d[0], item.y + d[1]);
            dialog.querySelector('.free-board').focus();
        } };
        dialog.querySelector('.layout-shell').scrollTop = scroll;
        dialog.querySelector('.layout-inventory').scrollTop = inventoryScroll;
        if (focused)
            dialog.querySelector('#' + focused)?.focus({ preventScroll: true });
    }
    dialog.onkeydown = e => { if (e.key === 'Escape')
        close(); };
    render();
    imageTimer = setInterval(() => { if (!dialog.isConnected) {
        clearInterval(imageTimer);
        return;
    } if (save.specialization && imageReady(specializationRoom(save.specialization.selected)))
        for (const layer of dialog.querySelectorAll('.free-fixed-layer,.free-floor-layer'))
            layer.style.backgroundImage = 'url(' + specializationRoom(save.specialization.selected) + ')'; const stamp = furnitureVisualVersion([...draft.tables, ...furnitureCatalog.filter(f => f.theme === themeFilter).map(f => ({ kind: f.kind, furnitureId: f.id }))]); if (stamp !== imageStamp && !autoBusy) {
        imageStamp = stamp;
        refreshFurnitureArt(dialog);
    } }, 400);
}
