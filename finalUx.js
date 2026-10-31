import { deploymentLocalStorage } from './deploymentStorage.js';
import { TutorialPreference, TutorialTracker } from './uxState.js';
export class FinalUx {
    current;
    preference;
    tracker;
    toast;
    until = 0;
    shown = '';
    wrongShown = false;
    highlight = null;
    constructor(current, storage, key) {
        this.current = current;
        if (storage === undefined) {
            try {
                storage = deploymentLocalStorage;
            }
            catch {
                storage = null;
            }
        }
        this.preference = new TutorialPreference(storage ?? null, key);
        this.tracker = new TutorialTracker(this.preference);
        const help = document.createElement('button');
        help.id = 'game-help';
        help.className = 'game-help';
        help.textContent = '게임 방법';
        help.onclick = () => this.help();
        document.body.append(help);
        document.addEventListener('cafe-help', () => this.help());
        document.addEventListener('keydown', event => { const modal = document.querySelector('[aria-modal="true"]'); if (!modal)
            return; const nodes = [...modal.querySelectorAll('button:not(:disabled),input,select')]; if (event.key === 'Escape') {
            modal.querySelector('#help-close,#confirm-cancel')?.click();
            return;
        } if (event.key === 'Tab' && nodes.length) {
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        } });
        this.toast = document.createElement('aside');
        this.toast.id = 'first-guide';
        this.toast.className = 'first-guide';
        this.toast.hidden = true;
        this.toast.setAttribute('role', 'status');
        document.body.append(this.toast);
    }
    configure(storage, key) { this.preference = new TutorialPreference(storage, key); this.tracker = new TutorialTracker(this.preference); this.start(); }
    async beforeStart() { if (this.preference.completed)
        return; await new Promise(resolve => { const box = document.createElement('section'); box.className = 'ux-dialog'; box.id = 'ready-guide'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '첫 카페 안내'); box.innerHTML = '<div><p class="eyebrow">첫 카페에 오신 걸 환영해요</p><h2>음식 만들기로 시작해요</h2><p>문제를 맞히면 모든 음식이 생겨요.<br>서빙을 누르면 사장님이 배달해요.<br>직원을 고용하면 자동으로 서빙해요!</p><p class="hint">아직 게임 시간은 흐르지 않아요.</p><button id="guide-ready" class="primary">알겠어요 · 시작</button><button id="guide-skip" class="secondary">건너뛰고 시작</button></div>'; document.body.append(box); box.querySelector('#guide-ready').onclick = () => { box.remove(); resolve(); }; box.querySelector('#guide-skip').onclick = () => { this.preference.finish(); box.remove(); resolve(); }; box.querySelector('#guide-ready').focus(); }); }
    start() { this.hide(); this.shown = ''; this.wrongShown = false; this.tracker.start(); }
    wrong() { if (this.wrongShown)
        return false; this.wrongShown = true; return true; }
    hide() { this.toast.hidden = true; this.highlight?.classList.remove('guide-highlight'); this.highlight = null; }
    poll(game) { const shortage = game.guests.some(g => ['WAITING_FOR_FOOD', 'PREPARING'].includes(g.state) && g.order.some(o => (game.menus.find(m => m.menuId === o.menuId)?.stock ?? 0) < o.quantity)); const costs = [game.nextCafe?.expansionCost, game.nextWarehouse?.cost, game.nextHireCost, ...game.menus.map(m => game.getMenuUpgradeCost(m))].filter((x) => typeof x === 'number' && x > 0); const step = this.tracker.poll({ order: game.guests.some(g => g.order.length > 0 && !['ENTERING', 'MOVING_TO_SEAT'].includes(g.state)), shortage, pickup: game.service.workers.some(w => ['PICKING_UP', 'CARRYING_TO_TABLE', 'SERVING'].includes(w.state)), revenue: game.stats.revenue, canGrow: costs.some(c => game.money >= c), closed: game.status === 'CLOSED' }); if (!step) {
        this.hide();
        return;
    } if (step.id !== this.shown) {
        this.shown = step.id;
        this.until = performance.now() + (step.id === 'shortage' ? 7000 : 4000);
        this.toast.innerHTML = '<p></p><button class="text-button" id="guide-dismiss">알겠어요</button><button class="text-button" id="guide-skip-live">건너뛰기</button>';
        this.toast.querySelector('p').textContent = step.text;
        this.toast.querySelector('#guide-dismiss').textContent = '알겠어요';
        this.toast.querySelector('#guide-dismiss').onclick = () => { this.tracker.dismiss(); this.hide(); };
        this.toast.querySelector('#guide-skip-live').onclick = () => { this.tracker.skip(); this.hide(); };
        this.highlight?.classList.remove('guide-highlight');
        this.highlight = document.querySelector(step.target);
        this.highlight?.classList.add('guide-highlight');
        this.toast.hidden = false;
    } if (performance.now() > this.until) {
        this.tracker.dismiss();
        this.hide();
    } }
    help() { document.querySelector('#game-method')?.remove(); const box = document.createElement('section'); box.id = 'game-method'; box.className = 'ux-dialog'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '게임 방법'); box.innerHTML = '<div><button id="help-close" class="text-button" aria-label="게임 방법 닫기">닫기</button><h2>카페 사장님의 다섯 걸음</h2><ol><li>손님이 음식을 주문해요.</li><li>음식이 부족하면 <b>음식 만들기</b>를 눌러요.</li><li>정답을 맞히면 모든 음식이 생겨요.</li><li>서빙을 눌러 배달해요. 직원을 고용하면 자동 서빙!</li><li>돈으로 카페·메뉴·직원을 키워요!</li></ol><p class="hint">게임 중에는 이 창을 열어도 시간이 계속 흘러요.<br>내 카페는 이 브라우저에 저장돼요.</p><button class="secondary" id="guide-replay">첫 안내 다시 보기</button></div>'; document.body.append(box); box.querySelector('#help-close').onclick = () => { box.remove(); document.getElementById('game-help')?.focus(); }; box.querySelector('#guide-replay').onclick = () => { this.preference.reset(); if (this.current()?.status === 'RUNNING') {
        this.shown = '';
        this.tracker.start(true);
    } box.remove(); }; box.querySelector('#help-close').focus(); }
}
