import { validManagement } from './managementState.js';
import { validMiniSession, validMiniCollection, pauseCredit, expireMini } from './miniGames.js';
import { validSpecialization } from './specialization.js';
import { validBranch } from "./growthBranch.js";
import { validateGrowthSave } from './growthSave.js';
import { createGrowthSession } from './sessionFactory.js';
import { classroomCafeCheckpoint, restoreCafeCheckpoint } from './classroomCheckpoint.js';
import { LearningSession, LearningProgressRepository } from './learningSession.js';
import { LearningAnalyticsV1 } from './learningAnalytics.js';
import { providerForPool } from './learningIntegration.js';
import { validAbilityRun } from "./staffAbilities.js";
export const withoutCampaign = (save) => { const copy = structuredClone(save); delete copy.campaign; delete copy.eventState; delete copy.portfolio; return copy; };
const goodInt = (n) => Number.isSafeInteger(n) && Number(n) >= 0;
export function validCampaign(value) { try {
    const s = value;
    if (!s || s.version !== 1 || !s.studies || Array.isArray(s.studies) || Object.keys(s.studies).length > 100)
        return false;
    for (const [id, r] of Object.entries(s.studies)) {
        if (!r || !Array.isArray(r.recent) || r.recent.length > 5 || !r.recent.every(x => typeof x === 'boolean') || ![r.level, r.attempted, r.correct, r.reviewCorrect].every(goodInt) || r.level < 1 || r.level > 3 || r.correct > r.attempted || !Array.isArray(r.seen) || r.seen.length > 2000 || !r.seen.every(x => typeof x === 'string'))
            return false;
        if (r.objectives && Object.values(r.objectives).some(o => ![o.attempted, o.correct, o.reviewCorrect].every(goodInt) || o.correct > o.attempted || o.reviewCorrect > o.correct))
            return false;
        const p = new LearningProgressRepository({ getItem: () => JSON.stringify(r.progress), setItem() { } }).read(id);
        if (!p)
            return false;
    }
    if (s.history && (!Array.isArray(s.history) || s.history.length > 100 || new Set(s.history.map(h => h.id)).size !== s.history.length || s.history.some(h => h.cafeId !== undefined && !['cafe-1', 'cafe-2'].includes(h.cafeId) || typeof h.id !== 'string' || typeof h.packId !== 'string' || ![h.endedAt, h.levelBefore, h.levelAfter, h.revenue, h.staff, h.menus, h.warehouse].every(goodInt))))
        return false;
    const r = s.run;
    if (r && (r.management !== undefined && !validManagement(r.management) || r.miniCollection !== undefined && !validMiniCollection(r.miniCollection) || r.miniGames !== undefined && (!validMiniSession(r.miniGames) || r.miniGames.businessId !== r.id || r.miniGames.packId !== r.packId || r.miniGames.offers.some(a => a.lease && (a.lease.startedAt < r.startAt || a.lease.startedAt > r.endAt + 150000))) || r.specialization !== undefined && !validSpecialization(r.specialization) || r.abilityRun !== undefined && (!validAbilityRun(r.abilityRun) || r.abilityRun.id !== r.id) || r.growthBranch !== undefined && !validBranch(r.growthBranch) || typeof r.id !== 'string' || !r.id || typeof r.packId !== 'string' || !r.packId || r.elapsed !== undefined && (!Number.isFinite(r.elapsed) || r.elapsed < 0 || r.elapsed > 900) || typeof r.closed !== 'boolean' || !Number.isFinite(r.startAt) || r.startAt < 0 || r.endAt - r.startAt !== 900000 || !r.base || r.base.campaign || !validateGrowthSave(r.base) || !r.phase4 || !r.hospitality || !r.cafe || !r.learning || r.learning.session.packId !== r.packId || !Array.isArray(r.learning.readVisits)))
        return false;
    return JSON.stringify(s).length < 3000000;
}
catch {
    return false;
} }
/** Pure difficulty decision. Speed never changes learning level or rewards. */
export function adaptiveLevel(elapsed, record) { const recent = record.recent.slice(-5), rate = recent.filter(Boolean).length / Math.max(1, recent.length); let level = record.level; if (recent.length >= 2 && recent.slice(-2).every(x => !x))
    level--;
else if (recent.length === 5 && rate >= .8)
    level++; const ceiling = elapsed < 180 ? Math.max(1, record.level - 1) : elapsed < 660 ? Math.min(3, record.level + 1) : 3; return Math.max(1, Math.min(ceiling, level, 3)); }
export function restoreGrowthRun(run, pool, now = Date.now()) { const g = createGrowthSession(run.base, Math.random, 900); g.management = structuredClone(run.management ?? run.base.management); g.miniGames = structuredClone(run.miniGames); g.miniCollection = structuredClone(run.miniCollection ?? run.base.miniCollection); g.specialization = structuredClone(run.specialization ?? run.base.specialization); g.growthBranch = structuredClone(run.growthBranch ?? run.base.growthBranch); g.service.workers.splice(1); g.enableEvents(); if (!restoreCafeCheckpoint(g, run.cafe))
    throw Error('중단한 카페 상태를 확인해 주세요. 원본은 보존됩니다.'); g.enableHallGrowth(); if (run.workers) {
    const ids = g.service.workers.map(w => w.staffId);
    if (!Array.isArray(run.workers) || run.workers.length !== ids.length)
        throw Error('직원 복원 오류');
    for (const [i, w] of run.workers.entries()) {
        if (w.staffId !== ids[i] || w.level !== g.service.workers[i].level || !['IDLE', 'CLAIMING_ORDER', 'MOVING_TO_PICKUP', 'PICKING_UP', 'MOVING_TO_TABLE', 'SERVING', 'RETURNING'].includes(w.state) || !Number.isFinite(w.elapsed) || w.elapsed < 0 || !w.position || ![w.position.x, w.position.y].every(Number.isFinite) || ![w.cargo, w.remaining].every(items => Array.isArray(items) && items.length <= 100 && items.every(id => g.menus.some(m => m.menuId === id) || id === 'event-signature')) || w.orderId !== null && !g.guests.some(x => x.id === w.orderId && ['PREPARING', 'SERVING'].includes(x.state)))
            throw Error('직원 상태 오류');
        Object.assign(g.service.workers[i], { position: { ...w.position }, state: w.state, cargo: [...w.cargo], remaining: [...w.remaining], orderId: w.orderId, elapsed: w.elapsed });
    }
    for (const guest of g.guests)
        if (run.cafe.guests?.find(x => x.id === guest.id)?.state === 'SERVING')
            guest.state = 'SERVING';
} if (run.abilityRun)
    g.staffAbilities.restore(run.abilityRun); const learning = new LearningSession(providerForPool(pool)); const analytics = new LearningAnalyticsV1(run.packId); if (!learning.restoreCheckpoint(run.learning.session) || !analytics.restore(run.learning.analytics))
    throw Error('학습 기록 복원 실패 · 기존 저장은 보존됩니다.'); const finiteTree = (value) => typeof value === 'number' ? Number.isFinite(value) && value >= 0 : typeof value === 'string' || typeof value === 'boolean' || value === null || typeof value === 'object' && Object.values(value).every(finiteTree); if (!run.phase4 || !finiteTree(run.phase4) || Object.entries(g.telemetry.phase4).some(([key, value]) => typeof run.phase4[key] !== typeof value || Array.isArray(value) !== Array.isArray(run.phase4[key])))
    throw Error('매출 이력 복원 오류'); Object.assign(g.telemetry.phase4, structuredClone(run.phase4)); for (const [key, value] of Object.entries(run.hospitality)) {
    const original = g.hospitality[key];
    if (key === 'paid' && (!Array.isArray(value) || !value.every(goodInt)) || key !== 'paid' && (!Object.hasOwn(g.hospitality, key) || typeof value !== typeof original || Array.isArray(value) !== Array.isArray(original) || typeof value === 'number' && !Number.isFinite(value)))
        throw Error('손님 이력 복원 오류');
    if (key === 'paid' && Array.isArray(value))
        g.hospitality.paid = new Set(value);
    else if (Object.hasOwn(g.hospitality, key) && key !== 'questions')
        Object.assign(g.hospitality, { [key]: value });
} g.remainingSeconds = run.closed ? Math.max(0, 900 - (run.elapsed ?? 900)) : Math.max(0, Math.min(900 - (run.elapsed ?? 0), (run.endAt + pauseCredit(g.miniGames, now) - now) / 1000)); expireMini(g, now); if (!run.closed && g.remainingSeconds > 0)
    g.events.align(g.elapsedTime, g); if (run.closed || g.remainingSeconds === 0)
    g.endBusiness(); const specialAttempt = run.learning.specialAttempt ?? null; if (specialAttempt !== null && !g.guests.some(x => x.id === specialAttempt && x.signature))
    throw Error('특별 주문 연결 오류'); return { game: g, learning, analytics, readVisits: [...run.learning.readVisits], specialAttempt }; }
export function captureRun(g, base, run, learning, analytics, visits, specialAttempt) { const hospitality = JSON.parse(JSON.stringify({ ...g.hospitality, paid: [...g.hospitality.paid], lastHelper: Number.isFinite(g.hospitality.lastHelper) ? g.hospitality.lastHelper : -100000, lastSpecial: Number.isFinite(g.hospitality.lastSpecial) ? g.hospitality.lastSpecial : -100000 })); return { ...run, ...g.management ? { management: structuredClone(g.management) } : {}, ...g.miniGames ? { miniGames: structuredClone(g.miniGames) } : {}, ...g.miniCollection ? { miniCollection: structuredClone(g.miniCollection) } : {}, ...g.specialization ? { specialization: structuredClone(g.specialization) } : {}, ...g.staffAbilities.run ? { abilityRun: structuredClone(g.staffAbilities.run) } : {}, elapsed: g.elapsedTime, closed: g.status === 'CLOSED', ...g.growthBranch ? { growthBranch: structuredClone(g.growthBranch) } : {}, base: withoutCampaign(base), cafe: classroomCafeCheckpoint(g), learning: { session: learning.checkpoint(), analytics: analytics.checkpoint(), readVisits: visits, specialAttempt }, workers: structuredClone(g.service.workers), phase4: structuredClone(g.telemetry.phase4), hospitality }; }
export function studyRecord(learning, previous) { const attempts = learning.attempts, all = [...(previous?.recent ?? []), ...attempts.map(a => a.correct)].slice(-5); const level = adaptiveLevel(900, { level: previous?.level ?? 1, recent: all }); const objectives = structuredClone(previous?.objectives ?? {}); for (const a of attempts) {
    const o = objectives[a.skillId] ?? { attempted: 0, correct: 0, reviewCorrect: 0 };
    o.attempted++;
    if (a.correct)
        o.correct++;
    if (a.correct && a.isRemediation)
        o.reviewCorrect++;
    Object.defineProperty(objectives, a.skillId, { value: o, writable: true, configurable: true, enumerable: true });
} return { objectives, progress: structuredClone(learning.progress), recent: all, level, attempted: (previous?.attempted ?? 0) + attempts.length, correct: (previous?.correct ?? 0) + attempts.filter(a => a.correct).length, reviewCorrect: (previous?.reviewCorrect ?? 0) + attempts.filter(a => a.correct && a.isRemediation).length, seen: [...new Set([...(previous?.seen ?? []), ...attempts.map(a => a.questionId)])].slice(-2000) }; }
