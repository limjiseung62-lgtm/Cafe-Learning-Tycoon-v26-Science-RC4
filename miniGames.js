import { unlocked } from './progressiveFeatures.js';
import { desiredVillageMini } from './village.js';
import { newArcade, validArcade, tickArcade, arcadeStats } from './arcadeGames.js';
import { createCraft, validCraft, tickCraft, craftStats } from './craftGames.js';
import { newCakeRush, validCakeRush, validCakeRecords, tickCakeRush, rushStats, closeCakeRush, recordRush } from './cakeRush.js';
import { miniCatalog, miniInfo, miniPolicy } from './miniGameConfig.js';
import { cakeTarget, cakeMatches, cakeTokens } from './miniCake.js';
import { flowerTarget, flowersMatch, flowerTokens } from './miniFlowers.js';
import { ovenPosition, ovenResult } from './miniOven.js';
export const createMiniCollection = () => ({ version: 1, owned: [], practice: [], receipts: [] });
const isKind = (v) => miniCatalog.some(c => c.id === v);
const finite = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const text = (v, max = 180) => typeof v === 'string' && v.length > 0 && v.length <= max;
const unique = (items) => new Set(items).size === items.length;
export function validMiniCollection(v) { try {
    const s = v;
    return !!s && (s.gameSet === undefined || s.gameSet === 6) && (s.arcadeRecords === undefined || Object.entries(s.arcadeRecords).every(([kind, rec]) => ['sort', 'machine', 'tray'].includes(kind) && !!rec && Object.entries(rec).every(([d, n]) => ['easy', 'normal', 'challenge'].includes(d) && finite(n, 0, 12000)))) && (s.craftRecords === undefined || Object.entries(s.craftRecords).every(([kind, rec]) => ['oven', 'flowers'].includes(kind) && !!rec && Object.entries(rec).every(([d, n]) => ['easy', 'normal', 'challenge'].includes(d) && finite(n, 0, 9000)))) && s.version === 1 && (s.cakeRecords === undefined || validCakeRecords(s.cakeRecords)) && Array.isArray(s.owned) && s.owned.length <= 6 && unique(s.owned) && s.owned.every(isKind) && Array.isArray(s.practice) && s.practice.length <= 6 && unique(s.practice) && s.practice.every(isKind) && (s.lastKind === undefined || isKind(s.lastKind)) && Array.isArray(s.receipts) && s.receipts.length <= 300 && unique(s.receipts.map(r => r.id)) && s.receipts.every(r => text(r.id) && text(r.businessId, 128) && isKind(r.kind) && ['success', 'failed', 'skipped'].includes(r.outcome) && finite(r.at));
}
catch {
    return false;
} }
export function validMiniSession(v) {
    try {
        const s = v;
        if (!s || s.version !== 1 || !text(s.businessId, 128) || !text(s.packId, 200) || !Array.isArray(s.offers) || s.offers.length > 3 || !unique(s.offers.map(a => a.id)) || !Array.isArray(s.usedQuestions) || s.usedQuestions.length > 6 || !unique(s.usedQuestions) || !s.usedQuestions.every(q => text(q, 300)))
            return false;
        for (const [i, a] of s.offers.entries()) {
            if (['sort', 'machine', 'tray'].includes(a.kind) && ['playing', 'success', 'failed'].includes(a.phase) && !a.arcade)
                return false;
            if (a.arcade && (!validArcade(a.arcade) || a.arcade.kind !== a.kind || a.craft || a.rush))
                return false;
            if (a.craft && (!validCraft(a.craft) || a.craft.kind !== a.kind))
                return false;
            if (a.rush && (a.kind !== 'cake' || !validCakeRush(a.rush)))
                return false;
            const size = a.kind === 'cake' ? 9 : a.kind === 'flowers' ? 4 : 0, tokens = a.kind === 'cake' ? cakeTokens : flowerTokens;
            if (a.id !== s.businessId + '/mini/' + i || !isKind(a.kind) || i > 0 && a.kind === s.offers[i - 1].kind || !finite(a.offeredAt, 0, 900) || ![1, 2].includes(a.requiredCorrect) || !Array.isArray(a.answers) || a.answers.length > a.requiredCorrect || !unique(a.answers) || !a.answers.every(q => s.usedQuestions.includes(q)) || !Array.isArray(a.target) || !Array.isArray(a.placed) || a.target.length !== size || a.placed.length !== size || ![...a.target, ...a.placed].every(t => t === null || tokens.includes(t)) || !['preparing', 'ready', 'playing', 'success', 'failed', 'skipped'].includes(a.phase) || !Number.isInteger(a.tries) || a.tries < 0 || a.tries > 2)
                return false;
            const expected = a.kind === 'cake' ? cakeTarget(hash(s.businessId + '/' + i)) : a.kind === 'flowers' ? flowerTarget(hash(s.businessId + '/' + i)) : [];
            if (JSON.stringify(a.target) !== JSON.stringify(expected) || a.requiredCorrect !== (i ? 2 : 1))
                return false;
            if (a.lease && (!finite(a.lease.startedAt) || a.lease.deadlineAt - a.lease.startedAt !== (a.rush ? a.rush.duration * 1000 : a.craft || a.arcade ? 45000 : miniPolicy.leaseMs) || a.lease.endedAt !== undefined && !finite(a.lease.endedAt, a.lease.startedAt, a.lease.deadlineAt)))
                return false;
            if (['playing', 'failed', 'success'].includes(a.phase) && (!a.lease || a.tries < 1 || a.answers.length !== a.requiredCorrect))
                return false;
            if (a.arcade && a.lease && a.arcade.startedAt !== a.lease.startedAt)
                return false;
            if (a.rush && a.lease && a.rush.startedAt !== a.lease.startedAt || a.craft && a.lease && a.craft.startedAt !== a.lease.startedAt)
                return false;
            if (a.phase === 'ready' && a.answers.length !== a.requiredCorrect || a.phase === 'preparing' && (a.answers.length >= a.requiredCorrect || a.lease))
                return false;
            if (a.gaugeStartedAt !== undefined && (!a.lease || !finite(a.gaugeStartedAt, a.lease.startedAt, a.lease.deadlineAt)))
                return false;
            if (a.kind === 'oven' && a.lease && a.gaugeStartedAt === undefined || a.ovenStop !== undefined && !finite(a.ovenStop, 0, 100) || a.reason !== undefined && (!text(a.reason, 200)))
                return false;
        }
        if (!unique(s.offers.flatMap(a => a.answers)) || s.usedQuestions.length !== s.offers.reduce((n, a) => n + a.answers.length, 0))
            return false;
        if (s.offers.some(a => a.lease && a.lease.endedAt === undefined && a.id !== s.activeId))
            return false;
        return s.activeId === null || s.offers.some(a => a.id === s.activeId && ['playing', 'success', 'failed'].includes(a.phase));
    }
    catch {
        return false;
    }
}
function hash(value) { let n = 2166136261; for (const c of value)
    n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
export function beginMiniSession(g, businessId, packId) { if (g.mode !== 'CAFE_GROWTH' || !unlocked(g, 'cake'))
    return; g.miniCollection ??= createMiniCollection(); if (!g.miniGames)
    g.miniGames = { version: 1, businessId, packId, offers: [], activeId: null, usedQuestions: [] }; }
export const activeMini = (g) => g.miniGames?.offers.find(a => a.id === g.miniGames.activeId);
export function pauseCredit(s, now) { if (!s)
    return 0; return Math.min(miniPolicy.maxPauseMs, s.offers.reduce((n, a) => n + (a.lease ? Math.max(0, Math.min(a.lease.endedAt ?? now, a.lease.deadlineAt) - a.lease.startedAt) : 0), 0)); }
export function miniPaused(g, now = g.miniNow()) { const a = activeMini(g); return g.mode === 'CAFE_GROWTH' && !!a?.lease && a.lease.endedAt === undefined && now >= a.lease.startedAt && now < a.lease.deadlineAt && ['playing', 'failed'].includes(a.phase); }
function pending(g) { return g.miniGames?.offers.find(a => ['preparing', 'ready'].includes(a.phase)); }
export function offerMini(g, kind, extra = false, allowFirstRepeat = false) {
    const s = g.miniGames;
    if (kind && !unlocked(g, kind))
        return false;
    if (g.mode !== 'CAFE_GROWTH' || !unlocked(g, 'cake') || g.status !== 'RUNNING' || !s || s.activeId || pending(g) || s.offers.length >= 3 || s.offers.length === 2 && !extra)
        return false;
    const seed = hash(s.businessId + '/' + s.offers.length), last = s.offers.at(-1)?.kind ?? g.miniCollection?.lastKind, native = g.branchId === 'garden' ? 'flowers' : g.branchId === 'bakery' ? 'oven' : 'cake', choices = miniCatalog.filter(c => unlocked(g, c.id) && c.id !== last && (g.miniCollection?.gameSet === 6 || ['cake', 'oven', 'flowers'].includes(c.id))), chosen = kind ?? (!s.offers.length && native !== last && unlocked(g, native) ? native : choices[seed % Math.max(1, choices.length)]?.id ?? 'cake');
    if (!isKind(chosen) || chosen === last && !(allowFirstRepeat && !s.offers.length))
        return false;
    const target = chosen === 'cake' ? cakeTarget(seed) : chosen === 'flowers' ? flowerTarget(seed) : [];
    const event = g.events.records.at(-1), guest = g.guests.find(x => event && x.eventArrival?.eventId === event.id) ?? g.guests.find(x => x.signature);
    s.offers.push({ id: s.businessId + '/mini/' + s.offers.length, kind: chosen, ...event ? { sourceEventId: event.id } : {}, ...guest ? { guestId: guest.id } : {}, offeredAt: g.elapsedTime, requiredCorrect: s.offers.length ? 2 : 1, answers: [], target, placed: Array(target.length).fill(null), phase: 'preparing', tries: 0 });
    return true;
}
export function miniAnswer(g, correct, questionId) { const s = g.miniGames, a = pending(g); if (g.mode !== 'CAFE_GROWTH' || g.status !== 'RUNNING' || !s || !a || a.phase !== 'preparing' || !correct || !text(questionId, 300) || s.usedQuestions.includes(questionId))
    return false; s.usedQuestions.push(questionId); a.answers.push(questionId); if (a.answers.length >= a.requiredCorrect)
    a.phase = 'ready'; return true; }
export function startMini(g, id, now = g.miniNow()) { const s = g.miniGames, a = s?.offers.find(a => a.id === id); if (g.mode !== 'CAFE_GROWTH' || a && !unlocked(g, a.kind) || g.status !== 'RUNNING' || !s || s.activeId || !a || a.phase !== 'ready' || !finite(now))
    return false; if (['sort', 'machine', 'tray'].includes(a.kind))
    a.arcade = newArcade(a.kind, a.arcade?.difficulty ?? 'easy', a.arcade?.seed ?? hash(a.id), now); if (a.craft)
    a.craft = createCraft(a.craft.kind, a.craft.difficulty, a.craft.seed, now); if (a.rush)
    a.rush = newCakeRush(a.rush.seed, a.rush.difficulty, now, a.rush.duration); a.phase = 'playing'; a.tries = 1; a.lease = { startedAt: now, deadlineAt: now + (a.rush ? a.rush.duration * 1000 : a.craft || a.arcade ? 45000 : miniPolicy.leaseMs) }; if (a.kind === 'oven')
    a.gaugeStartedAt = now; s.activeId = a.id; g.miniCollection.lastKind = a.kind; return true; }
function receipt(g, a, outcome, now) {
    const bank = g.miniCollection;
    if (!bank || bank.receipts.some(r => r.id === a.id))
        return;
    bank.receipts.push({ id: a.id, businessId: g.miniGames.businessId, kind: a.kind, outcome, at: now });
    bank.receipts = bank.receipts.slice(-300);
    const list = outcome === 'success' ? bank.owned : outcome === 'failed' ? bank.practice : null;
    if (list && !list.includes(a.kind))
        list.push(a.kind);
    if (a.rush && outcome !== 'skipped') {
        bank.cakeRecords ??= {};
        recordRush(bank.cakeRecords, a.rush);
    }
    if (a.arcade && outcome !== 'skipped') {
        const records = bank.arcadeRecords ??= {}, byKind = records[a.arcade.kind] ??= {};
        byKind[a.arcade.difficulty] = Math.max(byKind[a.arcade.difficulty] ?? 0, arcadeStats(a.arcade).score);
    }
    if (a.craft && outcome !== 'skipped') {
        const records = bank.craftRecords ??= {}, byKind = records[a.craft.kind] ??= {};
        byKind[a.craft.difficulty] = Math.max(byKind[a.craft.difficulty] ?? 0, craftStats(a.craft).score);
    }
    const guest = g.guests.find(x => x.id === a.guestId);
    if (guest)
        guest.miniReaction = { success: outcome === 'success', until: g.elapsedTime + 4 };
}
function endLease(a, now) { if (a.lease && a.lease.endedAt === undefined)
    a.lease.endedAt = Math.max(a.lease.startedAt, Math.min(now, a.lease.deadlineAt)); }
export function expireMini(g, now = g.miniNow()) { const a = activeMini(g); if (!a?.lease || a.lease.endedAt !== undefined || now < a.lease.deadlineAt)
    return false; if (a.arcade) {
    tickArcade(a.arcade, now);
    settleArcade(g, a, a.lease.deadlineAt);
    return true;
} if (a.craft) {
    tickCraft(a.craft, now);
    settleCraft(g, a, a.lease.deadlineAt);
    return true;
} if (a.rush) {
    tickCakeRush(a.rush, now);
    settleRush(g, a, a.lease.deadlineAt);
    return true;
} a.phase = 'failed'; a.reason = '시간이 끝났어요. 다음 기회에 다시 해 봐요.'; endLease(a, a.lease.deadlineAt); receipt(g, a, 'failed', a.lease.deadlineAt); return true; }
function playable(g, now) { expireMini(g, now); const a = activeMini(g); return g.mode === 'CAFE_GROWTH' && g.status === 'RUNNING' && a?.phase === 'playing' && a.lease && now < a.lease.deadlineAt ? a : null; }
export function placeMini(g, index, token, now = g.miniNow()) { const a = playable(g, now); if (!a || a.arcade || a.craft || a.rush || a.kind === 'oven' || !Number.isInteger(index) || index < 0 || index >= a.placed.length || token !== null && !(a.kind === 'cake' ? cakeTokens : flowerTokens).includes(token))
    return false; a.placed[index] = token; return true; }
export function finishMini(g, now = g.miniNow()) { const a = playable(g, now); if (!a || a.arcade || a.craft || a.rush)
    return false; let success = false; if (a.kind === 'oven') {
    a.ovenStop = ovenPosition(a.gaugeStartedAt, now);
    const result = ovenResult(a.ovenStop);
    success = result === 'success';
    a.reason = result === 'early' ? '조금 일찍 꺼냈어요.' : result === 'late' ? '너무 늦게 꺼냈어요.' : '딱 알맞게 구웠어요!';
    if (result === 'early')
        a.reason = '조금 일찍 꺼냈어요.';
}
else {
    success = a.kind === 'cake' ? cakeMatches(a.target, a.placed) : flowersMatch(a.target, a.placed);
    a.reason = success ? '목표와 똑같이 완성했어요!' : '그림의 자리와 순서를 다시 살펴봐요.';
} a.phase = success ? 'success' : 'failed'; if (success || a.tries >= miniPolicy.maxTries) {
    endLease(a, now);
    receipt(g, a, success ? 'success' : 'failed', now);
} return true; }
export function retryMini(g, now = g.miniNow()) { expireMini(g, now); const a = activeMini(g); if (g.status !== 'RUNNING' || a?.phase !== 'failed' || a.arcade || a.craft || a.rush || !a.lease || a.lease.endedAt !== undefined || a.tries >= 2 || now >= a.lease.deadlineAt - 1000)
    return false; a.tries++; a.phase = 'playing'; a.reason = undefined; a.placed = Array(a.target.length).fill(null); a.ovenStop = undefined; if (a.kind === 'oven')
    a.gaugeStartedAt = now; return true; }
export function leaveMini(g, now = g.miniNow()) { const s = g.miniGames, a = activeMini(g); if (!s || !a)
    return false; if (a.arcade && a.arcade.endedAt === undefined) {
    a.arcade.endedAt = Math.min(now, a.arcade.startedAt + 45000);
    settleArcade(g, a, now);
} if (a.craft && a.craft.endedAt === undefined) {
    a.craft.endedAt = Math.min(now, a.craft.startedAt + 45000);
    settleCraft(g, a, now);
} if (a.rush && a.rush.endedAt === undefined) {
    closeCakeRush(a.rush, now);
    settleRush(g, a, now);
} if (a.phase !== 'success') {
    a.phase = 'failed';
    endLease(a, now);
    receipt(g, a, 'failed', now);
} s.activeId = null; return true; }
export function skipMini(g, id, now = g.miniNow()) { const a = g.miniGames?.offers.find(a => a.id === id); if (!a || !['preparing', 'ready'].includes(a.phase))
    return false; a.phase = 'skipped'; receipt(g, a, 'skipped', now); return true; }
export function pollMini(g, now = g.miniNow()) { if (!g.miniGames || g.mode !== 'CAFE_GROWTH')
    return; expireMini(g, now); const live = activeMini(g); if (live?.arcade && live.phase === 'playing') {
    tickArcade(live.arcade, now);
    if (live.arcade.endedAt !== undefined)
        settleArcade(g, live, now);
} if (live?.craft && live.phase === 'playing') {
    tickCraft(live.craft, now);
    if (live.craft.endedAt !== undefined)
        settleCraft(g, live, now);
} if (live?.rush && live.phase === 'playing') {
    tickCakeRush(live.rush, now);
    if (live.rush.endedAt !== undefined)
        settleRush(g, live, now);
} if (g.status === 'CLOSED') {
    if (g.miniGames.activeId)
        leaveMini(g, now);
    for (const a of g.miniGames.offers)
        if (['preparing', 'ready'].includes(a.phase))
            skipMini(g, a.id, now);
    return;
} const count = g.miniGames.offers.length; if (count < 2 && g.elapsedTime >= (count ? miniPolicy.secondAt : miniPolicy.firstAt)) {
    if (!offerMini(g, g.lakeMini ?? desiredVillageMini(g.village)))
        offerMini(g);
} }
export function canExtraMini(g) { return g.mode === 'CAFE_GROWTH' && g.status === 'RUNNING' && g.elapsedTime >= miniPolicy.extraAt && g.miniGames?.offers.length === 2 && !g.miniGames.activeId && !pending(g) && g.stats.correct >= 4 && g.events.records.some(r => r.outcome === 'success'); }
export function miniRewardIds(g) { return (g.miniCollection?.owned ?? []).map(k => miniInfo(k).decor); }
function settleRush(g, a, now) { const r = rushStats(a.rush); a.phase = r.exact > 0 ? 'success' : 'failed'; a.reason = r.exact > 0 ? '정확한 주문 ' + r.exact + '개를 완성했어요!' : '다음 주문에서 다시 도전해요.'; endLease(a, now); receipt(g, a, a.phase === 'success' ? 'success' : 'failed', now); }
function settleCraft(g, a, now) { const r = craftStats(a.craft); a.phase = r.exact > 0 ? 'success' : 'failed'; a.reason = '완벽한 주문 ' + r.exact + '개 · ' + r.score + '점'; endLease(a, now); receipt(g, a, a.phase, now); }
function settleArcade(g, a, now) { const r = arcadeStats(a.arcade); a.phase = r.exact ? 'success' : 'failed'; a.reason = '성공 ' + r.exact + '회 · ' + r.score + '점'; endLease(a, now); receipt(g, a, a.phase, now); }
