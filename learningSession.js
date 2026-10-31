import { gradeAnswer } from './reading.js';
import { normalizeAnswer } from './questionPack.js';
export const learningConfig = { remediationGap: 3, recentWindow: 3, maxQueue: 32 };
export function validSpaced(s) { const x = s, n = (v) => Number.isSafeInteger(v) && Number(v) >= 0, str = (v) => typeof v === "string" && v.length > 0 && v.length <= 256, ids = (v) => Array.isArray(v) && v.length <= 5000 && new Set(v).size === v.length && v.every(str); return !!x && x.version === 1 && str(x.signature) && !!x.uses && !Array.isArray(x.uses) && Object.keys(x.uses).length <= 5000 && Object.entries(x.uses).every(([k, v]) => str(k) && n(v)) && ids(x.encountered) && ids(x.mastered) && !!x.first && !Array.isArray(x.first) && Object.keys(x.first).length <= 5000 && Object.entries(x.first).every(([k, v]) => str(k) && typeof v === "boolean") && [x.review, x.mastery].every(c => !!c && n(c.attempted) && n(c.correct) && c.correct <= c.attempted) && [x.production, x.shortages, x.delayed].every(n) && Array.isArray(x.jobs) && x.jobs.length <= 5000 && new Set(x.jobs.map(j => j.root)).size === x.jobs.length && x.jobs.every(j => str(j.root) && ["review", "mastery"].includes(j.phase) && n(j.count) && n(j.gap) && j.gap <= 10 && ids(j.used) && n(j.failures)); }
export class LearningSession {
    provider;
    random;
    clock;
    options;
    pool;
    reserved = new Set();
    visit = 0;
    recentGroups = [];
    queue = [];
    remediation = [];
    recent = [];
    active = null;
    answered = true;
    lastRemediation = false;
    progress;
    attempts = [];
    metrics = { questionPackId: '', normalQuestionsAttempted: 0, remediationQuestionsAttempted: 0, twinQuestionsGenerated: 0, twinQuestionsCorrect: 0, remediationQuestionsCorrect: 0 };
    constructor(provider, random = Math.random, progress, clock = () => new Date().toISOString(), options = {}) {
        this.provider = provider;
        this.random = random;
        this.clock = clock;
        this.options = options;
        this.pool = provider.list();
        if (!this.pool.length)
            throw Error('Empty question pack');
        this.progress = progress ? structuredClone(progress) : { schemaVersion: 1, packId: provider.packId, updatedAt: this.clock(), questions: {}, skills: {} };
        if (this.progress.packId !== provider.packId)
            throw Error('Learning progress pack mismatch');
        this.metrics.questionPackId = provider.packId;
        if (this.pool[0].spacedReview) {
            const policy = this.pool[0].spacedReview, signature = this.pool[0].packVersion + '@' + this.pool[0].manifestHash;
            const old = this.progress.spaced;
            if (old && (!validSpaced(old) || old.signature !== signature || [...Object.keys(old.uses), ...old.jobs.flatMap(j => [j.root, ...j.used])].some(id => !this.pool.some(q => q.questionId === id))))
                throw Error('복습 저장 버전/문항을 확인해 주세요.');
            this.progress.spaced = { version: 1, signature, uses: { ...old?.uses }, encountered: [], jobs: structuredClone(old?.jobs ?? []), mastered: [...old?.mastered ?? []], first: {}, review: { attempted: 0, correct: 0 }, mastery: { attempted: 0, correct: 0 }, production: 0, shortages: 0, delayed: 0 };
        }
        for (const memory of Object.values(this.progress.questions).filter(m => m.priority > 0).sort((a, b) => b.priority - a.priority).slice(0, learningConfig.maxQueue)) {
            const source = this.pool.find(q => q.questionId === memory.questionId);
            if (source)
                this.remediation.push({ source, due: this.options.remediationGap ?? learningConfig.remediationGap });
        }
    }
    setDifficulty(get) { this.options.difficulty = get; }
    // Only explicit numeric difficulty metadata defines stages; grouped reading retains passage order.
    get progressive() { return !this.pool.some(q => q.readingContext) && this.pool.every(q => Number.isInteger(q.difficulty) && q.difficulty >= 1); }
    // Explicit gourmet challenges and scheduled remediation keep their existing educational policies.
    orderQueue() { if (this.progressive)
        this.queue.sort((a, b) => a.difficulty - b.difficulty); }
    present(questionId, eligibleIds) { if (this.progress.spaced)
        return this.next(); if (this.active && !this.answered)
        return null; let q = this.pool.find(q => q.questionId === questionId); if (!q)
        return null; if (this.options.deferExactReviewUntilPoolEnd && eligibleIds?.length) {
        const seen = new Set(this.attempts.map(a => a.questionId));
        q = this.pool.find(p => eligibleIds.includes(p.questionId) && !seen.has(p.questionId)) ?? q;
    } if (this.options.deferExactReviewUntilPoolEnd && !q.readingContext) {
        this.reserved.add(q.questionId);
        this.queue = this.queue.filter(p => p.questionId !== q.questionId);
    } this.active = structuredClone({ ...q, isRemediation: false, isTwin: false }); this.answered = false; this.lastRemediation = false; this.recent.push(q.questionId); if (this.recent.length > (this.options.recentWindow ?? learningConfig.recentWindow))
        this.recent.shift(); return this.active; }
    next(preference) {
        if (this.progress.spaced)
            return this.nextSpaced();
        if (this.active && !this.answered)
            return this.active;
        let q;
        const grouped = !!this.pool[0].readingContext;
        const boundary = !grouped || !this.queue.length || this.queue[0].readingContext?.position === 1;
        const due = boundary ? this.remediation.findIndex(r => r.due <= this.metrics.normalQuestionsAttempted) : -1;
        const pendingTwin = due >= 0 ? this.provider.twin(this.remediation[due].source) : null;
        const hasDifferentTwin = !!pendingTwin && pendingTwin.prompt !== this.remediation[due].source.prompt && !this.recent.includes(pendingTwin.questionId);
        if (due >= 0 && !this.lastRemediation && (!this.options.deferExactReviewUntilPoolEnd || !this.queue.length || hasDifferentTwin)) {
            const item = this.remediation.splice(due, 1)[0];
            let twin = pendingTwin;
            if (twin && twin.prompt !== item.source.prompt && !this.recent.includes(twin.questionId)) {
                q = { ...twin, isTwin: true, isRemediation: true, sourceQuestionId: item.source.questionId };
                this.metrics.twinQuestionsGenerated++;
            }
            else {
                const other = this.pool.find(q => q.skillId === item.source.skillId && (!grouped || q.readingContext?.passageId === item.source.readingContext?.passageId) && q.questionId !== item.source.questionId && !this.recent.includes(q.questionId));
                q = { ...(other ?? item.source), isRemediation: true, isTwin: false, sourceQuestionId: item.source.questionId };
            }
        }
        if (!q) {
            if (!this.queue.length) {
                if (grouped) {
                    const groups = [...new Set(this.pool.map(q => q.readingContext.groupId))];
                    for (let i = groups.length - 1; i > 0; i--) {
                        const j = Math.floor(this.random() * (i + 1));
                        [groups[i], groups[j]] = [groups[j], groups[i]];
                    }
                    let previous = [...this.recentGroups];
                    const order = [];
                    while (groups.length) {
                        let index = groups.findIndex(id => !previous.includes(id));
                        if (index < 0)
                            index = 0;
                        const id = groups.splice(index, 1)[0];
                        order.push(id);
                        previous = [...previous, id].slice(-2);
                    }
                    this.queue = order.flatMap(id => this.pool.filter(q => q.readingContext.groupId === id).sort((a, b) => a.readingContext.position - b.readingContext.position));
                }
                else {
                    this.queue = [...this.pool];
                    for (let i = this.queue.length - 1; i > 0; i--) {
                        const j = Math.floor(this.random() * (i + 1));
                        [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
                    }
                }
            }
            if (this.reserved.size && !grouped) {
                const fresh = this.queue.filter(p => !this.reserved.has(p.questionId));
                if (fresh.length)
                    this.queue = fresh;
                this.reserved.clear();
            }
            this.orderQueue();
            const target = this.options.difficulty?.();
            const stage = this.progressive && target !== undefined ? this.queue.reduce((best, q) => Math.abs(q.difficulty - target) < Math.abs(best - target) ? q.difficulty : best, this.queue[0].difficulty) : this.progressive && preference !== 'challenge' ? this.queue[0].difficulty : undefined;
            const inStage = (x) => stage === undefined || x.difficulty === stage;
            const seenBefore = new Set(this.options.seenIds ?? []);
            const freshStage = this.queue.some(x => inStage(x) && !seenBefore.has(x.questionId));
            let index = grouped ? 0 : this.queue.findIndex(x => inStage(x) && (!freshStage || !seenBefore.has(x.questionId)) && !this.recent.includes(x.questionId) && x.questionId !== this.active?.questionId && (!preference || (preference === 'challenge' ? x.difficulty >= 2 : !x.readingContext && !x.prompt.includes('\n'))));
            if (index < 0)
                index = this.queue.findIndex(x => inStage(x) && x.questionId !== this.active?.questionId);
            if (index < 0)
                index = 0;
            q = { ...this.queue.splice(index, 1)[0], isRemediation: false, isTwin: false };
        }
        if (q.readingContext) {
            if (q.isRemediation || q.readingContext.position === 1)
                this.visit++;
            q = { ...q, readingContext: { ...q.readingContext, visit: this.visit } };
            if (!q.isRemediation && q.readingContext.position === 1)
                this.recentGroups = [...this.recentGroups, q.readingContext.groupId].slice(-2);
        }
        this.active = structuredClone(q);
        this.answered = false;
        this.lastRemediation = q.isRemediation === true;
        this.recent.push(q.questionId);
        if (this.recent.length > (this.options.recentWindow ?? learningConfig.recentWindow))
            this.recent.shift();
        return this.active;
    }
    submit(answer) { const q = this.active; if (!q || this.answered)
        return null; this.answered = true; const correct = gradeAnswer(q, answer, normalizeAnswer); if (this.progress.spaced)
        return this.submitSpaced(q, correct); if (q.isRemediation)
        this.metrics.remediationQuestionsAttempted++;
    else
        this.metrics.normalQuestionsAttempted++; if (q.isRemediation && correct)
        this.metrics.remediationQuestionsCorrect++; if (q.isTwin && correct)
        this.metrics.twinQuestionsCorrect++; const origin = q.sourceQuestionId ?? q.questionId; const source = this.pool.find(p => p.questionId === origin) ?? q; let memory = Object.hasOwn(this.progress.questions, origin) ? this.progress.questions[origin] : undefined; const skill = Object.hasOwn(this.progress.skills, q.skillId) ? this.progress.skills[q.skillId] : { wrongCount: 0, remediationAttempts: 0, remediationSuccess: 0, priority: 0 }; if (!Object.hasOwn(this.progress.skills, q.skillId))
        Object.defineProperty(this.progress.skills, q.skillId, { value: skill, writable: true, enumerable: true, configurable: true }); if (!correct) {
        memory ??= { questionId: origin, skillId: q.skillId, tags: q.tags, wrongCount: 0, lastWrongAt: this.clock(), remediationAttempts: 0, remediationSuccess: 0, priority: 0 };
        memory.wrongCount++;
        memory.lastWrongAt = this.clock();
        memory.priority++;
        skill.wrongCount++;
        skill.priority++;
        Object.defineProperty(this.progress.questions, origin, { value: memory, writable: true, enumerable: true, configurable: true });
        if (!this.remediation.some(r => r.source.questionId === origin)) {
            if (this.remediation.length >= learningConfig.maxQueue)
                this.remediation.shift();
            this.remediation.push({ source, due: this.metrics.normalQuestionsAttempted + (this.options.remediationGap ?? learningConfig.remediationGap) });
        }
    } if (q.isRemediation) {
        if (memory) {
            memory.remediationAttempts++;
            if (correct) {
                memory.remediationSuccess++;
                memory.priority = Math.max(0, memory.priority - 1);
            }
        }
        skill.remediationAttempts++;
        if (correct) {
            skill.remediationSuccess++;
            skill.priority = Math.max(0, skill.priority - 1);
        }
    } if (q.isRemediation && correct && memory && memory.priority > 0 && !this.remediation.some(r => r.source.questionId === origin))
        this.remediation.push({ source, due: this.metrics.normalQuestionsAttempted + (this.options.remediationGap ?? learningConfig.remediationGap) }); this.attempts.push({ questionId: q.questionId, skillId: q.skillId, correct, isRemediation: !!q.isRemediation, isTwin: !!q.isTwin, sourceQuestionId: q.sourceQuestionId, answeredAt: this.clock() }); if (this.attempts.length > 1000)
        this.attempts.shift(); this.progress.updatedAt = this.clock(); return { correct, answer: q.answer, correctAnswer: q.answer, explanation: q.explanation, questionId: q.questionId, skillId: q.skillId, isRemediation: q.isRemediation === true, isTwin: q.isTwin === true, sourceQuestionId: q.sourceQuestionId }; }
    nextSpaced() {
        if (this.active && !this.answered)
            return this.active;
        const s = this.progress.spaced, last = this.active?.questionId;
        let selected;
        let job;
        let source;
        const pending = [...s.jobs].filter(j => j.count >= j.gap).sort((a, b) => (b.count - b.gap) - (a.count - a.gap) || b.failures - a.failures);
        for (const j of pending) {
            const root = this.pool.find(q => q.questionId === j.root);
            const ids = j.phase === 'review' ? root.reviewVariantIds : root.masteryVariantIds;
            let candidates = this.pool.filter(q => ids?.includes(q.questionId) && q.skillId === root.skillId && !j.used.includes(q.questionId) && q.questionId !== last && (j.phase === 'mastery' || q.difficulty === root.difficulty));
            if (!candidates.length && j.phase === 'review') {
                candidates = this.pool.filter(q => ids?.includes(q.questionId) && q.skillId === root.skillId && q.difficulty === root.difficulty && q.questionId !== last && q.questionId !== j.used.at(-1) && !this.recent.includes(q.questionId));
                if (candidates.length) {
                    j.used = [...new Set([j.root, j.used.at(-1)])];
                    s.shortages++;
                }
            }
            candidates.sort((a, b) => (s.uses[a.questionId] ?? 0) - (s.uses[b.questionId] ?? 0));
            selected = candidates.find(q => !this.recent.includes(q.questionId)) ?? candidates[0];
            if (selected) {
                job = j;
                source = j.root;
                s.jobs = s.jobs.filter(x => x.root !== j.root);
                if (j.count > j.gap + (j.phase === 'review' ? 2 : 4))
                    s.delayed++;
                break;
            }
        }
        if (!selected) {
            const available = this.pool.filter(q => q.questionId !== last || this.pool.length === 1);
            const skills = Object.fromEntries([...new Set(this.pool.map(q => q.skillId))].map(id => [id, this.pool.filter(q => q.skillId === id).reduce((sum, q) => sum + (s.uses[q.questionId] ?? 0), 0)]));
            available.sort((a, b) => Number(!!s.uses[a.questionId]) - Number(!!s.uses[b.questionId]) || (s.uses[a.questionId] ?? 0) - (s.uses[b.questionId] ?? 0) || skills[a.skillId] - skills[b.skillId] || Math.abs(a.difficulty - (this.options.difficulty?.() ?? a.difficulty)) - Math.abs(b.difficulty - (this.options.difficulty?.() ?? b.difficulty)));
            selected = available.find(q => !this.recent.includes(q.questionId)) ?? available[0];
            if (!selected)
                throw Error('복습 후보가 없어요.');
            if (pending.length)
                s.shortages++;
        }
        const phase = job?.phase ?? (s.encountered.includes(selected.questionId) ? 'practice' : 'initial');
        this.active = structuredClone({ ...selected, learningPhase: phase, isRemediation: phase === 'review' || phase === 'mastery', isTwin: phase === 'review', sourceQuestionId: source });
        if (job)
            this.active.reviewJob = job;
        this.answered = false;
        this.lastRemediation = !!job;
        this.recent.push(selected.questionId);
        this.recent = this.recent.slice(-3);
        return this.active;
    }
    submitSpaced(q, correct) {
        const s = this.progress.spaced, phase = q.learningPhase ?? 'practice', job = q.reviewJob;
        for (const j of s.jobs)
            if (!j.used.includes(q.questionId))
                j.count++;
        const origin = q.sourceQuestionId ?? q.questionId, root = this.pool.find(p => p.questionId === origin);
        const used = [...new Set([...(job?.used ?? [origin]), q.questionId])];
        s.uses[q.questionId] = (s.uses[q.questionId] ?? 0) + 1;
        if (!s.encountered.includes(q.questionId))
            s.encountered.push(q.questionId);
        if (phase === 'initial')
            s.first[q.questionId] = correct;
        else if (phase === 'review' || phase === 'mastery') {
            s[phase].attempted++;
            if (correct)
                s[phase].correct++;
        }
        const produce = correct;
        if (produce)
            s.production++;
        const existing = s.jobs.find(j => j.root === origin);
        if (!correct || phase === 'review' && correct) {
            if (!correct)
                s.mastered = s.mastered.filter(id => id !== root.skillId);
            const nextPhase = correct ? 'mastery' : 'review';
            const gap = Math.min(nextPhase === 'review' ? 3 : 6, Math.max(1, this.pool.length - used.length));
            if (!existing)
                s.jobs.push({ root: origin, phase: nextPhase, count: 0, gap, used, failures: (job?.failures ?? 0) + (correct ? 0 : 1) });
            if (gap < (nextPhase === 'review' ? 3 : 6))
                s.shortages++;
        }
        else if (phase === 'mastery' && correct && !s.mastered.includes(root.skillId) && !s.jobs.some(j => this.pool.find(p => p.questionId === j.root)?.skillId === root.skillId))
            s.mastered.push(root.skillId);
        if (phase === 'initial')
            this.metrics.normalQuestionsAttempted++;
        else {
            this.metrics.remediationQuestionsAttempted++;
            if (correct)
                this.metrics.remediationQuestionsCorrect++;
        }
        if (phase === 'review') {
            this.metrics.twinQuestionsGenerated++;
            if (correct)
                this.metrics.twinQuestionsCorrect++;
        }
        const skill = this.progress.skills[q.skillId] ??= { wrongCount: 0, remediationAttempts: 0, remediationSuccess: 0, priority: 0 };
        if (!correct) {
            skill.wrongCount++;
            skill.priority++;
            const m = this.progress.questions[origin] ??= { questionId: origin, skillId: q.skillId, tags: q.tags, wrongCount: 0, lastWrongAt: this.clock(), remediationAttempts: 0, remediationSuccess: 0, priority: 0 };
            m.wrongCount++;
            m.priority++;
            m.lastWrongAt = this.clock();
        }
        if (phase !== 'initial') {
            skill.remediationAttempts++;
            if (correct) {
                skill.remediationSuccess++;
                skill.priority = Math.max(0, skill.priority - 1);
            }
            const m = this.progress.questions[origin];
            if (m) {
                m.remediationAttempts++;
                if (correct) {
                    m.remediationSuccess++;
                    m.priority = Math.max(0, m.priority - 1);
                }
            }
        }
        this.attempts.push({ questionId: q.questionId, skillId: q.skillId, correct, isRemediation: phase === 'review' || phase === 'mastery', isTwin: phase === 'review', sourceQuestionId: q.sourceQuestionId, answeredAt: this.clock() });
        if (this.attempts.length > 1000)
            this.attempts.shift();
        this.progress.updatedAt = this.clock();
        return { correct, answer: q.answer, correctAnswer: q.answer, explanation: q.explanation, questionId: q.questionId, skillId: q.skillId, isRemediation: phase === 'review' || phase === 'mastery', isTwin: phase === 'review', sourceQuestionId: q.sourceQuestionId, productionAllowed: produce, learningPhase: phase, hint: !correct && phase !== 'initial' ? q.conceptHint : undefined };
    }
    spacedReport() { const s = this.progress.spaced; if (!s)
        return; return { packVersion: this.pool[0].packVersion, manifestHash: this.pool[0].manifestHash, labels: Object.fromEntries(this.pool.map(q => [q.skillId, q.conceptHint ?? q.tags[0] ?? q.skillId])), first: { attempted: Object.keys(s.first).length, correct: Object.values(s.first).filter(Boolean).length }, review: { ...s.review }, mastery: { ...s.mastery }, production: s.production, pending: s.jobs.length, shortages: s.shortages, delayed: s.delayed, mastered: [...s.mastered], needsReview: [...new Set(s.jobs.map(j => this.pool.find(q => q.questionId === j.root).skillId))], pendingJobs: structuredClone(s.jobs), policy: this.pool[0].spacedReview.foodPolicy, scope: "presentation" }; }
    resumeNormalCursor(count) { if (!Number.isSafeInteger(count) || count < 0 || count > 10000 || (this.active && !this.answered) || this.attempts.length || this.metrics.normalQuestionsAttempted || this.remediation.length)
        return false; for (let i = 0; i < count; i++) {
        const q = this.next();
        if (q.isRemediation)
            return false;
        this.answered = true;
    } return true; }
    checkpoint() { const ref = (q) => ({ questionId: q.questionId, isRemediation: !!q.isRemediation, isTwin: !!q.isTwin, sourceQuestionId: q.sourceQuestionId, visit: q.readingContext?.visit, ...q.learningPhase ? { learningPhase: q.learningPhase, reviewJob: q.reviewJob } : {} }); return { version: 1, packId: this.provider.packId, reserved: [...this.reserved], queue: this.queue.map(ref), remediation: this.remediation.map(r => ({ questionId: r.source.questionId, due: r.due })), recent: [...this.recent], recentGroups: [...this.recentGroups], visit: this.visit, active: this.active ? ref(this.active) : null, answered: this.answered, lastRemediation: this.lastRemediation, progress: structuredClone(this.progress), metrics: { ...this.metrics }, attempts: structuredClone(this.attempts) }; }
    restoreCheckpoint(value) { try {
        const s = value;
        if (!s || !!this.pool[0].spacedReview !== !!s.progress?.spaced)
            return false;
        if (s.progress?.spaced) {
            const x = s.progress.spaced;
            if (!validSpaced(x) || x.signature !== this.pool[0].packVersion + '@' + this.pool[0].manifestHash || [...Object.keys(x.uses), ...x.encountered, ...Object.keys(x.first), ...x.jobs.flatMap(j => [j.root, ...j.used])].some(id => !this.pool.some(q => q.questionId === id)) || x.mastered.some(id => !this.pool.some(q => q.skillId === id)))
                return false;
        }
        if (!s || s.version !== 1 || s.packId !== this.provider.packId || s.progress?.packId !== s.packId || !Array.isArray(s.queue) || s.queue.length > this.pool.length || !Array.isArray(s.remediation) || s.remediation.length > 32 || !Array.isArray(s.recent) || !Array.isArray(s.recentGroups) || !Array.isArray(s.attempts) || s.attempts.length > 1000 || !Number.isSafeInteger(s.visit) || s.visit < 0 || typeof s.answered !== 'boolean' || typeof s.lastRemediation !== 'boolean' || Object.entries(s.metrics).some(([k, v]) => k !== 'questionPackId' && (!Number.isSafeInteger(v) || Number(v) < 0)))
            return false;
        if (!new LearningProgressRepository({ getItem: () => JSON.stringify(s.progress), setItem: () => { } }).read(s.packId) || s.metrics.questionPackId !== s.packId || !Object.keys(this.metrics).every(k => Object.hasOwn(s.metrics, k)) || !s.recent.every(id => typeof id === 'string') || !s.recentGroups.every(id => typeof id === 'string'))
            return false;
        const hydrate = (r) => { if (typeof r.isRemediation !== 'boolean' || typeof r.isTwin !== 'boolean' || r.visit !== undefined && (!Number.isSafeInteger(r.visit) || r.visit < 0))
            throw Error('invalid question state'); const source = this.pool.find(q => q.questionId === r.questionId) ?? this.pool.find(q => q.twin?.questionId === r.questionId)?.twin; if (!source)
            throw Error('unknown question'); const q = structuredClone(source); if (r.learningPhase) {
            if (!['initial', 'practice', 'review', 'mastery'].includes(r.learningPhase))
                throw Error('invalid phase');
            q.learningPhase = r.learningPhase;
            if (r.reviewJob) {
                if (r.reviewJob.root !== r.sourceQuestionId || r.reviewJob.phase !== r.learningPhase)
                    throw Error('invalid review origin');
                if (!validSpaced({ ...s.progress.spaced, jobs: [r.reviewJob] }))
                    throw Error('invalid review chain');
                q.reviewJob = structuredClone(r.reviewJob);
            }
        } q.isRemediation = r.isRemediation; q.isTwin = r.isTwin; q.sourceQuestionId = r.sourceQuestionId; if (q.readingContext)
            q.readingContext.visit = r.visit; return q; };
        const queue = s.queue.map(hydrate), active = s.active ? hydrate(s.active) : null, remediation = s.remediation.map(r => { const source = this.pool.find(q => q.questionId === r.questionId); if (!source || !Number.isSafeInteger(r.due) || r.due < 0)
            throw Error('invalid review'); return { source, due: r.due }; });
        if (s.reserved !== undefined && (!Array.isArray(s.reserved) || !s.reserved.every(id => this.pool.some(q => q.questionId === id))))
            return false;
        this.reserved = new Set(s.reserved ?? []);
        this.queue = queue;
        this.orderQueue();
        this.active = active;
        this.remediation = remediation;
        this.recent = [...s.recent];
        this.recentGroups = [...s.recentGroups];
        this.visit = s.visit;
        this.answered = s.answered;
        this.lastRemediation = s.lastRemediation;
        Object.assign(this.progress, structuredClone(s.progress));
        Object.assign(this.metrics, s.metrics);
        this.attempts.splice(0, this.attempts.length, ...structuredClone(s.attempts));
        return true;
    }
    catch {
        return false;
    } }
    report() { return { ...this.metrics, attempts: structuredClone(this.attempts), wrongSkills: Object.entries(this.progress.skills).filter(([, v]) => v.wrongCount > 0).map(([skillId, v]) => ({ skillId, ...v })), remediationSuccessRate: this.metrics.remediationQuestionsAttempted ? this.metrics.remediationQuestionsCorrect / this.metrics.remediationQuestionsAttempted : 0 }; }
}
export class LearningProgressRepository {
    storage;
    prefix;
    constructor(storage = null, prefix = 'cafe-learning-tycoon.learning.v1/') {
        this.storage = storage;
        this.prefix = prefix;
    }
    read(packId) { try {
        const p = JSON.parse(this.storage?.getItem(this.prefix + packId) ?? 'null');
        if (!p || p.schemaVersion !== 1 || p.packId !== packId || typeof p.questions !== 'object' || typeof p.skills !== 'object' || !p.questions || !p.skills || Array.isArray(p.questions) || Array.isArray(p.skills) || !Number.isFinite(Date.parse(p.updatedAt)))
            return;
        const valid = (v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
        for (const [id, m] of Object.entries(p.questions)) {
            if (m.questionId !== id || typeof m.skillId !== 'string' || !Array.isArray(m.tags) || !m.tags.every(t => typeof t === 'string') || !Number.isFinite(Date.parse(m.lastWrongAt)) || ![m.wrongCount, m.remediationAttempts, m.remediationSuccess, m.priority].every(valid) || m.remediationSuccess > m.remediationAttempts)
                return;
        }
        for (const s of Object.values(p.skills)) {
            if (![s.wrongCount, s.remediationAttempts, s.remediationSuccess, s.priority].every(valid) || s.remediationSuccess > s.remediationAttempts)
                return;
        }
        if (p.spaced && !validSpaced(p.spaced))
            return;
        return p;
    }
    catch {
        return;
    } }
    write(progress) { try {
        this.storage?.setItem(this.prefix + progress.packId, JSON.stringify(progress));
        return this.storage !== null;
    }
    catch {
        return false;
    } }
}
