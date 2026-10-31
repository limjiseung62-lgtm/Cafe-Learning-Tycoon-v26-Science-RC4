export const tutorialKey = 'cafe-learning-tycoon.tutorial.v1';
export class TutorialPreference {
    storage;
    key;
    complete = false;
    constructor(storage, key = tutorialKey) {
        this.storage = storage;
        this.key = key;
        try {
            this.complete = JSON.parse(storage?.getItem(key) ?? 'null')?.completed === true;
        }
        catch { }
    }
    get completed() { return this.complete; }
    finish() { this.complete = true; try {
        this.storage?.setItem(this.key, JSON.stringify({ version: 1, completed: true }));
    }
    catch { } }
    reset() { this.complete = false; try {
        this.storage?.setItem(this.key, JSON.stringify({ version: 1, completed: false }));
    }
    catch { } }
}
export const tutorialSteps = [{ id: 'order', text: '손님이 주문했어요!', target: '.guest-bubble' }, { id: 'shortage', text: '음식이 부족해요! 음식 만들기를 누르고 문제를 맞히면 음식이 생겨요.', target: '#make' }, { id: 'pickup', text: '음식을 손님에게 가져다줘요!', target: '#workers' }, { id: 'money', text: '음식을 팔아 돈을 벌었어요!', target: '#money' }, { id: 'growth', text: '돈으로 카페를 키울 수 있어요.', target: '#invest' }];
export class TutorialTracker {
    preference;
    seen = new Set();
    queue = [];
    active = null;
    enabled = false;
    constructor(preference) {
        this.preference = preference;
    }
    start(replay = false) { this.seen.clear(); this.queue = []; this.active = null; this.enabled = replay || !this.preference.completed; }
    poll(s) { if (!this.enabled)
        return null; if (s.closed) {
        this.skip();
        return null;
    } const conditions = [s.order, s.shortage, s.pickup, s.revenue > 0, s.canGrow]; tutorialSteps.forEach((step, i) => { if (conditions[i] && !this.seen.has(step.id)) {
        this.seen.add(step.id);
        this.queue.push(step);
    } }); if (!this.active)
        this.active = this.queue.shift() ?? null; return this.active; }
    dismiss() { this.active = null; if (this.seen.has('growth') && !this.queue.length) {
        this.preference.finish();
        this.enabled = false;
    } }
    skip() { this.preference.finish(); this.enabled = false; this.active = null; this.queue = []; }
}
export class SessionClock {
    wall = 0;
    mono = 0;
    started = false;
    consumed = 0;
    start(wall = Date.now(), mono = performance.now()) { this.wall = wall; this.mono = mono; this.consumed = 0; this.started = true; }
    take(wall = Date.now(), mono = performance.now()) { if (!this.started)
        return 0; const total = Math.max(this.consumed, (wall - this.wall) / 1000, (mono - this.mono) / 1000), elapsed = total - this.consumed; this.consumed = total; return elapsed; }
}
export class ActionGate {
    now;
    until = 0;
    constructor(now = () => performance.now()) {
        this.now = now;
    }
    run(action, delay = 400) { if (this.now() < this.until)
        return false; this.until = this.now() + delay; action(); return true; }
    get blocked() { return this.now() < this.until; }
}
