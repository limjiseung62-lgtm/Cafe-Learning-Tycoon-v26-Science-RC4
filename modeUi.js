let preparedBackupUrl;
if (typeof addEventListener === 'function')
    addEventListener('pagehide', () => { if (preparedBackupUrl)
        URL.revokeObjectURL(preparedBackupUrl); });
import { goalsHtml } from './progressiveGoals.js';
import { openProgressiveHub } from './progressiveHub.js';
import { alignMissionBusiness, unlocked, featureLevels } from './progressiveFeatures.js';
import { openProgressiveBusiness } from './progressiveEconomy.js';
import { createProgressiveGrowthSave } from './growthSave.js';
import { v26Deployment } from './progressiveFeatures.js';
import { createProgressiveClassMatch } from './sessionFactory.js';
import { organizeGrowthMenu } from './studentNavigation.js';
import { openManagementHub } from './managementHub.js';
import { chooseManagementStrategy } from './managementUi.js';
import { managementFor } from './managementState.js';
import { deploymentLocalStorage, deploymentPrefix } from './deploymentStorage.js';
import { openCafePicker } from './cafePicker.js';
import { cafeNames } from './cafePortfolio.js';
import { openVillage } from './villageUi.js';
import { openLayoutEditor } from './layoutEditor.js';
import { rosterFor, syncRosterSave } from './staffRecruitment.js';
import { openCrewDialog } from './recruitUi.js';
import { ensureGrowthWriteLock, releaseGrowthWriteLock, supportsGrowthLock } from './growthWriteLock.js';
import { chooseLongMission, prepareLongState } from './longGrowthUi.js';
import { exportGrowth, parseGrowthBackup, checkBackupRun } from './growthBackup.js';
import { growthRuntime } from './growthRuntime.js';
import { concepts, seededRandom } from './cafeRun.js';
import { createClassMatch } from './sessionFactory.js';
import { createGrowthSave } from './growthSave.js';
import { GrowthSessionController } from './growthSession.js';
import { LocalSaveRepository, BrowserGrowthRepository, CandidateSaveRepository, growthStorageKey } from './saveRepository.js';
import { policyFor } from './sessionModes.js';
import { balance } from './config.js';
import { questionCatalog } from './questionPack.js';
import { escapeText } from './questionRenderer.js';
const e = (id) => document.getElementById(id);
const study = () => '<div id="study-content" class="study-content"><span>학습 내용</span><strong id="study-title">문제를 준비하고 있어요…</strong><select id="study-pack" aria-label="학습 내용" hidden></select></div><p id="pack-error" class="save-error" aria-live="polite"></p><button type="button" id="pack-retry" class="text-button pack-retry" hidden>다시 시도</button>';
export function browserSaveRepository() { try {
    if (location.pathname.includes('/v20-preview/'))
        return new CandidateSaveRepository(new BrowserGrowthRepository(deploymentLocalStorage, growthStorageKey + '.v20-local'), new CandidateSaveRepository(new LocalSaveRepository(deploymentLocalStorage, growthStorageKey + '.v19c-local'), new LocalSaveRepository(deploymentLocalStorage)));
    if (location.pathname.includes('/v19c-preview/'))
        return new CandidateSaveRepository(new BrowserGrowthRepository(deploymentLocalStorage, growthStorageKey + '.v19c-local'), new CandidateSaveRepository(new LocalSaveRepository(deploymentLocalStorage, growthStorageKey + '.v19b-local'), new CandidateSaveRepository(new LocalSaveRepository(deploymentLocalStorage, growthStorageKey + '.v19a-local'), new LocalSaveRepository(deploymentLocalStorage))));
    if (location.pathname.includes('/v19b-preview/'))
        return new CandidateSaveRepository(new BrowserGrowthRepository(deploymentLocalStorage, growthStorageKey + '.v19b-local'), new CandidateSaveRepository(new LocalSaveRepository(deploymentLocalStorage, growthStorageKey + '.v19a-local'), new LocalSaveRepository(deploymentLocalStorage)));
    if (location.pathname.includes('/v19a-preview/'))
        return new CandidateSaveRepository(new BrowserGrowthRepository(deploymentLocalStorage, growthStorageKey + '.v19a-local'), new LocalSaveRepository(deploymentLocalStorage));
    return new BrowserGrowthRepository(deploymentLocalStorage);
}
catch {
    return new LocalSaveRepository(null);
} }
export class ModeFlow {
    start;
    current;
    repository;
    augmentResults;
    beforeStart;
    endView;
    pendingMission = null;
    growthPackChoice;
    freshGrowth = false;
    pool;
    controller = null;
    savedUntil = 0;
    endedGame = null;
    busy = false;
    loadFailed = false;
    view = 0;
    constructor(start, current, repository = browserSaveRepository(), augmentResults = () => { }, beforeStart = async () => { }, endView = () => { }) {
        this.start = start;
        this.current = current;
        this.repository = repository;
        this.augmentResults = augmentResults;
        this.beforeStart = beforeStart;
        this.endView = endView;
        this.showModes();
        addEventListener('beforeunload', event => { const game = this.current(); if (game?.status === 'RUNNING' && game.policy.protectActiveExit && document.body.dataset.classroomActive !== 'true') {
            event.preventDefault();
            event.returnValue = '';
        }
        else
            this.flush(); });
        addEventListener('pagehide', () => this.flush());
        addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden')
            this.flush(); });
    }
    setRepository(repo) { if (this.current()?.status === 'RUNNING')
        throw Error('Cannot change repository during a session'); this.repository = repo; this.showModes(); }
    card() { return document.querySelector('.welcome-card'); }
    showModes() { releaseGrowthWriteLock(); this.view++; this.busy = false; this.controller = null; this.endedGame = null; this.card().innerHTML = '<p class="eyebrow">오늘은 어떻게 놀까요?</p><h2>배움이 쌓이는<br>나만의 카페</h2><div class="mode-cards"><button id="choose-class" class="mode-card"><strong>수업 게임</strong><span>15분 동안 문제를 풀며 작은 카페를 빠르게 키워요!</span></button><button id="choose-growth" class="mode-card"><strong>내 카페 키우기</strong><span>내 카페를 저장하고 Lv.15까지 키워요!</span></button></div><div class="classroom-entry"><button id="teacher-host" class="secondary">교사용 방 만들기</button><button id="student-join" class="secondary">학생 방 입장</button></div><p class="hint">처음이라면 메뉴에서 게임 방법을 눌러 보세요.</p>'; if (v26Deployment())
        this.card().querySelector('.classroom-entry').hidden = true; e('choose-class').onclick = () => this.classSetup(); e('choose-growth').onclick = () => v26Deployment() ? this.growthSetup() : this.villageSetup(); e('teacher-host').onclick = () => document.dispatchEvent(new CustomEvent('classroom-open', { detail: 'teacher' })); e('student-join').onclick = () => document.dispatchEvent(new CustomEvent('classroom-open', { detail: 'student' })); }
    villageSetup() { if (v26Deployment()) {
        this.controller = null;
        this.endedGame = null;
        const read = this.repository.read();
        if (read.status === 'ready' && unlocked(read.save, 'village'))
            void openVillage(this.repository, () => this.growthSetup(true), () => this.growthSetup(true));
        else
            this.growthSetup();
        return;
    } this.controller = null; this.endedGame = null; void openVillage(this.repository, () => { const r = this.repository.read(); const fresh = !(r.status === 'ready' && r.save.campaign?.run && !r.save.campaign.run.closed); if (fresh)
        void openCafePicker(this.repository, () => this.growthSetup(true), () => this.villageSetup());
    else
        this.growthSetup(false); }, () => this.showModes()); }
    back() { e('mode-back').onclick = () => this.showModes(); }
    controls(disabled) { this.card().querySelectorAll('[data-start]').forEach(b => b.disabled = disabled); }
    async populatePacks(retry = false) { const view = this.view; this.loadFailed = false; this.controls(true); e('pack-error').textContent = ''; e('pack-retry').hidden = true; try {
        if (retry)
            questionCatalog.reset();
        const growth = !!this.card().querySelector('#continue-growth,#new-growth,#reset-growth');
        const list = await questionCatalog.selectable(growth || v26Deployment() ? 'growth' : undefined);
        if (view !== this.view)
            return;
        const select = e('study-pack');
        select.innerHTML = list.map(p => '<option value="' + escapeText(p.packId) + '">' + escapeText(p.title) + '</option>').join('');
        if (growth && list.some(p => p.packId === this.growthPackChoice))
            select.value = this.growthPackChoice;
        select.hidden = list.length === 1;
        const progress = document.getElementById('study-progress');
        if (progress) {
            const update = () => { if (growth) {
                this.growthPackChoice = select.value;
                const chosen = list.find(p => p.packId === select.value);
                e('study-title').textContent = chosen?.selectionLabel ?? chosen?.title ?? '학습 내용을 골라요';
            } const saved = this.repository.read(); const record = saved.status === 'ready' ? saved.save.campaign?.studies[select.value] : undefined; progress.textContent = record ? '이 학습 기록: 풀이 ' + record.attempted + ' · 정답 ' + record.correct + ' · 복습 성공 ' + record.reviewCorrect + ' · 다음 준비 수준 ' + record.level : '팩별 풀이 기록은 영업을 시작하면 함께 저장돼요.'; };
            select.onchange = update;
            update();
        }
        if (!growth)
            e('study-title').textContent = list.length === 1 ? (list[0].selectionLabel ?? list[0].title) : '오늘 배울 내용을 골라요';
        this.controls(false);
    }
    catch {
        if (view !== this.view)
            return;
        e('study-title').textContent = '학습 내용을 확인해 주세요.';
        this.packError();
    } if (view === this.view)
        e('pack-retry').onclick = () => { void this.populatePacks(true); }; }
    packError() { this.loadFailed = true; this.controls(true); e('pack-error').textContent = '문제를 불러오지 못했어요. 다시 시도해 주세요.'; e('pack-retry').hidden = false; }
    async problems() { const id = e('study-pack').value; if (!id || !(await questionCatalog.selectable(this.card().querySelector('#continue-growth,#new-growth,#reset-growth') || v26Deployment() ? 'growth' : undefined)).some(p => p.packId === id))
        throw Error('inactive pack'); return (await questionCatalog.load(id)).questions; }
    async begin(factory, pool, view, resuming = false) { if (!resuming)
        await this.beforeStart(); if (view !== this.view)
        return; this.start(factory(), pool); }
    classSetup() { if (v26Deployment()) {
        this.progressiveClassSetup();
        return;
    } this.view++; this.busy = false; this.card().innerHTML = '<button id="mode-back" class="text-button">← 모드 선택</button><h2>수업 게임</h2><p>같은 작은 카페에서 시작해, 나만의 조합을 만들어요.</p><form id="class-settings">' + study() + '<label>플레이 방식<select id="class-style"><option value="run">오늘의 카페 · 특성 선택</option><option value="classic">기존 수업 게임</option></select></label><div id="run-settings"><label>카페 콘셉트<select id="run-concept">' + concepts.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('') + '</select></label><p id="concept-description" class="hint">' + concepts[0].description + '</p><label>수업 코드 (같은 코드 = 같은 특성 후보)<input id="run-code" maxlength="32" autocomplete="off"></label><p class="hint">네 번의 특성 선택 · 마지막 감사 파티 주문<br>영업 중에도 선택을 나중에 할 수 있어요.</p></div><label>플레이 시간<select id="duration">' + balance.time.presets.map(s => '<option value="' + s + '">' + s / 60 + '분</option>').join('') + '</select></label><p class="hint">음식 만들기로 문제를 맞히고 카페를 키워요.<br>게임 중에는 시간이 계속 흘러요.</p><button class="primary" data-start disabled>카페 문 열기 →</button></form>'; this.back(); e('run-code').value = 'CAFE-' + Math.random().toString(36).slice(2, 8).toUpperCase(); e('class-style').onchange = () => { e('run-settings').hidden = e('class-style').value !== 'run'; }; e('run-concept').onchange = () => { e('concept-description').textContent = concepts.find(c => c.id === e('run-concept').value).description; }; void this.populatePacks(); e('class-settings').onsubmit = async (ev) => { ev.preventDefault(); if (this.busy)
        return; this.busy = true; this.controls(true); const view = this.view; const seconds = Number(e('duration').value); try {
        if (!balance.time.presets.some(s => s === seconds))
            return;
        const pool = await this.problems();
        const isRun = e('class-style').value === 'run', code = e('run-code').value.trim().slice(0, 32) || 'CAFE', concept = e('run-concept').value;
        await this.begin(() => { const g = createClassMatch(seconds, isRun ? seededRandom('guests:' + code) : Math.random); if (isRun)
            g.enableRun(code, concept); return g; }, pool, view);
    }
    catch {
        if (view === this.view)
            this.packError();
    }
    finally {
        this.busy = false;
        if (view === this.view && !this.loadFailed)
            this.controls(false);
    } }; }
    progressiveClassSetup() { this.view++; this.busy = false; this.card().innerHTML = '<button id="mode-back">← 모드 선택</button><h2>15분 수업 게임</h2><p>작은 카페에서 빠르게 성장해요. 매번 새로 시작해요.</p><form id="class-settings">' + study() + '<button class="primary" data-start disabled>15분 시작</button></form>'; this.back(); void this.populatePacks(); e('class-settings').onsubmit = async (ev) => { ev.preventDefault(); if (this.busy)
        return; this.busy = true; const view = this.view; try {
        const pool = await this.problems();
        await this.begin(() => createProgressiveClassMatch(), pool, view);
    }
    catch {
        this.packError();
    }
    finally {
        this.busy = false;
    } }; }
    growthSetup(fresh = false) { if (v26Deployment()) {
        this.progressiveGrowthSetup(fresh);
        return;
    } this.freshGrowth = fresh; this.view++; this.busy = false; const loaded = this.repository.read(), ready = loaded.status === 'ready'; this.card().innerHTML = '<button id="mode-back" class="text-button">← 모드 선택</button><h2>내 카페 키우기</h2><p>카페는 그대로, 오늘 공부할 내용은 매 영업마다 골라요.</p><p>' + policyFor('CAFE_GROWTH').sessionSeconds / 60 + '분 영업 · 이 브라우저에 저장돼요.</p>' + study() + '<p id="study-progress" class="hint" role="status"></p>' + (ready ? '<div class="save-preview">내 카페 ' + loaded.save.cafeLevel + '단계 · ' + loaded.save.money.toLocaleString() + '원<br>푼 문제 ' + loaded.save.cumulativeQuestionsAttempted + '개 · 영업 ' + loaded.save.completedSessions + '회</div><button id="continue-growth" class="primary" data-start disabled>15분 영업 시작</button><button id="reset-growth" class="text-button" data-start disabled>새로 시작</button>' : loaded.status === 'empty' ? '<button id="new-growth" class="primary" data-start disabled>새 카페 시작</button>' : '<p class="save-error">' + escapeText(loaded.message) + '</p><button id="reset-growth" class="primary" data-start disabled>새 카페 시작</button>'); this.back(); if (ready && loaded.save.portfolio) {
        const picker = document.createElement('button');
        picker.id = 'choose-operating-cafe';
        picker.className = 'secondary';
        picker.textContent = cafeNames[loaded.save.portfolio.activeCafeId] + ' · 운영 카페 바꾸기';
        picker.disabled = !!loaded.save.campaign?.run && !loaded.save.campaign.run.closed;
        picker.onclick = () => { void openCafePicker(this.repository, () => this.growthSetup(true), () => this.villageSetup()); };
        this.card().append(picker);
    } const town = document.createElement('button'); town.id = 'return-village'; town.className = 'secondary'; town.textContent = ready && loaded.save.campaign?.run && !loaded.save.campaign.run.closed ? '영업 종료 후 마을로 돌아갈 수 있어요' : '마을로 돌아가기'; town.disabled = ready && !!loaded.save.campaign?.run && !loaded.save.campaign.run.closed; town.onclick = () => this.villageSetup(); this.card().append(town); this.backupControls(); const crew = document.createElement('button'); crew.className = 'secondary'; crew.id = 'manage-crew'; crew.textContent = '직원 구인·근무 편성'; crew.onclick = () => { void openCrewDialog(this.repository, ready ? loaded.save : createGrowthSave(), () => this.growthSetup(fresh)); }; this.card().append(crew); const layout = document.createElement('button'); layout.id = 'decorate-cafe'; layout.className = 'secondary'; layout.textContent = '카페 꾸미기'; layout.onclick = () => { void openLayoutEditor(this.repository, ready ? loaded.save : createGrowthSave(), () => this.growthSetup(fresh)); }; this.card().append(layout); const hub = document.createElement('button'); hub.className = 'secondary'; hub.id = 'manage-hub'; hub.textContent = '경영실 · 리뷰·연구·교육·앨범'; hub.disabled = ready && !!loaded.save.campaign?.run && !loaded.save.campaign.run.closed; hub.onclick = () => { void openManagementHub(this.repository, ready ? loaded.save : createGrowthSave(), () => this.growthSetup(fresh)); }; this.card().append(hub); if (ready && loaded.save.campaign?.history?.length) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = '최근 영업 기록';
        details.append(summary);
        for (const h of loaded.save.campaign.history.slice(-5).reverse()) {
            const row = document.createElement('p');
            row.textContent = (h.cafeId ? cafeNames[h.cafeId] + ' · ' : '이전 영업 · ') + new Date(h.endedAt).toLocaleDateString('ko-KR') + ' · 카페 ' + h.levelBefore + ' → ' + h.levelAfter + '단계 · 매출 ' + h.revenue.toLocaleString() + '원';
            details.append(row);
        }
        this.card().append(details);
    } if (ready && loaded.save.campaign?.run?.closed && fresh) {
        const last = document.createElement('button');
        last.id = 'last-growth-result';
        last.className = 'secondary';
        last.textContent = '지난 영업 결과 다시 보기';
        last.onclick = () => this.growthSetup(false);
        this.card().append(last);
    } if (ready && loaded.save.campaign?.run && !fresh) {
        const next = document.createElement('button');
        next.id = 'next-growth';
        next.className = 'secondary';
        next.textContent = '새 15분 영업 · 학습 내용 선택';
        next.onclick = () => this.growthSetup(true);
        this.card().append(next);
        next.hidden = !loaded.save.campaign.run.closed;
    } void this.populatePacks(); if (ready && loaded.save.campaign?.run && !fresh) {
        const select = e('study-pack');
        const resume = loaded.save.campaign.run;
        void this.populatePacks().then(() => { select.value = resume.packId; select.dispatchEvent(new Event('change')); select.disabled = true; e('study-title').textContent = '이전 영업 복구 · 문제팩 변경은 다음 영업에서'; });
        e('continue-growth').textContent = resume.closed ? '지난 영업 결과 보기' : '중단한 15분 이어하기 · 종료 시각 유지';
    } if (ready)
        e('continue-growth').onclick = () => { void this.launchGrowth(loaded.save); }; e('new-growth')?.addEventListener('click', () => { void this.launchGrowth(createGrowthSave()); }); if (ready && loaded.save.portfolio) {
        const reset = e('reset-growth');
        reset.hidden = true;
    } e('reset-growth')?.addEventListener('click', () => this.confirm('지금까지 키운 카페가 초기화됩니다. 정말 새로 시작할까요?', () => { void this.launchGrowth(createGrowthSave(), true); })); organizeGrowthMenu(this.card(), tab => { void openManagementHub(this.repository, ready ? loaded.save : createGrowthSave(), () => this.growthSetup(fresh), tab); }, ready && !!loaded.save.campaign?.run && !loaded.save.campaign.run.closed); }
    progressiveGrowthSetup(fresh = false) {
        this.pendingMission = null;
        this.view++;
        this.busy = false;
        const read = this.repository.read(), ready = read.status === 'ready', save = ready ? read.save : createProgressiveGrowthSave();
        this.freshGrowth = fresh || !save.campaign?.run || !!save.campaign.run.closed;
        const level = save.cafeLevel, next = Object.entries(featureLevels).find(([, n]) => n > level), nextName = { missions: '미션과 특별 손님', recruitment: '직원 구인', cake: '케이크 미니게임', decor: '카페 꾸미기', branch: '카페 성장 분기', reviews: '리뷰와 단골', research: '연구와 운영 전략', village: '마을 탐험과 투자', specialization: '카페 전문화', education: '직원 교육과 특별 영업', delivery: '배달과 축제', franchise: '자동 운영 지점', landmark: '랜드마크' };
        this.card().innerHTML = '<button id="mode-back">← 모드 선택</button><h2>내 카페 키우기</h2><p>본점은 계속 성장하고, 공부는 매번 골라요.</p><p>지금: 카페 Lv.' + level + ' · ' + save.money.toLocaleString() + '원</p><p>다음 돈 목표: ' + (policyFor('CAFE_GROWTH').economy.cafes[level]?.expansionCost.toLocaleString() ?? '마을 투자와 자동 지점') + (level < 15 ? '원 모아 카페 확장' : '') + '</p><p>다음: ' + (next ? 'Lv.' + next[1] + ' ' + (nextName[next[0]] ?? next[0]) : '지점과 마을을 꾸준히 키워요') + '</p>' + study() + '<p id="study-progress" role="status"></p><button id="' + (ready ? 'continue-growth' : 'new-growth') + '" class="primary" data-start disabled>' + (!this.freshGrowth ? '중단한 영업 이어하기 · 종료 시각 유지' : '15분 영업 시작') + '</button><p class="hint">v2.6 전용 카페예요. 이전 버전 카페는 그대로 보관돼요.</p><div id="progressive-actions" class="progressive-grid"></div>';
        this.back();
        const actions = e('progressive-actions'), active = !!save.campaign?.run && !save.campaign.run.closed;
        const action = (id, label, run) => { const b = document.createElement('button'); b.id = id; b.textContent = label; b.disabled = active; b.onclick = run; actions.append(b); };
        if (unlocked(save, 'missions'))
            action('select-mission', '미션 선택 · 선택 사항', () => { void this.problems().then(pool => chooseLongMission(save, pool)).then(choice => { this.pendingMission = choice; if (choice)
                e('select-mission').textContent = '미션 준비 완료 ✓'; }); });
        if (unlocked(save, 'recruitment'))
            action('manage-crew', '직원 구인·교대', () => { void openCrewDialog(this.repository, save, () => this.growthSetup(true)); });
        if (unlocked(save, 'decor'))
            action('decorate-cafe', '카페 꾸미기', () => { void openLayoutEditor(this.repository, save, () => this.growthSetup(true)); });
        if (unlocked(save, 'reviews'))
            action('manage-hub', '경영실', () => { void openManagementHub(this.repository, save, () => this.growthSetup(true)); });
        if (unlocked(save, 'strategy'))
            action('select-strategy', '운영 전략 선택', () => { void (async () => { const strategy = await chooseManagementStrategy(save); if (strategy) {
                const n = structuredClone(save);
                managementFor(n).strategy = strategy;
                const w = this.repository.write(n, save);
                if (!w.ok)
                    e('pack-error').textContent = w.message;
                else
                    this.growthSetup(true);
            } })(); });
        if (unlocked(save, 'village'))
            action('return-village', '마을 탐험', () => { void openVillage(this.repository, () => this.growthSetup(true), () => this.growthSetup(true)); });
        if (unlocked(save, 'investment'))
            action('invest-village', '마을 투자·자동 지점', () => { void openProgressiveHub(this.repository, () => this.growthSetup(true)); });
        if (save.v26 && unlocked(save, 'investment'))
            this.card().insertAdjacentHTML('beforeend', goalsHtml(save));
        const records = document.createElement('details');
        records.innerHTML = '<summary>기록과 백업</summary>';
        this.card().append(records);
        this.backupControls();
        records.append(this.card().querySelector('.growth-backup'));
        void this.populatePacks().then(() => { if (!this.freshGrowth && save.campaign?.run) {
            const select = e('study-pack');
            select.value = save.campaign.run.packId;
            select.disabled = true;
            select.dispatchEvent(new Event('change'));
        } });
        e(ready ? 'continue-growth' : 'new-growth').onclick = () => { void this.launchGrowth(save); };
    }
    async launchGrowth(save, replace = false) { if (this.busy)
        return; this.busy = true; this.controls(true); const view = this.view; try {
        if (supportsGrowthLock() && !await ensureGrowthWriteLock()) {
            e('pack-error').textContent = '다른 창에서 카페를 운영하고 있어요. 그 창을 닫거나 모드 선택으로 돌아가 주세요.';
            return;
        }
        if (!supportsGrowthLock() && save.roster) {
            e('pack-error').textContent = '직원 저장 보호를 위해 최신 브라우저의 HTTPS 또는 localhost로 접속해 주세요.';
            return;
        }
        const current = this.repository.read();
        if (!replace && current.status === 'ready')
            save = current.save;
        const pool = await this.problems();
        if ((!save.v26 || unlocked(save, 'recruitment')) && !save.roster && supportsGrowthLock() && (!save.campaign?.run || save.campaign.run.closed)) {
            const next = structuredClone(save);
            next.roster = rosterFor(next);
            syncRosterSave(next);
            const write = replace ? { ok: true, message: '' } : this.repository.write(next, save);
            if (!write.ok) {
                e('pack-error').textContent = write.message;
                return;
            }
            save = next;
        }
        if (replace) {
            const result = this.repository.replace(save, true);
            if (!result.ok) {
                e('pack-error').textContent = '카페 저장에 문제가 생겼어요. 기존 카페는 그대로 있어요.';
                return;
            }
        }
        if (!save.v26 && (!save.campaign?.run || this.freshGrowth)) {
            const strategy = await chooseManagementStrategy(save);
            if (!strategy)
                return;
            const next = structuredClone(save);
            managementFor(next).strategy = strategy;
            const written = this.repository.write(next, save);
            if (!written.ok) {
                e('pack-error').textContent = written.message;
                return;
            }
            save = next;
        }
        const selection = save.v26 ? this.pendingMission : !save.v26 && (!save.campaign?.run || this.freshGrowth) ? await chooseLongMission(save, pool) : null;
        if (!save.v26 && (!save.campaign?.run || this.freshGrowth) && !selection)
            return;
        let progressiveId;
        if (save.v26 && (!save.campaign?.run || this.freshGrowth)) {
            const next = structuredClone(save);
            progressiveId = next.v26?.inflight?.id ?? selection?.id ?? crypto.randomUUID();
            if (!next.v26?.inflight && !openProgressiveBusiness(next, progressiveId))
                throw Error('영업 기록을 확인해 주세요.');
            const w = this.repository.write(next, save);
            if (!w.ok) {
                e('pack-error').textContent = w.message;
                return;
            }
            save = next;
        }
        await this.begin(() => { const g = growthRuntime.create(save, pool, this.freshGrowth, progressiveId ?? selection?.id); if (selection) {
            alignMissionBusiness(selection.state, selection.id, progressiveId ?? selection.id);
            prepareLongState(g, selection.state);
        } return g; }, pool, view, !!save.campaign?.run && !this.freshGrowth);
    }
    catch {
        if (view === this.view)
            this.packError();
    }
    finally {
        this.busy = false;
        if (view === this.view)
            this.controls(false);
    } }
    backupControls() { const wrap = document.createElement('section'); wrap.className = 'growth-backup'; wrap.innerHTML = '<p class="hint">카페별 자산·배치와 공통 학습·마을은 이 브라우저에 저장돼요. 저장 삭제·기기 교체 전 JSON 백업을 받아 주세요. 중단해도 원래 종료 시각은 유지되며, 종료된 회차는 결과로 복구돼요. 15분 완주·서로 다른 문제 8개·정답 5개부터 성장 지원금을 받아요.</p><button id="export-growth" class="secondary">카페 JSON 백업</button><label class="secondary">백업 복원<input id="import-growth" type="file" accept="application/json,.json"></label><p id="backup-message" role="status"></p>'; this.card().append(wrap); if (deploymentPrefix() && !v26Deployment()) {
        const bring = document.createElement('button');
        bring.id = 'import-public-cafe';
        bring.className = 'secondary';
        bring.textContent = '기존 공개 카페 가져오기';
        wrap.prepend(bring);
        bring.onclick = () => { const source = new LocalSaveRepository(globalThis.localStorage).read(); if (source.status !== 'ready') {
            e('backup-message').textContent = '이 브라우저에 기존 공개 카페가 없어요. 기존 카페를 키웠던 같은 기기·브라우저에서 공개판에 접속한 뒤 다시 시도해 주세요. 다른 기기의 저장은 자동 이전되지 않습니다.';
            return;
        } const copy = structuredClone(source.save); this.confirm('기존 공개 카페 ' + copy.cafeLevel + '단계 · ' + copy.money.toLocaleString() + '원을 테스트판으로 복사할까요? 원본은 그대로 유지됩니다. 현재 테스트 카페는 별도 보관됩니다.', () => { void (async () => { if (supportsGrowthLock() && !await ensureGrowthWriteLock()) {
            e('backup-message').textContent = '다른 테스트 카페 창을 닫아 주세요.';
            return;
        } const result = this.repository.replace(copy, true); if (result.ok)
            this.growthSetup();
        else
            e('backup-message').textContent = result.message; })(); }); };
    } e('export-growth').onclick = () => { const r = this.repository.read(); if (r.status !== 'ready') {
        e('backup-message').textContent = '저장된 카페가 없어요.';
        return;
    } try {
        if (preparedBackupUrl)
            URL.revokeObjectURL(preparedBackupUrl);
        const url = URL.createObjectURL(new Blob([exportGrowth(r.save)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = r.save.v26 ? 'cafe-v26-backup.json' : r.save.portfolio ? 'cafe-all-cafes-v19c-backup.json' : 'cafe-growth-backup.json';
        link.textContent = '백업 JSON 파일 저장';
        preparedBackupUrl = url;
        link.id = 'prepared-backup-file';
        link.className = 'secondary';
        wrap.querySelector('#prepared-backup-file')?.remove();
        wrap.append(link);
        link.click();
        e('backup-message').textContent = '백업 파일을 준비했어요. 다운로드가 시작되지 않으면 파일 저장 링크를 눌러 주세요.';
    }
    catch {
        e('backup-message').textContent = '백업을 만들지 못했어요.';
    } }; const restoreText = async (text) => { try {
        const save = parseGrowthBackup(text);
        if (v26Deployment() && !save.v26)
            throw Error('이전 버전 백업은 원본 그대로 보관해 주세요. v2.6 전용 백업만 복원할 수 있어요.');
        await checkBackupRun(save);
        this.confirm('현재 카페를 별도 보관한 뒤 백업으로 복원할까요?', () => { void (async () => { if (supportsGrowthLock() && !await ensureGrowthWriteLock()) {
            e('backup-message').textContent = '다른 카페 창을 먼저 닫아 주세요.';
            return;
        } const result = this.repository.replace(save, true); if (result.ok)
            this.growthSetup();
        else
            e('backup-message').textContent = result.message; })(); });
    }
    catch (error) {
        e('backup-message').textContent = error instanceof Error ? error.message : '복원 실패 · 기존 저장 보존';
    } }; e('import-growth').onchange = async () => { const file = e('import-growth').files?.[0]; if (!file)
        return; if (file.size > 4000000) {
        e('backup-message').textContent = '백업 파일이 너무 커요. 기존 저장은 유지됩니다.';
        return;
    } await restoreText(await file.text()); }; if (deploymentPrefix()) {
        const alternative = document.createElement('details');
        alternative.innerHTML = '<summary>파일 선택이 안 되나요? JSON 텍스트로 복원</summary><label>카페 백업 JSON<textarea id="backup-json-text" maxlength="4000000" style="width:100%;box-sizing:border-box;min-height:100px" placeholder="카페 백업 JSON 내용을 붙여넣으세요"></textarea></label><button id="restore-backup-text" class="secondary">JSON 확인 후 복원</button><p class="hint">기기에서만 처리하며 서버에 전송하지 않아요. 복원 전 현재 테스트 카페를 별도 보관해요.</p>';
        wrap.append(alternative);
        e('restore-backup-text').onclick = () => { void restoreText(e('backup-json-text').value); };
    } }
    confirm(message, action) { if (document.getElementById('mode-confirm'))
        return; const dialog = document.createElement('section'); dialog.id = 'mode-confirm'; dialog.className = 'mode-confirm'; dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-label', '카페 확인'); dialog.innerHTML = '<div><h2>한 번 더 확인해요</h2><p>' + message + '</p><button id="confirm-cancel" class="secondary">취소</button><button id="confirm-yes" class="primary">확인하고 진행</button></div>'; document.body.append(dialog); e('confirm-cancel').onclick = () => dialog.remove(); e('confirm-yes').onclick = () => { if (!dialog.isConnected)
        return; dialog.remove(); action(); }; e('confirm-cancel').focus(); }
    attach(game, pool) { this.pool = pool; this.endedGame = null; this.controller = game.policy.persistence === 'saved-cafe' ? new GrowthSessionController(game, this.repository, undefined, (save, base) => growthRuntime.enrich(save, base)) : null; if (this.controller)
        this.feedback(this.controller.save());
    else
        e('save-status').textContent = ''; const cafeRead = this.repository.read(); e('mode-label').textContent = game.policy.label + (game.mode === 'CAFE_GROWTH' && cafeRead.status === 'ready' && cafeRead.save.portfolio ? ' · ' + cafeNames[cafeRead.save.portfolio.activeCafeId] : ''); e('end-business').hidden = !this.controller; e('end-business').onclick = () => this.confirm('지금 영업을 마치고 카페를 저장할까요?', () => { game.endBusiness(); this.endView(); this.refresh(game); }); e('leave-game').onclick = () => this.confirm(this.controller ? '현재 카페를 저장하고 나갈까요?' : '수업 게임을 나가면 현재 기록이 끝납니다.', () => { if (game.status !== 'RUNNING')
        return; if (this.controller) {
        this.flush();
        if (!this.controller.lastResult.ok)
            return;
        location.reload();
        return;
    }
    else
        game.leaveClassMatch(); this.endView(); this.refresh(game); }); }
    feedback(result) { e('save-status').textContent = result.ok ? '저장 완료 ✓' : result.message || '카페 저장에 문제가 생겼어요.'; e('save-status').className = result.ok ? 'save-ok' : 'save-error'; this.savedUntil = result.ok ? performance.now() + 2200 : Infinity; if (result.ok) {
        document.getElementById('save-blocker')?.remove();
    }
    else if (!document.getElementById('save-blocker')) {
        const blocker = document.createElement('section');
        blocker.id = 'save-blocker';
        blocker.className = 'mode-confirm';
        blocker.setAttribute('role', 'alertdialog');
        blocker.innerHTML = '<div><h2>저장을 확인해 주세요</h2><p>' + escapeText(result.message) + ' · 기존 저장은 덮어쓰지 않았어요. 종료 시각은 계속 유지돼요.</p><button id="retry-growth-save" class="secondary">다시 저장</button><button id="reload-growth-save" class="primary">저장된 카페 다시 열기</button></div>';
        document.body.append(blocker);
        e('retry-growth-save').onclick = () => this.flush();
        e('reload-growth-save').onclick = () => location.reload();
        e('reload-growth-save').focus();
    } }
    flush() { if (!this.controller)
        return true; const result = this.controller.save(); this.feedback(result); return result.ok; }
    refresh(game) { if (!this.controller)
        return; const result = this.controller.poll(); if (result)
        this.feedback(result); if (performance.now() > this.savedUntil)
        e('save-status').textContent = ''; if (game.status === 'CLOSED' && this.endedGame !== game) {
        this.endedGame = game;
        this.growthResults(game);
    } }
    home() { e('results').hidden = true; e('setup').hidden = false; document.getElementById('app').classList.remove('in-session'); this.showModes(); }
    growthResults(game) { const result = game.result, save = this.controller.current(); e('playing').hidden = true; e('problem-panel').hidden = true; e('investment-panel').hidden = true; e('results').hidden = false; e('results').innerHTML = '<p class="eyebrow">내 카페</p><h2>오늘의 카페 운영 결과</h2><h3>이번 15분 영업</h3><div class="result-grid">' + [['매출', result.revenue.toLocaleString() + '원'], ['손님', result.servedCustomers + '명'], ['판매 음식', result.soldFood + '개'], ['푼 문제', result.attempted + '개'], ['정답', result.correct + '개'], ['정답률', result.attempted ? result.accuracy + '%' : '미응시']].map(([a, b]) => '<div>' + a + '<strong>' + b + '</strong></div>').join('') + '</div><h3>내 카페</h3><div class="growth-summary">' + [['카페', game.cafeLevel + '단계'], ['보유금', game.money.toLocaleString() + '원'], ['창고', game.warehouseLevel + '단계'], ['직원', game.service.paid.length + '명'], ['메뉴', game.menus.length + '종'], ['평균 메뉴', '★' + (game.menus.reduce((sum, m) => sum + m.currentLevel, 0) / game.menus.length).toFixed(1)]].map(([a, b]) => '<div>' + a + '<strong>' + b + '</strong></div>').join('') + '</div><p>누적 매출 ' + save.cumulativeRevenue.toLocaleString() + '원 · 푼 문제 ' + save.cumulativeQuestionsAttempted + '개</p><p id="growth-save-result" class="' + (this.controller.lastResult.ok ? 'save-ok' : 'save-error') + '">' + (this.controller.lastResult.ok ? '저장 완료 ✓' : '카페 저장에 문제가 생겼어요. 다시 저장해 주세요.') + '</p><button id="growth-next" class="primary">다시 영업하기</button><button id="growth-home" class="secondary">모드 선택으로</button>'; e('growth-next').disabled = !this.controller.lastResult.ok; e('growth-home').disabled = !this.controller.lastResult.ok; if (!this.controller.lastResult.ok) {
        const retry = document.createElement('button');
        retry.className = 'secondary';
        retry.textContent = '저장 다시 시도';
        retry.onclick = () => { this.flush(); this.growthResults(game); };
        e('results').append(retry);
    } e('growth-next').onclick = () => { this.flush(); if (!this.controller.lastResult.ok) {
        this.growthResults(game);
        return;
    } this.home(); if (v26Deployment())
        this.growthSetup(true);
    else
        void openCafePicker(this.repository, () => this.growthSetup(true), () => this.villageSetup()); }; e('growth-home').onclick = () => { this.flush(); if (!this.controller.lastResult.ok) {
        this.growthResults(game);
        return;
    } this.home(); }; if (save.portfolio)
        e('results').querySelector('h2').textContent = cafeNames[save.portfolio.activeCafeId] + ' · 이번 영업 결과'; const base = this.controller.base; const changes = document.createElement('p'); changes.className = 'growth-changes'; changes.textContent = '이번 성장: 카페 ' + base.cafeLevel + ' → ' + game.cafeLevel + '단계 · 직원 ' + base.staffOwned.length + ' → ' + game.service.paid.length + '명 · 창고 ' + base.warehouseLevel + ' → ' + game.warehouseLevel + '단계 · 메뉴 ' + base.unlockedMenuIds.length + ' → ' + game.menus.length + '종'; e('results').querySelector('h3').before(changes); const grant = save.growthEconomy?.receipts.find(r => r.id === growthRuntime.businessId()); if (grant) {
        const box = document.createElement('section');
        box.id = 'growth-grant';
        box.className = 'growth-grant';
        box.innerHTML = '<h3>이번 영업 성장 지원</h3><p>' + grant.total.toLocaleString() + '원 · 판매 매출과 별도</p>' + (grant.reason === 'legacy' ? '<p>이전 버전에 종료한 영업은 지원금을 소급 지급하지 않아요.</p>' : grant.eligible ? '<p>완주 ' + grant.completion.toLocaleString() + ' · 미션 ' + grant.mission.toLocaleString() + ' · 복습 ' + grant.review.toLocaleString() + ' · 이정표 ' + grant.milestone.toLocaleString() + '원</p>' : '<p>15분 완주 · 서로 다른 문제 8개 · 정답 5개부터 지원해요. 조기 종료·한 문제 반복·켜 놓기만으로는 받지 않아요.</p>');
        e('growth-save-result').before(box);
    } if (save.v26?.lastPayout?.id === growthRuntime.businessId()) {
        const payout = document.createElement('section');
        payout.className = 'growth-grant';
        payout.innerHTML = '<h3>자동 지점 정산</h3><p>' + save.v26.lastPayout.amount.toLocaleString() + '원 · 이번 영업 한 번 정산</p>' + (save.v26.lastPayout.details ?? []).map(d => '<article><strong>' + d.id + '호점 Lv.' + d.level + ' · ' + d.amount.toLocaleString() + '원</strong><p>' + d.customers + ' · ' + d.event + '</p></article>').join('') + '<p>본점 15분 완주 · 서로 다른 문제 8개 · 정답 5개를 채운 경우에만 지급해요.</p>';
        e('growth-save-result').before(payout);
    } const staffGrant = save.roster?.settlements.find(r => r.id === growthRuntime.businessId()); if (staffGrant) {
        const box = document.createElement('p');
        box.textContent = '직원 협력 보너스 ' + staffGrant.total.toLocaleString() + '원 · 이번 자격 영업 매출의 1%, 최대 1,500원';
        e('growth-save-result').before(box);
    } const crew = document.createElement('button'); crew.className = 'secondary'; crew.textContent = '다음 영업 직원 준비'; crew.disabled = !this.controller.lastResult.ok; crew.onclick = () => { if (!this.flush())
        return; this.home(); this.growthSetup(true); document.getElementById('manage-crew')?.click(); }; if (unlocked(game, 'recruitment'))
        e('results').append(crew); const layout = document.createElement('button'); layout.className = 'secondary'; layout.textContent = '다음 영업 카페 꾸미기'; layout.disabled = !this.controller.lastResult.ok; layout.onclick = () => { if (!this.flush())
        return; this.home(); this.growthSetup(true); document.getElementById('decorate-cafe')?.click(); }; if (unlocked(game, 'decor'))
        e('results').append(layout); const village = document.createElement('button'); village.id = 'results-village'; village.className = 'secondary'; village.textContent = '마을로 돌아가기 · 의뢰 보고'; village.disabled = !this.controller.lastResult.ok; village.onclick = () => { if (!this.flush())
        return; e('results').hidden = true; e('setup').hidden = false; document.getElementById('app').classList.remove('in-session'); this.villageSetup(); }; if (unlocked(game, 'village'))
        e('results').append(village); this.augmentResults(); }
}
