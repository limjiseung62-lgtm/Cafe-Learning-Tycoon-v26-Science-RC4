import { safeDiagram } from './questionRenderer.js';
export const analyticsConfig = { minimumObjectiveAttempts: 5, strongAccuracy: 80, practiceAccuracy: 60, maxDetailedAttempts: 10000, maxAnswersPerWrong: 20 };
export const emptyCounts = () => ({ attempted: 0, correct: 0 });
export const accuracy = (c) => c.attempted ? Math.round(c.correct / c.attempted * 1000) / 10 : null;
export const percentage = (c) => accuracy(c) === null ? '미응시' : accuracy(c) + '%';
export function objectiveFeedback(c) { if (c.attempted < analyticsConfig.minimumObjectiveAttempts)
    return '학습 기록이 더 필요해요'; return accuracy(c) >= analyticsConfig.strongAccuracy ? '잘 이해하고 있어요!' : accuracy(c) < analyticsConfig.practiceAccuracy ? '조금 더 연습해 봐요.' : '배운 내용을 한 번 더 살펴봐요.'; }
export class LearningAnalyticsV1 {
    questionPackId;
    spacedReview;
    schemaVersion = 1;
    packName = '';
    sequence = 0;
    ids = new Set();
    seen = new Set();
    counts = emptyCounts();
    kinds = { first: emptyCounts(), repeat: emptyCounts(), remediation: emptyCounts(), twin: emptyCounts() };
    objectives = new Map();
    wrong = new Map();
    successes = new Map();
    events = [];
    constructor(questionPackId) {
        this.questionPackId = questionPackId;
    }
    record(question, submittedAnswer, isCorrect, flags = {}, eventId, timestamp = new Date().toISOString()) {
        if (question.questionPackId !== this.questionPackId || !question.questionId || !question.learningObjective.id || typeof submittedAnswer !== 'string' || !Number.isFinite(Date.parse(timestamp)))
            throw Error('Invalid analytics event');
        const id = eventId ?? 'local-' + (++this.sequence);
        if (this.ids.has(id))
            return false;
        this.ids.add(id);
        if (this.ids.size > analyticsConfig.maxDetailedAttempts)
            this.ids.delete(this.ids.values().next().value);
        const type = flags.isTwin ? 'twin' : flags.isRemediation ? 'remediation' : this.seen.has(question.questionId) ? 'repeat' : 'first';
        this.seen.add(question.questionId);
        const increment = (c) => { c.attempted++; if (isCorrect)
            c.correct++; };
        increment(this.counts);
        increment(this.kinds[type]);
        let objective = this.objectives.get(question.learningObjective.id);
        if (!objective) {
            objective = { ...question.learningObjective, total: emptyCounts(), first: emptyCounts() };
            this.objectives.set(objective.id, objective);
        }
        increment(objective.total);
        if (type === 'first')
            increment(objective.first);
        const origin = flags.sourceQuestionId ?? question.questionId;
        if (isCorrect && (type === 'twin' || type === 'remediation')) {
            const success = this.successes.get(origin) ?? { twin: 0, review: 0 };
            success.review++;
            if (type === 'twin')
                success.twin++;
            this.successes.set(origin, success);
            const w = this.wrong.get(origin);
            if (w) {
                w.reviewSuccess = success.review;
                w.twinSuccess = success.twin;
            }
        }
        if (!isCorrect) {
            let w = this.wrong.get(question.questionId);
            if (!w) {
                const success = this.successes.get(question.questionId) ?? { twin: 0, review: 0 };
                w = { question: structuredClone(question), count: 0, answers: [], omittedAnswers: 0, twinSuccess: success.twin, reviewSuccess: success.review };
                this.wrong.set(question.questionId, w);
            }
            w.count++;
            if (w.answers.length >= analyticsConfig.maxAnswersPerWrong) {
                w.answers.shift();
                w.omittedAnswers++;
            }
            w.answers.push(submittedAnswer);
        }
        const event = { questionPackId: this.questionPackId, questionId: question.questionId, learningObjective: { ...question.learningObjective }, questionType: question.questionType, isCorrect, attemptType: type, timestamp, submittedAnswer, ...(flags.sourceQuestionId ? { sourceQuestionId: flags.sourceQuestionId } : {}), remediationOutcome: type === 'twin' || type === 'remediation' ? (isCorrect ? 'success' : 'retry') : null };
        if (this.events.length < analyticsConfig.maxDetailedAttempts)
            this.events.push(event);
        return true;
    }
    report() { return { schemaVersion: 1, questionPackId: this.questionPackId, packName: this.packName, ...this.spacedReview ? { spacedReview: structuredClone(this.spacedReview) } : {}, total: { ...this.counts }, byType: structuredClone(this.kinds), objectives: [...this.objectives.values()].map(o => ({ ...structuredClone(o), accuracy: accuracy(o.total), feedback: objectiveFeedback(o.first) })), wrong: [...this.wrong.values()].map(w => structuredClone(w)), detailedAttempts: this.events.length, detailLimitReached: this.counts.attempted > this.events.length, remediationOutcome: { success: this.kinds.remediation.correct + this.kinds.twin.correct, twinSuccess: this.kinds.twin.correct } }; }
    exportSummary() { const { wrong, ...safe } = this.report(); return { ...safe, wrongQuestionCount: wrong.length, rawAnswersIncluded: false }; }
    checkpoint() { return { schemaVersion: 1, questionPackId: this.questionPackId, packName: this.packName, sequence: this.sequence, ids: [...this.ids], seen: [...this.seen], counts: this.counts, kinds: this.kinds, objectives: [...this.objectives], wrong: [...this.wrong], successes: [...this.successes], events: this.events }; }
    restore(value) { try {
        const s = value;
        const valid = (c) => c && Number.isSafeInteger(c.attempted) && Number.isSafeInteger(c.correct) && c.correct >= 0 && c.attempted >= c.correct;
        if (!s || s.schemaVersion !== 1 || s.questionPackId !== this.questionPackId || !valid(s.counts) || !Object.keys(this.kinds).every(k => valid(s.kinds[k])) || Object.values(s.kinds).reduce((n, c) => n + c.attempted, 0) !== s.counts.attempted || Object.values(s.kinds).reduce((n, c) => n + c.correct, 0) !== s.counts.correct || !Array.isArray(s.events) || s.events.length > analyticsConfig.maxDetailedAttempts || !Array.isArray(s.ids) || s.ids.length > analyticsConfig.maxDetailedAttempts || !s.ids.every(x => typeof x === 'string') || !Array.isArray(s.seen) || !s.seen.every(x => typeof x === 'string') || !Array.isArray(s.wrong) || s.wrong.length > 2000 || !Array.isArray(s.objectives) || s.objectives.length > 1000 || !s.objectives.every(([id, o]) => typeof id === 'string' && typeof o.label === 'string' && valid(o.total) && valid(o.first)) || !s.wrong.every(([id, w]) => typeof id === 'string' && w.question?.questionPackId === this.questionPackId && typeof w.question.question === 'string' && typeof w.question.answer === 'string' && typeof w.question.explanation === 'string' && typeof w.question.learningObjective?.id === 'string' && typeof w.question.learningObjective?.label === 'string' && typeof w.question.restricted === 'boolean' && (w.question.passage === undefined || typeof w.question.passage === 'string') && (w.question.diagram === undefined || typeof w.question.diagram === 'string' && safeDiagram(w.question.diagram)) && (w.question.choices === undefined || Array.isArray(w.question.choices) && w.question.choices.every(c => typeof c === 'string')) && [w.omittedAnswers, w.twinSuccess, w.reviewSuccess].every(n => Number.isSafeInteger(n) && n >= 0) && Number.isSafeInteger(w.count) && w.count > 0 && Array.isArray(w.answers) && w.answers.length <= 20 && w.answers.every(a => typeof a === 'string')) || !Array.isArray(s.successes) || s.successes.length > 2000 || !s.successes.every(([id, v]) => typeof id === 'string' && v && Number.isSafeInteger(v.review) && Number.isSafeInteger(v.twin) && v.review >= v.twin && v.twin >= 0) || !Number.isSafeInteger(s.sequence) || s.sequence < 0)
            return false;
        this.sequence = s.sequence;
        this.ids = new Set(s.ids);
        this.seen = new Set(s.seen);
        this.counts = structuredClone(s.counts);
        this.kinds = structuredClone(s.kinds);
        this.objectives = new Map(structuredClone(s.objectives));
        this.wrong = new Map(structuredClone(s.wrong));
        this.successes = new Map(structuredClone(s.successes));
        this.events = structuredClone(s.events);
        this.packName = typeof s.packName === 'string' ? s.packName : '';
        return true;
    }
    catch {
        return false;
    } }
}
