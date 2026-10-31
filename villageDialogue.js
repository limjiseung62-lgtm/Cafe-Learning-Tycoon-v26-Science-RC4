import { customerPoseArt, selectCustomerPose } from './customerPoses.js';
import { escapeText as esc } from './questionRenderer.js';
/** Compact RPG conversation. Numeric objectives only appear after opening a quest. */
export class VillageDialogue {
    root;
    element;
    data;
    line = 0;
    view = 'talk';
    selected = '';
    previousFocus;
    constructor(root) {
        this.root = root;
    }
    get active() { return !!this.element; }
    show(data) { const fresh = !this.element; this.data = data; this.line = 0; this.view = 'talk'; this.selected = ''; if (fresh) {
        this.previousFocus = document.activeElement;
        this.element = document.createElement('section');
        this.element.className = 'resident-dialogue';
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('aria-label', data.name + ' 대화');
        this.root.append(this.element);
        document.addEventListener('keydown', this.key);
    } this.paint(); this.element.querySelector('.resident-close').focus({ preventScroll: true }); }
    key = (e) => { if (!this.element)
        return; if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.close();
    } if (e.key === 'Tab') {
        const buttons = [...this.element.querySelectorAll('button:not(:disabled)')].filter(b => !b.hidden), i = buttons.indexOf(document.activeElement), next = e.shiftKey ? (i <= 0 ? buttons.length - 1 : i - 1) : (i + 1) % buttons.length;
        e.preventDefault();
        buttons[next]?.focus();
    } };
    paint() {
        const d = this.data, el = this.element;
        const portrait = customerPoseArt(selectCustomerPose(d.visual, 'ENTERING', 'right'));
        el.innerHTML = `<header><div class="resident-portrait" aria-hidden="true">${portrait}</div><div><h2>${esc(d.name)}</h2><p class="resident-role">${esc(d.role)}</p></div><button class="resident-close" aria-label="대화 닫기">×</button></header><div class="resident-dialog-content"></div><footer></footer>`;
        const body = el.querySelector('.resident-dialog-content'), foot = el.querySelector('footer');
        if (this.view === 'talk') {
            body.innerHTML = `<p class="resident-speech">${esc(d.lines[this.line] ?? d.lines[0])}</p>`;
            foot.innerHTML = `<button data-next>${this.line < d.lines.length - 1 ? '이야기 계속' : '한 번 더 듣기'}</button><button data-quests class="primary">의뢰 확인${d.quests.some(q => q.status === 'ready') ? ' · 완료 가능' : ''}</button>`;
            foot.querySelector('[data-next]').addEventListener('click', () => { this.line = (this.line + 1) % d.lines.length; this.paint(); });
        }
        else if (this.view === 'quests') {
            body.innerHTML = '<h3>어떤 의뢰를 살펴볼까요?</h3><div class="resident-quest-list">' + d.quests.map(q => `<button data-quest="${esc(q.id)}"><b>${esc(q.name)}</b><span>${({ available: '도움이 필요해요', active: '진행 중', ready: '완료 보고 가능', complete: '해결 완료' })[q.status]}</span></button>`).join('') + '</div>';
            foot.innerHTML = '<button data-talk>대화로 돌아가기</button><button data-study>공부하러 카페로</button>';
            body.querySelectorAll('[data-quest]').forEach(b => b.onclick = () => { this.selected = b.dataset.quest; this.view = 'detail'; this.paint(); });
        }
        else {
            const q = d.quests.find(q => q.id === this.selected);
            body.innerHTML = `<h3>${esc(q.name)}</h3><p>${esc(q.story)}</p><p class="resident-objectives">${esc(q.progress)}</p><p class="resident-reward">보상 · ${esc(q.reward)}</p>${q.note ? '<small>' + esc(q.note) + '</small>' : ''}`;
            foot.innerHTML = `<button data-quests>다른 의뢰</button><button data-action class="primary" ${q.status === 'active' || q.status === 'complete' ? 'disabled' : ''}>${esc(q.action)}</button>`;
            foot.querySelector('[data-action]').addEventListener('click', () => { const b = foot.querySelector('[data-action]'); b.disabled = true; d.onAction(q.id); });
        }
        el.querySelector('.resident-close').addEventListener('click', () => this.close());
        foot.querySelector('[data-quests]')?.addEventListener('click', () => { this.view = 'quests'; this.paint(); });
        foot.querySelector('[data-talk]')?.addEventListener('click', () => { this.view = 'talk'; this.paint(); });
        foot.querySelector('[data-study]')?.addEventListener('click', () => { this.destroy(); d.onStudy(); });
    }
    close() { const d = this.data; this.destroy(); d?.onClose(); this.previousFocus?.isConnected && this.previousFocus.focus({ preventScroll: true }); }
    destroy() { this.element?.remove(); this.element = undefined; document.removeEventListener('keydown', this.key); }
}
