import { scenePath, sceneWalkable, sceneCamera, sceneSegmentOpen } from './villageNavigation.js';
export class VillageExplorer {
    o;
    position;
    route = [];
    frame = 0;
    previous = performance.now();
    lastCheckpoint = 0;
    camera = { x: 0, y: 0 };
    overview = false;
    held = null;
    resize;
    destroyed = false;
    player;
    marker;
    cameraReady = false;
    blocked = false;
    facing = 'right';
    view = { width: 0, height: 0 };
    timings = [];
    constructor(o) {
        this.o = o;
        this.position = { ...o.position };
        this.player = o.map.querySelector('.scene-player');
        this.marker = o.map.querySelector('.scene-destination');
        o.map.classList.add('scene-map');
        o.map.dataset.scene = o.scene.id;
        o.viewport.classList.add('scene-viewport');
        o.viewport.style.position = 'relative';
        o.viewport.style.overflow = 'clip';
        o.viewport.scrollTop = 0;
        o.viewport.scrollLeft = 0;
        this.resize = new ResizeObserver(() => { this.view = { width: o.viewport.clientWidth, height: o.viewport.clientHeight }; this.paint(true); });
        this.resize.observe(o.viewport);
        document.addEventListener('keydown', this.keydown);
        document.addEventListener('keyup', this.keyup);
        document.addEventListener('visibilitychange', this.visibility);
        window.addEventListener('pagehide', this.checkpoint);
        window.addEventListener('blur', this.blur);
        window.addEventListener('pointerup', this.release);
        window.addEventListener('pointercancel', this.release);
        o.controls.querySelectorAll('[data-village-dir],[data-lake-dir]').forEach(b => { b.addEventListener('pointerdown', e => { e.preventDefault(); if (this.o.canMove?.() === false)
            return; this.o.onManual?.(); this.held = b.dataset.villageDir ?? b.dataset.lakeDir; this.step(this.held); }); b.addEventListener('click', e => { if (e.detail === 0) {
            this.o.onManual?.();
            this.step(b.dataset.villageDir ?? b.dataset.lakeDir);
        } }); });
        this.view = { width: o.viewport.clientWidth, height: o.viewport.clientHeight };
        this.paint(true);
        this.frame = requestAnimationFrame(this.tick);
    }
    get moving() { return this.route.length > 0 && !this.blocked; }
    get point() { return { ...this.position }; }
    get intent() { return this.route[0]; }
    get projection() { const c = sceneCamera(this.view, this.position, this.overview); return { ...this.camera, scale: c.scale, width: this.view.width, height: this.view.height }; }
    project(p) { const c = this.projection; return { x: c.x + p.x * c.scale, y: c.y + p.y * c.scale, scale: c.scale }; }
    visible(p, padding = 150) { const q = this.project(p); return q.x >= -padding && q.x <= this.view.width + padding && q.y >= -padding && q.y <= this.view.height + padding; }
    face(direction) { this.facing = direction; this.player.style.setProperty('--face', direction === 'left' ? '-1' : '1'); }
    stop() { this.route = []; this.held = null; this.blocked = false; this.marker.hidden = true; this.player.classList.remove('walking'); }
    setPosition(p) { if (sceneWalkable(this.o.scene, p)) {
        this.position = { ...p };
        this.paint(false);
    } }
    target(p) { if (this.o.canMove?.() === false)
        return false; this.held = null; const route = scenePath(this.o.scene, this.position, p); if (!route.length) {
        this.stop();
        this.o.onReject();
        return false;
    } this.route = route; this.marker.hidden = false; this.marker.style.left = p.x + 'px'; this.marker.style.top = p.y + 'px'; return true; }
    toggleOverview() { this.overview = !this.overview; this.paint(true); return this.overview; }
    clickPoint(e) { const r = this.o.map.getBoundingClientRect(), scale = r.width / 1600; return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; }
    step(dir) { if (this.o.canMove?.() === false)
        return; const d = { up: [0, -20], down: [0, 20], left: [-20, 0], right: [20, 0] }[dir]; if (!d)
        return; const to = { x: this.position.x + d[0], y: this.position.y + d[1] }; if (sceneSegmentOpen(this.o.scene, this.position, to)) {
        this.route = [to];
        this.marker.hidden = true;
    }
    else {
        this.route = [];
        this.o.onReject();
    } }
    release = () => { this.held = null; };
    blur = () => { this.held = null; this.o.onCheckpoint(); };
    checkpoint = () => this.o.onCheckpoint();
    visibility = () => { this.held = null; this.previous = performance.now(); this.o.onCheckpoint(); };
    keydown = (e) => { if (e.ctrlKey || e.metaKey || e.target.closest('input,select,textarea') || this.o.canMove?.() === false)
        return; const dir = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }[e.key]; if (dir) {
        e.preventDefault();
        if (this.held !== dir) {
            this.o.onManual?.();
            this.held = dir;
            this.step(dir);
        }
    } };
    keyup = (e) => { if (/^(Arrow|[wasdWASD]$)/.test(e.key))
        this.held = null; };
    tick = (now) => {
        if (this.destroyed)
            return;
        const dt = Math.min(.05, Math.max(0, (now - this.previous) / 1000));
        if (!document.hidden) {
            if (this.timings.length < 2400)
                this.timings.push(now - this.previous);
            this.o.onFrame?.(dt);
            this.blocked = false;
            if (this.o.canMove?.() !== false && this.route.length) {
                let left = dt * 180;
                while (left > 0 && this.route.length) {
                    while (this.route.length > 1 && Math.hypot(this.route[0].x - this.position.x, this.route[0].y - this.position.y) < 65 && this.o.crowded?.(this.route[0]) && sceneSegmentOpen(this.o.scene, this.position, this.route[1]))
                        this.route.shift();
                    if (this.route.length === 1 && this.o.crowded?.(this.route[0]) && Math.hypot(this.route[0].x - this.position.x, this.route[0].y - this.position.y) < 50) {
                        this.route = [];
                        break;
                    }
                    const next = this.route[0], dx = next.x - this.position.x, dy = next.y - this.position.y, d = Math.hypot(dx, dy), step = Math.min(d, left), to = { x: this.position.x + dx / (d || 1) * step, y: this.position.y + dy / (d || 1) * step };
                    const resolved = this.o.canEnter?.(this.position, to) === false ? this.o.resolveStep?.(this.position, to) : to;
                    if (!resolved) {
                        this.blocked = true;
                        break;
                    }
                    if (Math.abs(dx) > .1)
                        this.face(dx < 0 ? 'left' : 'right');
                    this.position = resolved;
                    left -= step;
                    if (Math.hypot(resolved.x - next.x, resolved.y - next.y) < .01)
                        this.route.shift();
                }
                this.o.onPosition(this.point);
                if (!this.route.length) {
                    this.marker.hidden = true;
                    if (this.held)
                        this.step(this.held);
                    else
                        this.o.onArrive();
                }
                if (now - this.lastCheckpoint > 1200) {
                    this.lastCheckpoint = now;
                    this.o.onCheckpoint();
                }
            }
            this.paint(false, dt);
        }
        this.previous = now;
        this.frame = requestAnimationFrame(this.tick);
    };
    paint(immediate = false, dt = .016) { if (this.o.viewport.scrollTop)
        this.o.viewport.scrollTop = 0; if (this.o.viewport.scrollLeft)
        this.o.viewport.scrollLeft = 0; const desired = sceneCamera(this.view, this.position, this.overview), factor = immediate || !this.cameraReady ? 1 : 1 - Math.exp(-dt / .10); this.camera.x += (desired.x - this.camera.x) * factor; this.camera.y += (desired.y - this.camera.y) * factor; this.cameraReady = true; const transform = `translate3d(${this.camera.x}px,${this.camera.y}px,0) scale(${desired.scale})`; if (this.o.map.style.transform !== transform)
        this.o.map.style.transform = transform; this.player.style.left = this.position.x + 'px'; this.player.style.top = this.position.y + 'px'; this.player.style.zIndex = String(Math.floor(this.position.y)); this.player.classList.toggle('walking', this.moving); }
    destroy() { if (this.destroyed)
        return; this.o.onCheckpoint(); this.destroyed = true; cancelAnimationFrame(this.frame); this.resize.disconnect(); document.removeEventListener('keydown', this.keydown); document.removeEventListener('keyup', this.keyup); document.removeEventListener('visibilitychange', this.visibility); window.removeEventListener('pagehide', this.checkpoint); window.removeEventListener('blur', this.blur); window.removeEventListener('pointerup', this.release); window.removeEventListener('pointercancel', this.release); }
}
