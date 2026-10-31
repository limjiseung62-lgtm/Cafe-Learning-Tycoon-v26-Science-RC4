import { growthEconomyConfig as c } from './growthEconomyConfig.js';
export function economyState(save) { if (save.growthEconomy)
    return structuredClone(save.growthEconomy); const run = save.campaign?.run; return { version: 1, milestones: [7, 11].filter(n => n <= save.cafeLevel), reviewRoots: [], receipts: run?.closed ? [{ id: run.id, completion: 0, mission: 0, review: 0, milestone: 0, total: 0, unique: 0, correct: 0, reviewRoots: [], eligible: false, reason: 'legacy' }] : [] }; }
export function validGrowthEconomy(value) { try {
    const v = value;
    const num = (n) => Number.isSafeInteger(n) && Number(n) >= 0;
    return !!v && v.version === 1 && Array.isArray(v.milestones) && new Set(v.milestones).size === v.milestones.length && v.milestones.every(n => n === 7 || n === 11) && Array.isArray(v.reviewRoots) && v.reviewRoots.length <= 2000 && new Set(v.reviewRoots).size === v.reviewRoots.length && v.reviewRoots.every(s => typeof s === 'string' && s.length <= 400) && Array.isArray(v.receipts) && v.receipts.length <= 1000 && new Set(v.receipts.map(r => r.id)).size === v.receipts.length && v.receipts.every(r => typeof r.id === 'string' && r.id.length > 0 && r.id.length <= 128 && [r.completion, r.mission, r.review, r.milestone, r.total, r.unique, r.correct].every(num) && r.total === r.completion + r.mission + r.review + r.milestone && typeof r.eligible === 'boolean' && Array.isArray(r.reviewRoots) && r.reviewRoots.length <= c.reviewLimit && r.reviewRoots.every(s => v.reviewRoots.includes(s)));
}
catch {
    return false;
} }
/** One atomic settlement receipt per closed business. Never counted as sales or a correct answer. */
export function settleGrowthEconomy(g, state, id, packId, attempts, previous, long) {
    if (g.mode !== 'CAFE_GROWTH' || g.status !== 'CLOSED')
        return null;
    const old = state.receipts.find(r => r.id === id);
    if (old)
        return old;
    const root = (a) => a.sourceQuestionId ?? a.questionId;
    const unique = new Set(attempts.map(root)).size, correct = new Set(attempts.filter(a => a.correct).map(root)).size;
    const eligible = g.elapsedTime >= c.minimumSeconds && unique >= c.minimumUnique && correct >= c.minimumCorrect;
    const receipt = { id, completion: 0, mission: 0, review: 0, milestone: 0, total: 0, unique, correct, reviewRoots: [], eligible };
    if (eligible) {
        receipt.completion = c.completionBase + g.cafeLevel * c.completionPerLevel;
        const board = long?.boards.find(b => b.businessId === id);
        if (board?.complete)
            receipt.mission = c.missionBase + g.cafeLevel * c.missionPerLevel;
        const wrong = new Set(Object.values(previous?.progress.questions ?? {}).filter(m => m.wrongCount > 0 && m.priority > 0).map(m => m.questionId));
        for (const a of attempts) {
            const source = root(a), key = packId + '::' + source;
            if (!a.correct)
                wrong.add(source);
            if (a.correct && a.isRemediation && wrong.has(source) && !state.reviewRoots.includes(key) && receipt.reviewRoots.length < c.reviewLimit && state.reviewRoots.length < 2000) {
                state.reviewRoots.push(key);
                receipt.reviewRoots.push(key);
                receipt.review += c.reviewBase + g.cafeLevel * c.reviewPerLevel;
            }
        }
        for (const level of [7, 11])
            if (g.cafeLevel >= level && !state.milestones.includes(level)) {
                state.milestones.push(level);
                receipt.milestone += c.milestones[level];
            }
    }
    receipt.total = receipt.completion + receipt.mission + receipt.review + receipt.milestone;
    g.money += receipt.total;
    state.receipts.push(receipt);
    state.receipts = state.receipts.slice(-1000);
    return receipt;
}
