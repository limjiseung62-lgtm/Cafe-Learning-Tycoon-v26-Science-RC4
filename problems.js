export const testProblems = [
    { problemId: 'm1', subject: '수학', grade: 2, semester: 1, unit: '덧셈', type: 'multiple_choice', difficulty: 1, question: '3 + 4는 얼마일까요?', choices: ['5', '6', '7', '8'], answer: '7', explanation: '3에 4를 더하면 7이에요.' },
    { problemId: 'm2', subject: '수학', grade: 2, semester: 1, unit: '뺄셈', type: 'ox', difficulty: 1, question: '10 − 3 = 7이다.', choices: ['O', 'X'], answer: 'O', explanation: '10에서 3을 빼면 7이 남아요.' },
    { problemId: 'm3', subject: '수학', grade: 2, semester: 1, unit: '덧셈', type: 'short_answer', difficulty: 1, question: '5 + 5의 답을 숫자로 써 주세요.', choices: [], answer: '10', explanation: '5를 두 번 더하면 10이에요.' },
    { problemId: 'm4', subject: '수학', grade: 2, semester: 1, unit: '뺄셈', type: 'multiple_choice', difficulty: 1, question: '8 − 2는 얼마일까요?', choices: ['4', '5', '6', '7'], answer: '6', explanation: '8에서 2를 빼면 6이에요.' },
    { problemId: 'm5', subject: '수학', grade: 2, semester: 1, unit: '덧셈', type: 'ox', difficulty: 1, question: '2 + 2 = 5이다.', choices: ['O', 'X'], answer: 'X', explanation: '2 + 2는 4이므로 X예요.' },
    { problemId: 'm6', subject: '수학', grade: 2, semester: 1, unit: '뺄셈', type: 'short_answer', difficulty: 1, question: '9 − 4의 답을 숫자로 써 주세요.', choices: [], answer: '5', explanation: '9에서 4를 빼면 5예요.' }
];
export class LocalProblemRepository {
    data;
    constructor(data = testProblems) {
        this.data = data;
    }
    list(filter = {}) { return this.data.filter(p => Object.entries(filter).every(([k, v]) => p[k] === v)); }
}
export class ProblemEngine {
    pool;
    random;
    queue = [];
    lastId = '';
    active = null;
    answered = false;
    constructor(pool, random = Math.random) {
        this.pool = pool;
        this.random = random;
        if (!pool.length)
            throw new Error('문제 풀이 비어 있습니다.');
    }
    next() {
        if (!this.queue.length) {
            this.queue = [...this.pool];
            for (let i = this.queue.length - 1; i > 0; i--) {
                const j = Math.floor(this.random() * (i + 1));
                [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
            }
            if (this.queue.length > 1 && this.queue[0].problemId === this.lastId) {
                [this.queue[0], this.queue[1]] = [this.queue[1], this.queue[0]];
            }
        }
        this.active = this.queue.shift();
        this.lastId = this.active.problemId;
        this.answered = false;
        return this.active;
    }
    submit(answer) { if (!this.active || this.answered)
        return null; this.answered = true; const p = this.active; return { correct: answer.trim().normalize('NFKC').toUpperCase() === p.answer.trim().normalize('NFKC').toUpperCase(), answer: p.answer, explanation: p.explanation }; }
}
