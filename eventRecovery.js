import { deploymentLocalStorage } from './deploymentStorage.js';
import { classroomCafeCheckpoint, restoreClassroomCafe } from './classroomCheckpoint.js';
import { createClassMatch } from './sessionFactory.js';
import { questionCatalog } from './questionPack.js';
const key = 'cafe.v15.session-recovery';
export class EventRecovery {
    current;
    capture;
    start;
    restore;
    last = 0;
    owner = null;
    busy = false;
    lastStamp = '';
    constructor(current, capture, start, restore) {
        this.current = current;
        this.capture = capture;
        this.start = start;
        this.restore = restore;
        for (const type of ['pagehide', 'beforeunload'])
            window.addEventListener(type, () => this.save(true));
        if (!/qa|fixture|gallery/i.test(location.pathname))
            this.offer();
    }
    poll() { this.save(false); }
    save(force) { const g = this.current(); if (/qa|fixture|gallery/i.test(location.pathname) || this.busy || !g || g.mode !== 'CLASS_MATCH' || document.body.dataset.classroomActive === 'true' || !g.events.enabled)
        return; if (this.owner !== g) {
        this.owner = g;
        this.last = 0;
        this.lastStamp = '';
    } try {
        if (g.status === 'CLOSED') {
            deploymentLocalStorage.removeItem(key);
            return;
        }
        const stamp = JSON.stringify([g.stats, g.money, g.cafeLevel, g.warehouseLevel, g.menus.map(m => m.currentLevel), g.service.paid.map(w => w.level), g.events.cursor, g.events.active, g.events.records.map(r => [r.id, r.outcome, r.reward, r.giftValue])]);
        if (!force && stamp === this.lastStamp && performance.now() - this.last < 5000)
            return;
        this.last = performance.now();
        this.lastStamp = stamp;
        const captured = this.capture(), run = g.run;
        const value = { version: 1, duration: g.durationSeconds, remaining: g.remainingSeconds, savedAt: Date.now(), packId: captured.packId, run: run ? { code: run.code, concept: run.concept.id } : null, cafe: classroomCafeCheckpoint(g), learning: captured.learning };
        deploymentLocalStorage.setItem(key, JSON.stringify(value));
    }
    catch { /* Existing cafe/learning saves remain independent when local storage is unavailable. */ } }
    offer() {
        let value;
        try {
            const raw = deploymentLocalStorage.getItem(key);
            if (!raw || raw.length > 2_000_000)
                return;
            value = JSON.parse(raw);
            if (value.version !== 1 || !Number.isFinite(value.duration) || value.duration < 1 || value.duration > 3600 || !Number.isFinite(value.remaining) || value.remaining < 0 || value.remaining > value.duration || !Number.isFinite(value.savedAt) || value.savedAt > Date.now() + 60000 || typeof value.packId !== 'string')
                return;
        }
        catch {
            return;
        }
        const button = document.createElement('button');
        button.id = 'resume-v15';
        button.className = 'secondary';
        button.textContent = '이전 수업 이어하기 · 종료 시각 유지';
        document.querySelector('.welcome-note')?.append(button);
        button.onclick = async () => { if (this.busy)
            return; this.busy = true; button.disabled = true; try {
            const pack = await questionCatalog.load(value.packId);
            const g = createClassMatch(value.duration);
            if (value.run)
                g.enableRun(value.run.code, value.run.concept);
            if (!restoreClassroomCafe(g, value.cafe))
                throw Error('이전 카페 기록을 확인해 주세요.');
            g.service.manualOwner = true;
            g.enableHallGrowth();
            g.remainingSeconds = value.remaining;
            const missed = Math.max(0, (Date.now() - value.savedAt) / 1000);
            g.tick(Math.min(missed, g.remainingSeconds));
            deploymentLocalStorage.setItem(key + '.backup.' + Date.now(), JSON.stringify(value));
            this.start(g, pack.questions);
            if (!this.restore(value.learning))
                throw Error('학습 기록 복원을 확인해 주세요.');
            button.remove();
            document.dispatchEvent(new CustomEvent('v15-restored'));
        }
        catch (error) {
            button.textContent = error instanceof Error ? error.message : '재개 실패 · 기존 기록은 보존했습니다.';
        }
        finally {
            this.busy = false;
            button.disabled = false;
        } };
    }
}
