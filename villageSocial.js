import { VillageLife, lifeProfiles, arrangeNameplates, separation, talkDistance } from './villageLife.js';
import { customerPoseArt, selectCustomerPose, poseGeometry } from './customerPoses.js';
import { escapeText as esc } from './questionRenderer.js';
/** Presentation controller for the existing NPCs. No economic or persistent progression mutations. */
export class VillageSocial {
    o;
    world;
    metrics = { rendered: 0, culled: 0, updateMs: 0, samples: 0, maxMs: 0 };
    explorer;
    labels;
    prompt;
    next;
    dialogueId;
    pending;
    elapsed = 0;
    renderElapsed = 0;
    labelElapsed = 0;
    sprites = new Map();
    poses = new Map();
    plateSignature = '';
    sheet;
    destroyed = false;
    constructor(o) {
        this.o = o;
        this.world = new VillageLife(o.scene, o.player());
        o.root.classList.add('village-social');
        o.root.dataset.v2bBuild = 'interaction-3';
        this.sheet = o.root.querySelector('.village-aside');
        const styleId = 'village-social-style';
        if (!document.getElementById(styleId)) {
            const s = document.createElement('link');
            s.id = styleId;
            s.rel = 'stylesheet';
            s.href = 'village-social.css?v=v2b1';
            document.head.append(s);
        }
        this.labels = document.createElement('div');
        this.labels.className = 'scene-nameplates';
        this.labels.setAttribute('aria-hidden', 'true');
        o.viewport.append(this.labels);
        this.prompt = document.createElement('button');
        this.prompt.className = 'resident-near-action';
        this.prompt.hidden = true;
        this.prompt.onclick = () => this.interact();
        o.viewport.append(this.prompt);
        for (const a of this.world.actors) {
            const node = o.map.querySelector(`[data-resident="${a.id}"],[data-lake-resident="${a.id}"]`);
            this.sprites.set(a.id, node);
            node.innerHTML = '<span class="resident-skin"></span><span class="resident-task-art" aria-hidden="true"></span>';
        }
        const close = document.createElement('button');
        close.className = 'village-sheet-close';
        close.textContent = '닫기';
        close.setAttribute('aria-label', '수첩 닫기');
        close.onclick = () => this.hideSheet();
        this.sheet.prepend(close);
        const shortcuts = o.root.querySelector('.scene-shortcuts');
        const travel = document.createElement('details');
        travel.className = 'scene-travel';
        travel.innerHTML = '<summary>목적지 안내</summary><p>장소를 고르면 길을 따라 걸어가요.</p>';
        shortcuts.before(travel);
        travel.append(shortcuts);
        shortcuts.addEventListener('click', () => { travel.open = false; });
        o.root.querySelector('.village-sub').textContent = '길을 터치해 걷고, 가까운 이웃에게 말을 걸어 보세요.';
        document.addEventListener('keydown', this.key);
        this.render(true);
    }
    attach(explorer) { this.explorer = explorer; this.render(true); }
    pick(p) { return this.world.actors.slice().sort((a, b) => b.y - a.y).find(a => Math.abs(p.x - a.x) <= 28 && p.y >= a.y - 85 && p.y <= a.y + 6)?.id; }
    get talking() { return !!this.dialogueId; }
    approach(id) { if (this.talking)
        return; this.cancel(); this.hideSheet(); const p = this.world.approach(id, this.o.player()); if (p) {
        this.pending = id;
        return p;
    } this.o.message('이웃 옆의 길로 조금 더 가까이 와 주세요.'); }
    cancel() { if (this.pending && !this.dialogueId)
        this.world.release(this.pending); this.pending = undefined; }
    begin(id) { const a = this.world.actor(id); if (!a || separation(a, this.o.player()) > talkDistance)
        return false; this.explorer?.stop(); this.world.reserve(id); this.world.face(id, this.o.player()); this.explorer?.face(a.x < this.o.player().x ? 'left' : 'right'); this.dialogueId = id; this.pending = undefined; this.hideSheet(); this.prompt.hidden = true; this.render(true); return true; }
    end() { if (this.dialogueId)
        this.world.release(this.dialogueId); this.dialogueId = undefined; this.pending = undefined; this.render(true); }
    ready(id) { const a = this.world.actor(id); return !!a && separation(a, this.o.player()) <= talkDistance; }
    showSheet() { this.explorer?.stop(); this.cancel(); this.o.root.classList.add('village-sheet-open'); this.sheet.querySelector('.village-sheet-close')?.focus({ preventScroll: true }); }
    hideSheet() { this.o.root.classList.remove('village-sheet-open'); }
    key = (e) => { if (e.target.closest('input,select,textarea') || e.ctrlKey || e.metaKey || this.talking)
        return; if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (!e.repeat)
            this.interact();
    } if (e.key === 'Escape')
        this.hideSheet(); };
    interact() { if (this.talking)
        return; if (this.next) {
        this.explorer?.stop();
        this.o.talk(this.next);
    }
    else {
        const near = this.nearestBuilding();
        near?.click();
    } }
    nearestBuilding() { const p = this.o.player(); return this.o.scene.buildings.map(b => ({ b, d: Math.hypot(b.door.x - p.x, b.door.y - p.y) })).filter(x => x.d < 105).sort((a, b) => a.d - b.d).map(x => this.o.map.querySelector(`[data-building="${x.b.id}"]`))[0]; }
    tick(dt) { if (this.destroyed)
        return; this.elapsed += dt; this.renderElapsed += dt; this.labelElapsed += dt; if (this.elapsed < .05)
        return; const start = performance.now(), step = this.elapsed; this.elapsed = 0; this.world.tick(step, this.o.player(), this.explorer?.intent, a => this.explorer?.visible(a) ?? true); this.render(); if (this.pending && !this.talking && this.ready(this.pending)) {
        const id = this.pending;
        this.o.talk(id);
    } const cost = performance.now() - start; this.metrics.updateMs += cost; this.metrics.samples++; this.metrics.maxMs = Math.max(this.metrics.maxMs, cost); if (this.metrics.samples % 20 === 0) {
        this.o.map.dataset.lifeMetrics = JSON.stringify({ ...this.metrics, ...this.world.metrics, averageMs: this.metrics.updateMs / this.metrics.samples });
    } }
    render(force = false) {
        if (!this.explorer && !force)
            return;
        const p = this.o.player();
        this.next = this.world.nearest(p)?.id;
        for (const a of this.world.actors) {
            const el = this.sprites.get(a.id);
            const visible = this.explorer?.visible(a) ?? true;
            el.hidden = !visible;
            el.setAttribute('aria-hidden', visible ? 'false' : 'true');
            if (!visible) {
                this.metrics.culled++;
                continue;
            }
            this.metrics.rendered++;
            el.style.left = a.x + 'px';
            el.style.top = a.y + 'px';
            el.style.zIndex = String(Math.floor(a.y));
            el.dataset.lifeState = a.state;
            el.dataset.reserved = String(a.reserved);
            el.dataset.residentName = a.name;
            el.classList.toggle('resident-walking', a.state === 'walk' && a.route.length > 0);
            el.classList.toggle('resident-selected', a.id === this.dialogueId || a.id === this.next);
            const gesture = a.state === 'work' || a.state === 'greet', phase = Math.floor(a.phase * 2) % 2, s = selectCustomerPose(a.visual, 'ENTERING', a.facing, gesture ? 'WAVE' : '', phase), key = s.key + '/' + a.state;
            if (this.poses.get(a.id) !== key) {
                this.poses.set(a.id, key);
                const skin = el.querySelector('.resident-skin'), geometry = poseGeometry(s);
                skin.innerHTML = customerPoseArt(s);
                const image = skin.firstElementChild;
                const height = 80, width = height * geometry.ratio;
                image.style.width = width + 'px';
                image.style.height = height + 'px';
                image.style.position = 'absolute';
                image.style.left = (26 - width * geometry.anchorX / 100) + 'px';
                image.style.top = (85 - height * geometry.anchorY / 100) + 'px';
                el.setAttribute('aria-label', `${a.name} · ${lifeProfiles[a.id].role} · ${a.state === 'walk' ? '산책 중' : a.state === 'work' ? lifeProfiles[a.id].work : a.state === 'rest' ? lifeProfiles[a.id].rest : '이야기하기'}`);
                el.querySelector('.resident-task-art').innerHTML = a.state === 'work' ? workTool(lifeProfiles[a.id].tool) : '';
            }
        }
        if (this.labelElapsed > .1 || force) {
            this.labelElapsed = 0;
            this.paintLabels();
            const a = this.next && this.world.actor(this.next), building = !a && this.nearestBuilding();
            this.prompt.hidden = this.talking || (!a && !building);
            this.prompt.textContent = a ? `${a.name} · 대화${this.o.viewport.clientWidth > 600 ? ' · E' : ''}` : building ? '들어가기 · ' + (building.querySelector('b')?.textContent ?? '시설') : '';
            this.prompt.setAttribute('aria-label', a ? a.name + ' 대화하기' : '가까운 시설 이용');
            const closeToResident = (x, y) => this.world.actors.some(a => Math.hypot(a.x - x, a.y - y) < 140);
            for (const b of this.o.scene.buildings)
                this.o.map.querySelector(`[data-building="${b.id}"]`)?.classList.toggle('place-visible', separation(b.door, p) < 150 && !closeToResident(b.door.x, b.door.y));
            let n = 0;
            for (const node of this.o.map.querySelectorAll('.scene-prop')) {
                const x = parseFloat(node.style.left), y = parseFloat(node.style.top);
                node.classList.toggle('environment-active', n < 9 && (this.explorer?.visible({ x, y }, 40) ?? false));
                if (node.classList.contains('environment-active'))
                    n++;
            }
        }
    }
    paintLabels() { const e = this.explorer; if (!e)
        return; const view = e.projection, p = this.o.player(), near = this.world.actors.filter(a => separation(a, p) < 175 && e.visible(a, 0)).sort((a, b) => separation(a, p) - separation(b, p)).slice(0, view.width < 500 ? 2 : 3), items = near.map((a, i) => { const q = e.project(a); return { id: a.id, x: q.x, y: q.y - 90 * q.scale - 22, width: Math.max(48, a.name.length * 15 + 18), height: 25, priority: 10 - i }; }); if (near.length) {
        const q = e.project(p);
        items.push({ id: 'player', x: q.x, y: q.y - 86 * q.scale - 26, width: 63, height: 25, priority: 20 });
    } const placed = arrangeNameplates(items, view.width, view.height), signature = JSON.stringify(placed.map(a => [a.id, Math.round(a.left), Math.round(a.top)])); if (signature === this.plateSignature)
        return; this.plateSignature = signature; this.labels.innerHTML = placed.map(a => `<span class="scene-nameplate ${a.id === 'player' ? 'player-nameplate' : ''}" style="left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px">${a.id === 'player' ? '사장님' : esc(this.world.actor(a.id).name)}</span>`).join(''); }
    destroy() { this.destroyed = true; document.removeEventListener('keydown', this.key); this.labels.remove(); this.prompt.remove(); this.world.release(); }
}
/** Original SVG tool accents; character faces/outfits come from the existing bitmap bank. */
function workTool(tool) { const shapes = { flower: '<path d="M6 18h15v10H6zM21 20l10-6 2 3-11 8M9 17q3-9 9 0"/><path d="M33 21l2 2m-5 2 2 2"/>', basket: '<path d="M5 18h30l-5 13H10zM10 18q10-20 20 0M11 24h18"/>', grain: '<path d="M10 7h18l-3 7 5 20H8l5-20zM19 18v12M14 21l5 4 5-4"/>', hammer: '<path d="m10 7 12 4-3 8-12-4zM17 18l-5 16M27 31h9"/>', flag: '<path d="M9 35V5l23 4-8 8 8 6-23-4"/>', map: '<path d="m5 10 10-4 10 5 10-4v25l-10 3-10-5-10 4zM15 7v22M25 12v22"/>', camera: '<path d="M5 14h30v19H5zM12 14l3-6h12l3 6"/><circle cx="21" cy="23" r="6"/><path d="M35 5v7m-4-3h8"/>' }; return '<svg viewBox="0 0 42 42" fill="#e7c98a" stroke="#725638" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + shapes[tool] + '</svg>'; }
