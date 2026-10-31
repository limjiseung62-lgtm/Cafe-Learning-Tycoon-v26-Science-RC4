import { deploymentLocalStorage, deploymentSessionStorage } from './deploymentStorage.js';
import { classroomCafeCheckpoint, restoreClassroomCafe } from './classroomCheckpoint.js';
import { createClassMatch } from './sessionFactory.js';
import { seededRandom } from './cafeRun.js';
import { validatePack } from './questionPack.js';
import { escapeText as esc } from './questionRenderer.js';
export class ClassroomUi {
    current;
    start;
    stop;
    align;
    metrics;
    learningCheckpoint;
    restoreLearning;
    resumeCursor;
    restoreEnded;
    blobs = new Map();
    panel;
    status;
    access = null;
    state = null;
    pack = null;
    admin = '';
    active = false;
    finished = false;
    loading = false;
    syncing = false;
    base = { normal: 0, remediation: 0, twins: 0 };
    seq = 0;
    sort = 'nickname';
    teacherKey = '';
    waitingKey = '';
    studentBase = '';
    stream = null;
    streamBusy = false;
    destroyed = false;
    lastPush = -8000;
    finalSent = false;
    launchTimer = 0;
    accessGeneration = 0;
    lastContact = 0;
    connected = false;
    localWriteFailed = false;
    constructor(current, start, stop, align, metrics, learningCheckpoint, restoreLearning, resumeCursor = () => false, restoreEnded = () => false) {
        this.current = current;
        this.start = start;
        this.stop = stop;
        this.align = align;
        this.metrics = metrics;
        this.learningCheckpoint = learningCheckpoint;
        this.restoreLearning = restoreLearning;
        this.resumeCursor = resumeCursor;
        this.restoreEnded = restoreEnded;
        this.panel = document.createElement('section');
        this.panel.id = 'classroom-ui';
        this.panel.hidden = true;
        document.body.append(this.panel);
        this.status = document.createElement('aside');
        this.status.id = 'classroom-status';
        this.status.hidden = true;
        document.body.append(this.status);
        document.addEventListener('classroom-open', ev => { void this.open(ev.detail); });
        document.addEventListener('classroom-answer', () => { this.cacheStats(); this.flushBeforeExit(); });
        setInterval(() => { if (this.access && !this.destroyed) {
            void this.poll();
            if (this.access.role === 'student')
                void this.push();
        } }, 5000);
        addEventListener('pagehide', () => { this.cacheStats(); this.flushBeforeExit(); this.stream?.abort(); });
        addEventListener('offline', () => { if (this.access)
            this.error(Error('수업 연결이 끊겼어요. 다시 연결될 때까지 답을 제출하지 않습니다.')); });
        addEventListener('online', () => { if (this.access)
            void this.poll(); });
        document.addEventListener('visibilitychange', () => { if (!this.access)
            return; if (document.visibilityState === 'hidden') {
            this.cacheStats();
            this.flushBeforeExit();
            this.connected = false;
        }
        else {
            this.connected = false;
            void this.poll();
        } });
        try {
            const cached = JSON.parse(deploymentSessionStorage.getItem('cafe-classroom-access') ?? 'null');
            if (cached?.room && cached.credential) {
                this.access = cached;
                void this.poll();
            }
        }
        catch { }
        const query = new URLSearchParams(location.search);
        if (query.get('classroom') === 'student' && !this.access) {
            void this.open('student');
            const input = this.panel.querySelector('#room-number');
            if (input) {
                input.value = query.get('room') ?? '';
                input.dispatchEvent(new Event('input'));
            }
        }
    }
    async api(url, body, key = this.access?.credential ?? '') { const r = await fetch('/api/' + url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: 'Bearer ' + key } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: 'no-store' }); const data = await r.json(); if (!r.ok)
        throw Object.assign(Error(data.error ?? '수업 서버에 연결할 수 없어요.'), { status: r.status }); return data; }
    show(html) { this.panel.hidden = false; this.panel.innerHTML = '<div class="classroom-card"><button id="classroom-back" class="text-button">← 카페로</button>' + html + '<p id="classroom-error" role="status"></p></div>'; this.panel.querySelector('#classroom-back').onclick = () => { if (this.access?.role === 'student' && !this.active) {
        this.error(Error('수업 시작을 기다리거나 방 나가기를 눌러 주세요.'));
        return;
    } this.panel.hidden = true; }; }
    error(e) { this.connected = false; const message = e instanceof Error ? e.message : '연결 상태를 확인해 주세요.'; const target = this.panel.querySelector('#classroom-error'); if (target)
        target.textContent = message; this.status.textContent = '수업 연결 확인 중 · ' + message; this.status.hidden = false; }
    async open(role) {
        if (this.access) {
            this.panel.hidden = false;
            await this.poll();
            return;
        }
        this.destroyed = false;
        if (role === 'student') {
            this.show('<h2>학생 방 입장</h2><form id="classroom-join"><label>방 번호<input id="room-number" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><label>이전 참가자<select id="remembered-student"><option value="">닉네임 입력 또는 복귀 코드</option><option value="new">새 참가자로 입장</option></select></label><label>개인 복귀 코드 (다른 기기에서 돌아올 때)<input id="room-return-code" autocomplete="off" maxlength="12" placeholder="처음 입장할 때 받은 12자리 코드"></label><label>닉네임<input id="room-nickname" maxlength="16" autocomplete="off" required placeholder="실명 대신 별명"></label><button class="primary">입장하기</button></form>');
            const listSaved = () => { const room = this.panel.querySelector('#room-number').value; const select = this.panel.querySelector('#remembered-student'); select.innerHTML = '<option value="">닉네임 입력 또는 복귀 코드</option><option value="new">새 참가자로 입장</option>' + this.remembered().filter(r => r.room === room).map(r => '<option value="' + esc(r.participantId ?? '') + '">' + esc(r.nickname) + ' · ' + esc(r.participantId?.slice(-4) ?? '') + '</option>').join(''); };
            this.panel.querySelector('#room-number').oninput = listSaved;
            this.panel.querySelector('#room-return-code').oninput = () => { this.panel.querySelector('#room-nickname').required = !this.panel.querySelector('#room-return-code').value; };
            this.panel.querySelector('#remembered-student').onchange = e => { this.panel.querySelector('#room-nickname').required = !this.remembered().some(r => r.participantId === e.target.value); };
            listSaved();
            this.panel.querySelector('#classroom-join').onsubmit = async (ev) => { ev.preventDefault(); try {
                const room = this.panel.querySelector('#room-number').value, nickname = this.panel.querySelector('#room-nickname').value, returnCode = this.panel.querySelector('#room-return-code').value, selected = this.panel.querySelector('#remembered-student').value;
                const records = this.remembered().filter(r => r.room === room), chosen = records.find(r => r.participantId === selected), matching = records.filter(r => r.nickname === nickname);
                if (returnCode)
                    this.accept(await this.api('resume', { room, returnCode }));
                else if (chosen || selected !== 'new' && matching.length === 1) {
                    const record = chosen ?? matching[0];
                    this.accept({ ...await this.api('rooms/' + room, undefined, record.credential), credential: record.credential });
                }
                else if (selected !== 'new' && matching.length > 1)
                    throw Error('같은 닉네임의 기록이 여러 개예요. 이전 참가자를 선택하거나 개인 복귀 코드를 입력하세요.');
                else
                    this.accept(await this.api('join', { room, nickname }));
                await this.poll();
            }
            catch (e) {
                this.error(e);
            } };
            return;
        }
        this.show('<h2>교사용 방 만들기</h2><p>교사 노트북에서 localhost 주소로 열어 주세요.</p>');
        try {
            this.admin = (await this.api('bootstrap', {})).admin;
            const packs = await this.api('packs', undefined, this.admin);
            this.show('<h2>교사용 방 만들기</h2><details><summary>이전 수업방 이어보기</summary><input id="host-resume-room" inputmode="numeric" maxlength="6" placeholder="이전 방 번호"><button id="host-resume" type="button" class="secondary">교사 방 복귀</button></details><form id="classroom-create"><label>문제팩<select id="classroom-pack">' + packs.map(p => '<option value="' + esc(p.packId) + '" ' + (p.available ? '' : 'disabled') + '>' + esc(p.title) + (p.available ? '' : ' · 사용 확인 대기') + '</option>').join('') + '</select></label><label>게임 모드<select id="classroom-mode"><option value="classic">기존 수업 게임</option><option value="run">오늘의 카페 · 같은 특성 후보</option></select></label><label>제한시간<select id="classroom-seconds">' + [300, 600, 900, 1200, 1800, 2400, 3600].map(n => '<option value="' + n + '">' + n / 60 + '분</option>').join('') + '</select></label><label class="classroom-check"><input id="pilot-ack" type="checkbox">검토 중인 국어팩의 수업용 사용 안내를 확인했습니다.</label><p>출판사팩은 이번 비공개 수업용 해금 설정이 있는 경우에만 선택할 수 있습니다. 교사 검토와 자료 이용 조건 확인은 별도로 필요합니다.</p><button class="primary">방 만들기</button></form>');
            this.panel.querySelector('#host-resume').onclick = async () => { try {
                this.accept(await this.api('host-resume', { room: this.panel.querySelector('#host-resume-room').value }, this.admin));
                await this.poll();
            }
            catch (e) {
                this.error(e);
            } };
            this.panel.querySelector('#classroom-create').onsubmit = async (ev) => { ev.preventDefault(); const button = this.panel.querySelector('#classroom-create button'); button.disabled = true; try {
                this.accept(await this.api('rooms', { packId: this.panel.querySelector('#classroom-pack').value, mode: this.panel.querySelector('#classroom-mode').value, seconds: Number(this.panel.querySelector('#classroom-seconds').value), pilotAcknowledged: this.panel.querySelector('#pilot-ack').checked }, this.admin));
                await this.poll();
            }
            catch (e) {
                this.error(e);
                button.disabled = false;
            } };
        }
        catch (e) {
            this.error(e);
        }
    }
    accept(data) { this.accessGeneration++; this.access = { room: data.room, credential: data.credential, role: data.role, participantId: data.self?.id }; this.state = data; deploymentSessionStorage.setItem('cafe-classroom-access', JSON.stringify(this.access)); this.destroyed = false; this.seq = data.self?.stats.seq ?? 0; if (data.self)
        this.remember(data.self); }
    async watch() { if (!this.access || this.streamBusy)
        return; this.streamBusy = true; const access = this.access, generation = this.accessGeneration; this.stream = new AbortController(); try {
        const response = await fetch('/api/rooms/' + this.access.room + '/watch', { headers: { Authorization: 'Bearer ' + this.access.credential }, signal: this.stream.signal });
        if (!response.ok || !response.body)
            throw Error('실시간 연결을 다시 확인하고 있어요.');
        const reader = response.body.getReader(), decoder = new TextDecoder();
        let buffer = '';
        while (!this.destroyed && this.access === access && this.accessGeneration === generation) {
            const part = await reader.read();
            if (part.done)
                break;
            buffer += decoder.decode(part.value, { stream: true });
            let index;
            while ((index = buffer.indexOf('\n\n')) >= 0) {
                const event = buffer.slice(0, index);
                buffer = buffer.slice(index + 2);
                if (this.access !== access || this.accessGeneration !== generation)
                    break;
                if (event.startsWith('data: '))
                    await this.receive(JSON.parse(event.slice(6)));
            }
        }
    }
    catch (e) {
        if (!this.destroyed)
            this.error(e);
    }
    finally {
        this.streamBusy = false;
    } }
    async poll() { if (!this.access)
        return; try {
        const access = this.access, generation = this.accessGeneration;
        const room = await this.api('rooms/' + access.room);
        if (this.access !== access || generation !== this.accessGeneration)
            return;
        await this.receive(room);
        void this.watch();
    }
    catch (e) {
        if (e.status === 404 && this.access) {
            const role = this.access.role;
            this.clearAccess();
            await this.open(role);
            this.error(Error('이전 수업방이 만료됐어요. 새 방을 만들거나 새 방 번호로 입장하세요.'));
        }
        else
            this.error(e);
    } }
    async receive(room) {
        if (!this.access || this.access.room !== room.room || this.destroyed)
            return;
        if (this.state?.room === room.room && (room.serverNow < this.state.serverNow || this.state.state === 'ended' && room.state !== 'ended'))
            return;
        this.connected = true;
        this.lastContact = performance.now();
        this.state = room;
        if (room.role === 'teacher') {
            this.teacher(room);
            return;
        }
        const self = room.self;
        const cafe = this.current(), learning = this.metrics();
        if (this.active && cafe && self.stats.attempted > cafe.stats.attempted && learning.normalQuestionsAttempted === 0 && learning.remediationQuestionsAttempted === 0) {
            this.resumeCursor(Math.max(0, self.stats.normal - this.base.normal));
            cafe.stats.attempted = self.stats.attempted;
            cafe.stats.correct = self.stats.correct;
            this.base = { normal: self.stats.normal, remediation: self.stats.remediation, twins: self.stats.twins };
        }
        this.access.participantId = self.id;
        this.remember(self);
        deploymentSessionStorage.setItem('cafe-classroom-access', JSON.stringify(this.access));
        this.seq = Math.max(this.seq, self.stats.seq);
        this.status.hidden = false;
        this.status.innerHTML = '<span>수업방 ' + esc(room.room) + ' · ' + esc(self.nickname) + ' · 연결됨' + (this.localWriteFailed ? ' · 기기 복귀 저장 불가' : '') + '</span> <button type="button" id="classroom-return-info">복귀 / 나가기</button>';
        this.status.querySelector('button').onclick = () => { this.show('<h2>수업방 복귀 정보</h2><p>방 번호 ' + esc(room.room) + '</p><p>개인 복귀 코드</p><p class="personal-return-code">' + esc(self.returnCode ?? '') + '</p><p>같은 기기에서는 이전 참가자를 선택하세요. 다른 기기에서는 방 번호와 개인 코드를 입력하세요. 다른 기기는 학습 집계만 이어지며 카페 자원과 세부 오답 기록은 이전되지 않습니다. 일반 문항은 기존 진행 수를 참고해 건너뜁니다. 수업 종료 시각은 바뀌지 않습니다.</p><button id="classroom-leave" class="secondary">방 나가기</button>'); this.leavingButton(); };
        if (this.active)
            void this.push();
        if (room.state === 'ended') {
            clearTimeout(this.launchTimer);
            if (this.active && !this.finished) {
                this.finished = true;
                delete document.body.dataset.classroomActive;
                this.stop();
                await this.push(true);
            }
            if (!this.active) {
                let restored = false;
                try {
                    const cp = JSON.parse(deploymentLocalStorage.getItem(this.cacheKey('checkpoint')) ?? 'null');
                    restored = this.restoreEnded(cp, self.stats, room);
                }
                catch { }
                if (restored) {
                    this.finished = true;
                    this.panel.hidden = true;
                    return;
                }
            }
            if (!this.active)
                this.show('<h2>수업이 끝났어요</h2><p>' + self.stats.attempted + '문항 · ' + (self.accuracy === null ? '미응시' : self.accuracy + '%') + '</p><button id="classroom-leave" class="primary">방 나가기</button>');
            this.leavingButton();
            return;
        }
        if (self.approved && !this.pack && !this.loading) {
            this.loading = true;
            try {
                const pack = await this.api('rooms/' + room.room + '/pack');
                if (validatePack(pack).length)
                    throw Error('문제팩을 확인해 주세요.');
                this.pack = pack;
                const latest = await this.api('rooms/' + room.room + '/pulse', { ready: true });
                this.loading = false;
                await this.receive(latest);
                return;
            }
            catch (e) {
                this.error(e);
            }
            finally {
                this.loading = false;
            }
        }
        if (room.state === 'running' && !this.active && room.serverNow < room.startAt) {
            clearTimeout(this.launchTimer);
            this.launchTimer = window.setTimeout(() => void this.poll(), room.startAt - room.serverNow + 10);
        }
        if (room.state === 'running' && this.pack && self.approved && self.ready && !this.active && room.serverNow >= room.startAt) {
            const g = createClassMatch(room.seconds, seededRandom('guests:' + room.room));
            if (room.mode === 'run')
                g.enableRun(room.room, 'coffee');
            let checkpoint = null;
            try {
                checkpoint = JSON.parse(deploymentLocalStorage.getItem(this.cacheKey('checkpoint')) ?? 'null');
            }
            catch { }
            if (checkpoint)
                restoreClassroomCafe(g, checkpoint.cafe);
            g.remainingSeconds = Math.max(0, room.seconds - (room.serverNow - room.startAt) / 1000);
            const saved = this.cachedStats();
            const previous = saved && saved.seq > self.stats.seq ? saved : self.stats;
            g.stats.attempted = previous.attempted;
            g.stats.correct = previous.correct;
            this.base = { normal: previous.normal, remediation: previous.remediation, twins: previous.twins };
            this.seq = previous.seq;
            this.active = true;
            document.body.dataset.classroomActive = 'true';
            this.start(g, this.pack.questions, seededRandom('questions:' + room.room + ':' + self.id), { remediationGap: 8, recentWindow: 20, deferExactReviewUntilPoolEnd: true });
            if (checkpoint && this.restoreLearning(checkpoint.learning)) {
                this.base.normal = Math.max(0, previous.normal - this.metrics().normalQuestionsAttempted);
                this.base.remediation = Math.max(0, previous.remediation - this.metrics().remediationQuestionsAttempted);
                this.base.twins = Math.max(0, previous.twins - this.metrics().twinQuestionsGenerated);
            }
            else if (previous.normal > 0)
                this.resumeCursor(previous.normal);
            this.align(room.startAt, room.serverNow);
            this.panel.hidden = true;
            this.lastPush = -8000;
            void this.push();
            return;
        }
        if (this.active) {
            if (room.state === 'running')
                this.align(room.startAt, room.serverNow);
            return;
        }
        const waitingKey = JSON.stringify([room.room, room.state, self.id, self.nickname, self.approved, self.ready, self.returnCode]);
        if (waitingKey === this.waitingKey && !this.panel.hidden && this.panel.querySelector('#classroom-leave'))
            return;
        this.waitingKey = waitingKey;
        this.show('<h2>' + esc(self.nickname) + '</h2><details><summary>나갔다 돌아올 때 쓸 개인 복귀 코드</summary><p class="personal-return-code">' + esc(self.returnCode ?? '') + '</p><p>개인 코드입니다. 다른 학생과 공유하지 마세요. 방 번호만으로는 기록을 가져갈 수 없어요.</p></details><p class="room-code">' + room.room + '</p><p>선생님이 수업을 시작하기를 기다리고 있어요.</p><p>' + (self.approved ? (self.ready ? '입장 승인 · 문제 준비 완료' : '문제를 준비하고 있어요…') : '교사 입장 승인을 기다려 주세요. 확인 번호 ' + esc(self.id.slice(-4))) + '</p><button id="classroom-leave" class="secondary">방 나가기</button>');
        this.leavingButton();
    }
    teacher(room) {
        const key = JSON.stringify({ room: room.room, state: room.state, students: room.students?.map(s => ({ ...s, stats: { ...s.stats, seq: 0 } })), sort: this.sort });
        if (key === this.teacherKey)
            return;
        this.teacherKey = key;
        const confirmBefore = this.panel.querySelector('#classroom-confirm');
        const origins = room.studentUrls?.length ? room.studentUrls : [location.origin];
        if (!origins.includes(this.studentBase))
            this.studentBase = origins[0];
        const students = [...(room.students ?? [])].sort((a, b) => this.sort === 'accuracy' ? (b.accuracy ?? -1) - (a.accuracy ?? -1) : this.sort === 'attempted' ? b.stats.attempted - a.stats.attempted : a.nickname.localeCompare(b.nickname));
        const total = room.total;
        this.show('<h2>교사 ' + (room.state === 'waiting' ? '대기실' : room.state === 'running' ? '실시간 대시보드' : '최종 학습 결과') + '</h2><div class="room-code">' + room.room + '</div><button id="room-copy" class="secondary">방 번호 복사</button><p>학생 접속 주소<select id="student-base">' + origins.map(origin => '<option value="' + esc(origin) + '">' + esc(origin) + '</option>').join('') + '</select><input id="student-link" readonly value="' + esc(this.studentBase + '/?classroom=student&room=' + room.room) + '"></p>' + (!room.studentUrls?.length ? '<p class="classroom-local-only">현재 로컬 검증용입니다. 학생 태블릿에서는 localhost 주소를 사용할 수 없어요. 내부망 실행 안내를 확인해 주세요.</p>' : '<p>학생과 통신할 수 있는 학교 Wi-Fi 주소를 선택해 주세요.</p>') + '<p>' + esc(room.packTitle) + ' · ' + (room.mode === 'run' ? '오늘의 카페' : '기존 수업 게임') + ' · ' + room.seconds / 60 + '분</p><p>접속 ' + total.connected + '명 / 참여 ' + total.students + '명 · 미응시 ' + total.unattempted + '명</p><p>학급 전체 ' + total.attempted + '문항 · 정답 ' + total.correct + '개 · ' + (total.accuracy === null ? '미응시' : total.accuracy + '%') + ' <small>(전체 정답 수 ÷ 전체 풀이 수)</small></p><label>정렬<select id="classroom-sort"><option value="nickname">닉네임</option><option value="accuracy">정답률순</option><option value="attempted">풀이 수순</option></select></label><div class="classroom-students">' + students.map(s => '<article><strong>' + esc(s.nickname) + '</strong><span>' + (!s.approved ? '승인 대기 · 확인 ' + esc(s.id.slice(-4)) : s.connected ? (s.ready ? '접속 · 준비 완료' : '접속 · 준비 중') : '연결 끊김') + '</span><p>풀이 ' + s.stats.attempted + ' · 정답 ' + s.stats.correct + ' · 오답 ' + (s.stats.attempted - s.stats.correct) + ' · ' + (s.accuracy === null ? '미응시' : s.accuracy + '%') + ' · 카페 ' + s.stats.level + '단계</p><small>일반 출제 ' + s.stats.normal + ' / 복습 ' + s.stats.remediation + ' / 쌍둥이 ' + s.stats.twins + ' (복습에 포함)</small>' + (!s.approved ? '<button data-admit="' + s.id + '" class="secondary">입장 승인</button>' : '') + '</article>').join('') + '</div>' + (room.state === 'waiting' ? '<button id="classroom-start" class="primary">수업 시작</button>' : room.state === 'running' ? '<button id="classroom-end" class="primary">수업 종료</button>' : '<p>종료 후 30분에 방 데이터가 만료됩니다. 지금 결과를 저장하세요.</p><button id="classroom-export" class="primary">결과 JSON 저장</button><button id="classroom-leave" class="secondary">방 나가기</button>'));
        this.panel.querySelector('#student-base').value = this.studentBase;
        this.panel.querySelector('#student-base').onchange = e => { this.studentBase = e.target.value; this.panel.querySelector('#student-link').value = this.studentBase + '/?classroom=student&room=' + room.room; };
        if (confirmBefore && room.state === 'running')
            this.panel.querySelector('.classroom-card').append(confirmBefore);
        this.panel.querySelector('#classroom-sort').value = this.sort;
        this.panel.querySelector('#classroom-sort').onchange = e => { this.sort = e.target.value; this.teacher(room); };
        this.panel.querySelector('#room-copy').onclick = async () => { try {
            await navigator.clipboard.writeText(room.room);
        }
        catch {
            const input = document.createElement('input');
            input.value = room.room;
            input.readOnly = true;
            input.setAttribute('aria-label', '복사할 방 번호');
            this.panel.querySelector('.classroom-card').append(input);
            input.select();
        } };
        this.panel.querySelectorAll('[data-admit]').forEach(b => b.onclick = () => { void this.action('admit', { id: b.dataset.admit }); });
        this.panel.querySelector('#classroom-start')?.addEventListener('click', () => { void this.action('start', {}); });
        this.panel.querySelector('#classroom-end')?.addEventListener('click', () => { if (this.panel.querySelector('#classroom-confirm'))
            return; const confirm = document.createElement('div'); confirm.id = 'classroom-confirm'; confirm.innerHTML = '<p>모든 학생의 수업을 마칠까요?</p><button id="classroom-end-yes" class="primary">수업 종료 확인</button>'; this.panel.querySelector('.classroom-card').append(confirm); confirm.querySelector('button').onclick = () => { void this.action('end', {}); }; });
        this.panel.querySelector('#classroom-export')?.addEventListener('click', () => { const blob = new Blob([JSON.stringify(room, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'classroom-' + room.room + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
        this.leavingButton();
    }
    leavingButton() { this.panel.querySelector('#classroom-leave')?.addEventListener('click', () => { this.cacheStats(); void this.push(true); this.accessGeneration++; this.destroyed = true; delete document.body.dataset.classroomActive; this.stream?.abort(); if (this.access?.role === 'student') {
        void this.api('rooms/' + this.access.room + '/pulse', { leaving: true });
        if (this.active && !this.finished)
            this.stop();
    } this.clearAccess(); }); }
    flushBeforeExit() { if (this.access?.role !== 'student' || !this.active)
        return; const access = this.access, stats = this.snapshot(); this.lastPush = performance.now(); if (stats)
        void fetch('/api/rooms/' + access.room + '/pulse', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + access.credential }, body: JSON.stringify({ stats }), keepalive: true }).catch(() => { }); }
    clearAccess() { this.flushBeforeExit(); this.accessGeneration++; this.destroyed = true; delete document.body.dataset.classroomActive; this.stream?.abort(); this.access = null; this.pack = null; this.state = null; this.active = false; this.finished = false; this.finalSent = false; this.seq = 0; this.lastPush = -8000; this.teacherKey = ''; this.waitingKey = ''; deploymentSessionStorage.removeItem('cafe-classroom-access'); this.panel.hidden = true; this.status.hidden = true; }
    leaveFinished() { if (this.access?.role === 'student' && (this.finished || this.state?.state === 'ended' || this.current()?.status === 'CLOSED'))
        this.clearAccess(); }
    async action(action, body) { try {
        await this.receive(await this.api('rooms/' + this.access.room + '/' + action, body));
    }
    catch (e) {
        this.error(e);
    } }
    async material(q, target) { if (!q.material || !this.access)
        return; const m = q.material, box = document.createElement('div'); box.className = 'publisher-material'; box.innerHTML = '<p>' + esc(m.caption) + '</p><label>원문 페이지<select>' + m.assetIds.map((a, i) => '<option value="' + a + '" ' + (i === m.initialPage ? 'selected' : '') + '>' + (i + 1) + '쪽</option>').join('') + '</select></label><button class="secondary">원문 크게 보기</button><div class="publisher-image"><img alt="제공된 평가 PDF 원문"></div>'; target.querySelector('h2').after(box); const image = box.querySelector('img'); const gates = () => [...target.querySelectorAll('input,button[data-answer],form button')]; const lock = () => { target.dataset.materialReady = 'false'; gates().forEach(b => b.disabled = true); }; lock(); let loadVersion = 0; const load = async (asset) => { const version = ++loadVersion; lock(); try {
        let url = this.blobs.get(asset);
        if (!url) {
            const response = await fetch('/api/rooms/' + this.access.room + '/material?asset=' + encodeURIComponent(asset), { headers: { Authorization: 'Bearer ' + this.access.credential } });
            if (!response.ok)
                throw Error('원문 자료를 불러오지 못했어요. 답을 고르기 전에 선생님께 알려주세요.');
            url = URL.createObjectURL(await response.blob());
            this.blobs.set(asset, url);
        }
        if (version !== loadVersion || !target.contains(box))
            return;
        image.src = url;
        await image.decode();
        if (version !== loadVersion || !target.contains(box))
            return;
        target.dataset.materialReady = 'true';
        gates().forEach(b => b.disabled = false);
        const multi = target.querySelector('#publisher-multi');
        if (multi)
            multi.querySelector('button').disabled = multi.querySelectorAll('input:checked').length !== m.selectionCount;
    }
    catch (e) {
        if (version !== loadVersion || !target.contains(box))
            return;
        box.querySelector('p').textContent = '원문 자료를 불러오지 못했어요. 답을 고르기 전에 선생님께 알려주세요.';
        lock();
    } }; box.querySelector('select').onchange = e => void load(e.target.value); box.querySelector('button').onclick = e => { box.classList.toggle('zoomed'); e.currentTarget.textContent = box.classList.contains('zoomed') ? '원문 전체 보기' : '원문 크게 보기'; }; await load(m.assetIds[m.initialPage]); }
    canSubmit() { return !this.access || this.access.role !== 'student' || (this.active && !this.finished && this.state?.state === 'running' && this.connected && performance.now() - this.lastContact < 15000); }
    cacheKey(kind) { return 'cafe-classroom-' + kind + '/' + this.access.room + '/' + this.access.participantId; }
    remembered() { try {
        const records = JSON.parse(deploymentLocalStorage.getItem('cafe-classroom-remembered') ?? '[]');
        if (!Array.isArray(records))
            return [];
        const valid = records.filter(r => r.role === 'student' && typeof r.credential === 'string' && typeof r.nickname === 'string'), live = valid.filter(r => !r.deleteAfter || r.deleteAfter > Date.now());
        for (const r of valid.filter(r => r.deleteAfter && r.deleteAfter <= Date.now()))
            for (const kind of ['stats', 'checkpoint'])
                deploymentLocalStorage.removeItem('cafe-classroom-' + kind + '/' + r.room + '/' + r.participantId);
        if (live.length !== records.length)
            deploymentLocalStorage.setItem('cafe-classroom-remembered', JSON.stringify(live));
        return live;
    }
    catch {
        return [];
    } }
    remember(self) { if (!this.access)
        return; try {
        const records = this.remembered().filter(r => r.credential !== this.access.credential);
        records.unshift({ ...this.access, nickname: self.nickname, returnCode: self.returnCode, updatedAt: Date.now(), deleteAfter: Date.now() + Math.max(0, (this.state?.expiresAt ?? Date.now() + 12 * 3600e3) - (this.state?.serverNow ?? Date.now())) });
        deploymentLocalStorage.setItem('cafe-classroom-remembered', JSON.stringify(records.slice(0, 40)));
    }
    catch { } }
    cachedStats() { try {
        return JSON.parse(deploymentLocalStorage.getItem(this.cacheKey('stats')) ?? 'null');
    }
    catch {
        return null;
    } }
    snapshot() { const g = this.current(); if (!g || !this.active)
        return null; const m = this.metrics(); return { seq: ++this.seq, attempted: g.stats.attempted, correct: g.stats.correct, level: g.cafeLevel, normal: this.base.normal + m.normalQuestionsAttempted, remediation: this.base.remediation + m.remediationQuestionsAttempted, twins: this.base.twins + m.twinQuestionsGenerated }; }
    cacheStats() { try {
        if (!this.access || this.access.role !== 'student' || !this.active)
            return;
        const snapshot = this.snapshot();
        if (snapshot) {
            deploymentLocalStorage.setItem(this.cacheKey('stats'), JSON.stringify(snapshot));
            deploymentLocalStorage.setItem(this.cacheKey('checkpoint'), JSON.stringify({ cafe: classroomCafeCheckpoint(this.current()), learning: this.learningCheckpoint(), stats: snapshot }));
        }
    }
    catch {
        this.localWriteFailed = true;
    } }
    async push(final = false) { if (!this.access || this.access.role !== 'student' || this.finalSent)
        return; if (this.syncing) {
        if (final)
            setTimeout(() => void this.push(true), 200);
        return;
    } if (this.finished)
        final = true; this.syncing = true; try {
        if (!this.active) {
            if (performance.now() - this.lastPush >= 8000) {
                this.lastPush = performance.now();
                await this.api('rooms/' + this.access.room + '/pulse', {});
            }
            return;
        }
        if (!final && performance.now() - this.lastPush < 8000)
            return;
        const stats = this.snapshot();
        if (!stats)
            return;
        this.lastPush = performance.now();
        try {
            deploymentLocalStorage.setItem(this.cacheKey('stats'), JSON.stringify(stats));
            deploymentLocalStorage.setItem(this.cacheKey('checkpoint'), JSON.stringify({ cafe: classroomCafeCheckpoint(this.current()), learning: this.learningCheckpoint(), stats }));
        }
        catch {
            this.localWriteFailed = true;
        }
        await this.api('rooms/' + this.access.room + '/pulse', { stats });
        if (final)
            this.finalSent = true;
    }
    catch (e) {
        this.lastPush = -8000;
        this.error(e);
    }
    finally {
        this.syncing = false;
    } }
}
