import { deploymentLocalStorage } from './deploymentStorage.js';
import { AudioManager } from './audioManager.js';
export class FeelTracker {
    guests = new Map();
    workers = new Map();
    purchases = 0;
    payments = 0;
    lastOrder = false;
    closed = false;
    start(g) { this.guests = new Map(g.guests.map(x => [x.id, x.state])); this.workers = new Map(g.service.workers.map(x => [x.staffId, x.state])); this.purchases = g.telemetry.upgradePurchases.length; this.payments = g.telemetry.phase4.payments.length; this.lastOrder = false; this.closed = false; }
    poll(g) {
        const events = [];
        for (const guest of g.guests) {
            const before = this.guests.get(guest.id);
            if (!before) {
                events.push({ type: guest.specialType === 'vip' ? 'vip' : 'enter', guest: guest.id, label: guest.specialType === 'regular' ? '단골 ♥' + guest.regularTier : undefined });
            }
            if (before !== guest.state) {
                if (guest.state === 'WAITING_FOR_FOOD')
                    events.push({ type: 'order', guest: guest.id });
                if (guest.state === 'EATING') {
                    events.push({ type: 'serve', guest: guest.id });
                    events.push({ type: 'happy', guest: guest.id, label: guest.specialType === 'hurried' && (guest.servedAt ?? Infinity) - guest.orderedAt <= g.phase4Profile.hurriedFastSeconds ? '빠른 서빙! +20%' : '♥' });
                }
                this.guests.set(guest.id, guest.state);
            }
        }
        for (const id of this.guests.keys())
            if (!g.guests.some(x => x.id === id))
                this.guests.delete(id);
        for (const w of g.service.workers) {
            if (w.state === 'PICKING_UP' && this.workers.get(w.staffId) !== w.state)
                events.push({ type: 'pickup', worker: w.staffId });
            if (w.state === 'SERVING' && this.workers.get(w.staffId) !== w.state)
                events.push({ type: 'serve', worker: w.staffId });
            this.workers.set(w.staffId, w.state);
        }
        for (const p of g.telemetry.phase4.payments.slice(this.payments))
            events.push({ type: 'coin', guest: p.guestId, amount: p.total, label: '+' + p.total.toLocaleString() + (p.type === 'spender' ? ' ✦' : '') });
        this.payments = g.telemetry.phase4.payments.length;
        for (const p of g.telemetry.upgradePurchases.slice(this.purchases)) {
            const type = { cafe: 'levelup', warehouse: 'warehouse', menu: 'menu-upgrade', 'staff-hire': 'staff-hire', 'staff-upgrade': 'staff-upgrade', item: 'purchase' }[p.kind];
            let label = type === 'warehouse' ? '재고 최대 ' + g.economy.warehouses[Math.max(0, p.level - 2)].capacity + ' → ' + g.warehouse.capacity : type === 'staff-hire' ? '새 직원이 함께합니다!' : type === 'staff-upgrade' ? 'Lv.' + p.level + '!' + ([3, 5].includes(p.level) ? ' 운반량 UP' : '') : type === 'menu-upgrade' ? '★' + p.level : undefined;
            events.push({ type, label, target: p.target });
            if (p.kind === 'item') {
                const event = { 'stock-five': 'item-stock', delivery: 'item-delivery', golden: 'item-golden', invite: 'item-invite', booster: 'item-booster' }[p.target];
                events.push({ type: event, label: { 'stock-five': '재고 배송!', delivery: '긴급배송 완료!', golden: '황금시간 시작!', invite: 'VIP 방문 예약!', booster: '생산 부스터 시작!' }[p.target] });
            }
        }
        this.purchases = g.telemetry.upgradePurchases.length;
        if (g.policy.persistence === 'none' && g.remainingSeconds <= 60 && g.remainingSeconds > 0 && !this.lastOrder) {
            this.lastOrder = true;
            events.push({ type: 'last-order', label: 'LAST ORDER' });
        }
        if (g.status === 'CLOSED' && !this.closed) {
            this.closed = true;
            events.push({ type: 'close', label: g.policy.persistence === 'none' ? '영업 종료!' : '오늘 영업이 끝났어요.' });
        }
        return events;
    }
}
export class GameFeel {
    events = [];
    tracker = new FeelTracker();
    audio;
    nodes = new Set();
    timers = new Set();
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    panelWasOpen = false;
    lastNotice = -Infinity;
    constructor() { let storage = null; try {
        storage = deploymentLocalStorage;
    }
    catch { } this.audio = new AudioManager(storage); const button = document.createElement('button'); button.id = 'sound-settings'; button.className = 'sound-settings'; button.textContent = '설정'; button.setAttribute('aria-label', '설정'); document.body.append(button); button.onclick = () => this.settings(); document.addEventListener('click', ev => { const b = ev.target?.closest('button'); if (!b || b.hasAttribute('disabled'))
        return; void this.audio.unlock().then(() => { const status = document.querySelector('#audio-status'); if (status)
        status.textContent = this.audio.unlocked ? '소리 준비됨' : '소리를 사용할 수 없어요'; return this.audio.effect('click'); }); }, true); matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', ev => { this.reduced = ev.matches; }); document.addEventListener('visibilitychange', () => { this.audio.setDucking(document.hidden); }); }
    start(g) { this.clear(); this.events.length = 0; this.panelWasOpen = false; this.tracker.start(g); void this.audio.startMusic(); }
    later(fn, ms) { const t = setTimeout(() => { this.timers.delete(t); fn(); }, ms); this.timers.add(t); }
    clear() { for (const t of this.timers)
        clearTimeout(t); this.timers.clear(); for (const n of this.nodes)
        n.remove(); this.nodes.clear(); }
    pulse(node, name = 'feel-pulse') { if (!node)
        return; node.classList.remove(name); void node.offsetWidth; node.classList.add(name); this.later(() => node.classList.remove(name), this.reduced ? 100 : 650); }
    float(label, target) { if (!label || this.nodes.size >= 12)
        return; const measured = target?.getBoundingClientRect(); const rect = measured && measured.width > 0 && measured.height > 0 ? measured : undefined; const node = document.createElement('span'); node.className = 'feel-float' + (this.reduced ? ' feel-static' : ''); node.textContent = label; node.style.left = (rect ? rect.left + rect.width / 2 : innerWidth / 2) + 'px'; node.style.top = (rect ? rect.top : Math.min(innerHeight - 80, 130)) + 'px'; document.body.append(node); this.nodes.add(node); this.later(() => { node.remove(); this.nodes.delete(node); }, this.reduced ? 900 : 1500); }
    notice(text) { const now = performance.now(); if (now - this.lastNotice < 250)
        return; this.lastNotice = now; this.float(text, document.querySelector('#item-effects')); }
    poll(g) { const problemOpen = !document.querySelector('#problem-panel')?.hasAttribute('hidden'); const panelOpen = problemOpen || !document.querySelector('#investment-panel')?.hasAttribute('hidden'); if (panelOpen && !this.panelWasOpen)
        void this.audio.effect('panel'); this.panelWasOpen = panelOpen; this.audio.setDucking(problemOpen); for (const e of this.tracker.poll(g)) {
        this.events.push(e);
        if (this.events.length > 120)
            this.events.shift();
        void this.audio.effect(e.type);
        const guest = e.guest ? document.querySelector('[data-guest-id="' + e.guest + '"]') : null, worker = e.worker ? document.querySelector('[data-worker="' + e.worker + '"]') : null;
        switch (e.type) {
            case 'order':
                this.pulse(guest?.querySelector('.guest-bubble') ?? null, 'feel-pop');
                break;
            case 'pickup':
                this.pulse(worker?.querySelector('.worker-tray') ?? null, 'feel-pop');
                break;
            case 'serve':
                this.pulse(worker ?? guest, 'feel-soft');
                break;
            case 'happy':
                this.float(e.label ?? '♥', guest);
                break;
            case 'coin':
                this.float(e.label, guest);
                this.pulse(document.querySelector('#money'));
                break;
            case 'vip':
                this.float('★ VIP 방문!', guest);
                break;
            case 'levelup':
                this.pulse(document.querySelector('#cafe-room'), 'feel-sweep');
                break;
            case 'menu-upgrade':
                this.pulse(document.querySelector('[data-menu="' + e.target + '"]')?.closest('article') ?? null);
                this.notice(e.label);
                break;
            case 'staff-upgrade':
            case 'staff-hire':
                this.float(e.label, document.querySelector('[data-worker="' + e.target + '"]') ?? document.querySelector('#workers'));
                break;
            case 'last-order':
                this.notice('LAST ORDER');
                this.pulse(document.querySelector('#timer'), 'feel-soft');
                break;
            case 'close':
                this.notice(e.label);
                this.audio.stopMusic();
                break;
            default: if (e.label)
                this.notice(e.label);
        }
    } }
    diagnostics() { return { unlocked: this.audio.unlocked, musicStarted: this.audio.musicStarted, effectsStarted: this.audio.effectsStarted, activeEffects: this.audio.activeEffects, failures: this.audio.failures, lastError: this.audio.lastError, particles: this.nodes.size, timers: this.timers.size, reducedMotion: this.reduced, preferences: this.audio.preferences, events: this.events }; }
    answer(correct, produced, quantity, menuCount = 0) { this.events.push({ type: correct ? 'correct' : 'wrong' }); if (this.events.length > 120)
        this.events.shift(); void this.audio.effect(correct ? 'correct' : 'wrong'); this.pulse(document.querySelector('#problem-panel'), correct ? 'feel-correct' : 'feel-wrong'); if (correct) {
        void this.audio.effect('production');
        this.pulse(document.querySelector('#stocks'));
        this.notice(produced > 0 ? (produced < menuCount * quantity ? '메뉴 생산 +' + quantity + ' · MAX 제외' : '모든 메뉴 +' + quantity) + (quantity === 3 ? ' · 생산 UP!' : '') : '재고 MAX');
    } }
    settings() { if (document.querySelector('#sound-panel')) {
        document.querySelector('#sound-panel').remove();
        return;
    } void this.audio.effect('panel'); const p = this.audio.preferences, box = document.createElement('section'); box.id = 'sound-panel'; box.className = 'sound-panel'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '설정'); box.innerHTML = '<h2>설정</h2><p id="audio-status" aria-live="polite">' + (this.audio.unlocked ? '소리 준비됨' : '소리 활성화 대기') + '</p><button id="sound-close" aria-label="설정 닫기">×</button><label><input id="sound-mute" type="checkbox" ' + (p.muted ? 'checked' : '') + '>전체 음소거</label><label><input id="sound-music" type="checkbox" ' + (p.musicEnabled ? 'checked' : '') + '>음악 켜기</label><label>음악 음량<input id="music-volume" type="range" min="0" max="100" value="' + Math.round(p.musicVolume * 100) + '"></label><label><input id="sound-effects" type="checkbox" ' + (p.effectsEnabled ? 'checked' : '') + '>효과음 켜기</label><label>효과음 음량<input id="effects-volume" type="range" min="0" max="100" value="' + Math.round(p.effectsVolume * 100) + '"></label>'; box.innerHTML += '<button id="settings-help" class="secondary">게임 방법</button>'; document.body.append(box); box.querySelector('#settings-help').addEventListener('click', () => { box.remove(); document.dispatchEvent(new Event('cafe-help')); }); box.querySelector('#sound-close').addEventListener('click', () => box.remove()); box.querySelectorAll('input').forEach(n => n.addEventListener('input', () => { this.audio.setPreferences({ muted: box.querySelector('#sound-mute').checked, musicEnabled: box.querySelector('#sound-music').checked, effectsEnabled: box.querySelector('#sound-effects').checked, musicVolume: Number(box.querySelector('#music-volume').value) / 100, effectsVolume: Number(box.querySelector('#effects-volume').value) / 100 }); })); }
}
