import { traits, runBalance } from './cafeRun.js';
import { escapeText } from './questionRenderer.js';
export class CafeRunUi {
    current;
    panel;
    bar;
    open = false;
    key = '';
    round = -1;
    constructor(current) {
        this.current = current;
        this.bar = document.createElement('section');
        this.bar.id = 'run-status';
        this.bar.hidden = true;
        document.querySelector('.hud').after(this.bar);
        this.panel = document.createElement('section');
        this.panel.id = 'run-choices';
        this.panel.hidden = true;
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-label', '카페 특성 선택');
        this.panel.setAttribute('aria-modal', 'true');
        document.body.append(this.panel);
    }
    start() { this.open = false; this.key = ''; this.round = -1; this.panel.hidden = true; this.bar.hidden = true; document.getElementById('playing').inert = false; }
    poll() {
        const g = this.current(), run = g?.run;
        if (!g || !run || g.status !== 'RUNNING') {
            this.panel.hidden = true;
            this.bar.hidden = true;
            document.getElementById('playing').inert = false;
            return;
        }
        const pending = run.pending(g.elapsedTime, g.durationSeconds), final = g.elapsedTime / g.durationSeconds >= runBalance.finalStart;
        const key = [run.selected.join(), pending, final, run.finalPaid, run.finalAssigned, this.open].join('/');
        if (this.key !== key) {
            this.key = key;
            this.bar.hidden = false;
            this.bar.innerHTML = '<div><strong>' + run.concept.name + '</strong><span>특성 ' + run.selected.length + '/4 · 코드 ' + escapeText(run.code) + '</span></div><button class="secondary" id="run-open">' + (pending ? '새 특성 고르기 →' : '내 카페 조합 보기') + '</button><p>' + (final ? '감사 파티 주문 ' + run.finalPaid + '/3 완료 · ' + (run.finalRewarded ? '파티 성공! 보너스 400원' : '파티 표시 손님 3명의 3접시 주문을 영업 종료 전까지 서빙해요. 성공 보너스 400원') : run.selected.length ? run.selected.map(id => traits.find(t => t.id === id).name).join(' · ') : '영업이 진행되면 세 가지 중 하나를 골라요.') + '</p>';
            document.getElementById('run-open').onclick = () => { this.open = true; this.render(); };
        }
        // Do not cover a problem, an upgrade, or an answer explanation. A pending choice remains available.
        if (pending && this.round !== run.selected.length && !this.blocked()) {
            this.round = run.selected.length;
            this.open = true;
            this.render();
        }
        if (this.open && this.blocked()) {
            this.open = false;
            this.panel.hidden = true;
            document.getElementById('playing').inert = false;
        }
    }
    blocked() { return ['problem-panel', 'investment-panel', 'mode-confirm'].some(id => { const n = document.getElementById(id); return n && !n.hidden; }); }
    render() {
        const g = this.current(), run = g?.run;
        if (!g || !run || g.status !== 'RUNNING')
            return;
        const pending = run.pending(g.elapsedTime, g.durationSeconds);
        this.panel.hidden = false;
        document.getElementById('playing').inert = true;
        this.panel.innerHTML = '<div class="run-sheet"><header><div><p class="eyebrow">TODAY’S CAFE</p><h2>' + (pending ? '오늘의 카페 선택' : '나만의 카페 조합') + '</h2></div><button id="run-close" class="secondary">← 카페로</button></header><p>' + run.concept.description + '</p>' + (pending ? '<p class="hint">선택 ' + (run.selected.length + 1) + '/4 · 이번 영업에만 적용돼요. 시간은 계속 흘러요.</p><div class="run-card-grid">' + run.choices[run.selected.length].map(id => { const t = traits.find(t => t.id === id); return '<button class="run-card" data-trait="' + id + '"><span>카페 특성</span><strong>' + t.name + '</strong><p>' + t.description + '</p><b>이 특성 선택 →</b></button>'; }).join('') + '</div>' : '<p>다음 선택은 영업 ' + Math.round((runBalance.rounds[run.selected.length] ?? 1) * 100) + '% 시점에 열려요.</p>') + '<h3>지금까지 선택한 특성</h3><div class="run-picked">' + (run.selected.map(id => { const t = traits.find(t => t.id === id); return '<p><strong>' + t.name + '</strong> · ' + t.description + '</p>'; }).join('') || '<p>첫 선택을 기다리고 있어요.</p>') + '</div><p class="hint">일반 주문 보너스 합계는 최대 25%, 주문당 250원이에요. 문제 정답 생산량은 그대로예요.</p><button id="run-later" class="primary">' + (pending ? '나중에 선택하고 카페로' : '카페로 돌아가기') + '</button></div>';
        const close = () => { this.open = false; this.panel.hidden = true; document.getElementById('playing').inert = false; document.getElementById('run-open')?.focus({ preventScroll: true }); };
        document.getElementById('run-close').onclick = close;
        document.getElementById('run-later').onclick = close;
        this.panel.querySelectorAll('[data-trait]').forEach(b => b.onclick = () => { if (run.choose(b.dataset.trait, g.elapsedTime, g.durationSeconds)) {
            close();
            this.key = '';
            this.poll();
        } });
        this.panel.onkeydown = e => { if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
        else if (e.key === 'Tab') {
            const buttons = Array.from(this.panel.querySelectorAll('button')), first = buttons[0], last = buttons.at(-1);
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        } };
        document.getElementById('run-close').focus({ preventScroll: true });
    }
    result(g) {
        if (!g.run)
            return;
        const r = g.run.report(), box = document.createElement('section');
        box.className = 'run-result';
        box.innerHTML = '<h3>' + r.concept + ' · 오늘의 조합</h3><p>' + r.traits.join(' · ') + '</p><div class="result-grid"><div>운영 만족도<strong>' + Math.round(g.stats.servedCustomers / Math.max(1, g.stats.servedCustomers + g.customersLeft) * 100) + '%</strong></div><div>파티 주문<strong>' + r.finalPaid + '/3</strong></div><div>특성·파티 추가 매출<strong>' + r.bonusRevenue.toLocaleString() + '원</strong></div></div><p>수업 코드 ' + escapeText(r.code) + ' · ' + (r.finalRewarded ? '감사 파티 성공!' : '다음에는 감사 파티에도 도전해요.') + '</p><p class="hint">매출과 만족도는 운영 결과예요. 학습 성취도는 정답률을 함께 확인해 주세요.</p>';
        document.getElementById('restart').before(box);
    }
}
