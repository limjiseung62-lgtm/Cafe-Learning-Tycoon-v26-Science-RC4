import { growthAlbum, growthMilestones, growthPhase, constructionDuration, townAtStage, growthStage } from './villageGrowthVisual.js';
import { sceneEnvironment, replaceSceneEnvironment } from './villageSceneArt.js';
import { customerPoseArt, selectCustomerPose } from './customerPoses.js';
/** Purely visual milestone presentation; the only write is an existing seenStage acknowledgement. */
export class VillageGrowthUi {
    o;
    busy = false;
    panel;
    timer;
    resize;
    focus;
    phase = '';
    destroyed = false;
    constructor(o) {
        this.o = o;
        if (!document.getElementById('village-growth-style')) {
            const css = document.createElement('link');
            css.id = 'village-growth-style';
            css.rel = 'stylesheet';
            css.href = 'village-growth.css?v=v2c1';
            document.head.append(css);
        }
        if (o.seen < o.stage)
            queueMicrotask(() => { if (!this.destroyed)
                this.construction(); });
    }
    begin(label) { this.close(); this.focus = document.activeElement; this.busy = true; this.o.onFreeze(true); this.o.root.classList.add('village-growth-busy'); const p = document.createElement('section'); p.className = 'growth-modal'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', label); this.o.root.append(p); this.panel = p; document.addEventListener('keydown', this.keys); return p; }
    keys = (e) => { if (!this.panel)
        return; if (e.key === 'Escape') {
        e.preventDefault();
        if (this.panel.dataset.construction)
            this.finish();
        else
            this.close();
    } if (e.key === 'Tab') {
        const list = [...this.panel.querySelectorAll('button:not(:disabled),select')];
        if (!list.length)
            return;
        const at = list.indexOf(document.activeElement), i = (at + (e.shiftKey ? -1 : 1) + list.length) % list.length;
        e.preventDefault();
        list[i].focus({ preventScroll: true });
    } };
    thumbs() { this.resize?.disconnect(); this.resize = new ResizeObserver(entries => { for (const e of entries)
        e.target.style.setProperty('--preview-scale', String(e.contentRect.width / 1600)); }); for (const e of this.panel?.querySelectorAll('.growth-thumbnail') ?? [])
        this.resize.observe(e); }
    preview(stage) { return `<div class="growth-thumbnail" aria-hidden="true"><div class="growth-thumbnail-world scene-map">${sceneEnvironment(townAtStage(stage)).replace(/<button\b/g, '<span').replace(/<\/button>/g, '</span>')}</div><span class="growth-preview-stage">${stage}단계</span></div>`; }
    construction() {
        const p = this.begin('마을 발전 공사와 완공');
        p.dataset.construction = 'true';
        replaceSceneEnvironment(this.o.map, townAtStage(Math.max(1, this.o.seen)));
        p.innerHTML = `<header><p>함께 만든 우리 마을</p><button class="growth-skip">연출 건너뛰기</button></header><div class="growth-construction-art"><div class="growth-before">${this.preview(Math.max(1, this.o.seen))}</div><div class="growth-after">${this.preview(this.o.stage)}</div><div class="growth-crew">${['office', 'traveler', 'fashion'].map(k => `<span>${customerPoseArt(selectCustomerPose(k, 'ENTERING', 'right', 'WAVE', 0))}</span>`).join('')}</div><span class="growth-spark" aria-hidden="true">✦</span></div><h2></h2><p class="growth-construction-line" role="status"></p><progress max="8" value="0" aria-label="마을 공사 진행"></progress><p class="growth-unlock"></p><button class="growth-finish" hidden>완공 확인 · 마을 걷기</button>`;
        p.querySelector('.growth-skip').addEventListener('click', () => this.finish());
        p.querySelector('.growth-finish').addEventListener('click', () => this.finish());
        p.querySelector('.growth-skip').focus({ preventScroll: true });
        this.thumbs();
        const start = performance.now();
        const update = () => { const seconds = (performance.now() - start) / 1000; this.updateConstruction(seconds); if (seconds >= constructionDuration) {
            if (this.timer)
                clearInterval(this.timer);
            this.timer = undefined;
            this.finish();
        } };
        update();
        this.timer = setInterval(update, 100);
    }
    updateConstruction(seconds) { const p = this.panel; if (!p)
        return; const phase = growthPhase(seconds); p.querySelector('progress').value = Math.min(8, seconds); if (phase === this.phase)
        return; this.phase = phase; p.dataset.phase = phase; const m = growthMilestones[this.o.stage - 1]; p.querySelector('h2').textContent = phase === 'notice' ? '마을을 함께 가꿔요' : phase === 'working' ? '이웃들이 힘을 모으고 있어요' : m.title + '!'; p.querySelector('.growth-construction-line').textContent = phase === 'notice' ? '공사를 하는 동안 안전한 곳에서 잠깐 기다려 주세요.' : phase === 'working' ? '길을 정돈하고 새 시설을 준비하고 있어요.' : m.reaction; p.querySelector('.growth-unlock').textContent = phase === 'reveal' || phase === 'complete' ? '새롭게 이용해요 · ' + m.facility : ''; if (phase === 'reveal' || phase === 'complete')
        replaceSceneEnvironment(this.o.map, townAtStage(this.o.stage)); if (phase === 'complete')
        p.querySelector('.growth-finish').hidden = false; }
    finish() { if (!this.panel?.dataset.construction)
        return; replaceSceneEnvironment(this.o.map, townAtStage(this.o.stage)); if (!this.o.acknowledge()) {
        this.panel.querySelector('.growth-construction-line').textContent = '저장을 마치지 못했어요. 기존 카페는 그대로예요. 다시 확인해 주세요.';
        return;
    } this.o.seen = this.o.stage; this.close(); }
    album() {
        const p = this.begin('마을 성장 기록 앨범');
        const entries = growthAlbum({ stage: this.o.stage, seenStage: this.o.seen });
        p.innerHTML = `<header><div><p>우리 손으로 만든 변화</p><h2>마을 성장 앨범</h2></div><button class="growth-close" aria-label="성장 앨범 닫기">닫기</button></header><p>기존 발전 기록으로 모은 추억이에요. 시설 해금 기록이며 현금이나 재료를 다시 지급하지 않아요.</p><nav class="growth-album-tabs">${entries.map(m => `<button data-album-stage="${m.stage}" aria-pressed="${m.stage === this.o.stage}">${m.stage}단계 · ${m.title}</button>`).join('')}</nav><div class="growth-comparison"></div><div class="growth-album-record"></div><footer><button class="growth-facility">열린 시설 확인</button></footer>`;
        const render = (stage) => { const m = entries.find(e => e.stage === stage); p.querySelector('.growth-comparison').innerHTML = `<figure><figcaption>${stage === 1 ? '시작한 마을' : '이전 · ' + (stage - 1) + '단계'}</figcaption>${this.preview(Math.max(1, stage - 1))}</figure>${stage > 1 ? `<figure><figcaption>발전 후 · ${stage}단계</figcaption>${this.preview(stage)}</figure>` : ''}`; p.querySelector('.growth-album-record').innerHTML = `<h3>${m.title}</h3><p>${m.detail}</p><p>해금 기록 · ${m.reward}</p><small>개인정보와 별도 고해상도 사진을 저장하지 않아요.</small>`; p.querySelectorAll('[data-album-stage]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.albumStage) === stage))); this.thumbs(); };
        p.querySelectorAll('[data-album-stage]').forEach(b => b.onclick = () => render(Number(b.dataset.albumStage)));
        p.querySelector('.growth-close').addEventListener('click', () => this.close());
        p.querySelector('.growth-facility').addEventListener('click', () => { this.close(); this.o.facility(); });
        render(growthStage(this.o.stage));
        p.querySelector('.growth-close').focus({ preventScroll: true });
    }
    close() { if (this.timer)
        clearInterval(this.timer); this.timer = undefined; this.resize?.disconnect(); this.panel?.remove(); this.panel = undefined; this.phase = ''; document.removeEventListener('keydown', this.keys); if (this.busy) {
        this.busy = false;
        this.o.onFreeze(false);
    } this.o.root.classList.remove('village-growth-busy'); if (this.focus?.isConnected)
        this.focus.focus({ preventScroll: true }); }
    destroy() { this.destroyed = true; this.close(); }
}
