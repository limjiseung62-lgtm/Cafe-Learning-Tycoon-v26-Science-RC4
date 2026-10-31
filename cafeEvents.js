import { unlocked } from './progressiveFeatures.js';
import { specializationById } from './specializationConfig.js';
import { eventBalance as b, eventSchedule, allMissionCatalog, incidentCatalog } from './eventConfig.js';
export class CafeEvents {
    enabled = false;
    duration = 0;
    now = 0;
    cursor = 0;
    closed = false;
    records = [];
    active = null;
    arrivals = [];
    lastArrival = -999;
    budgetSpent = 0;
    promotionUntil = 0;
    lastMission;
    lastIncident;
    notice = { text: '', until: 0 };
    enable(duration) { if (this.enabled)
        return; this.enabled = true; this.duration = duration; }
    align(elapsed, g) { if (!Number.isFinite(elapsed))
        return; let left = Math.max(0, Math.min(this.duration, elapsed) - this.now); while (left > 1e-7 && !this.closed) {
        const dt = Math.min(.1, left);
        this.advance(dt, g);
        left -= dt;
    } }
    get budget() { return Math.floor(this.duration / 60 * b.cashPerMinute); }
    scheduleCache = null;
    scheduleDuration = 0;
    get schedule() { if (this.scheduleDuration !== this.duration || !this.scheduleCache) {
        this.scheduleDuration = this.duration;
        this.scheduleCache = eventSchedule(this.duration);
    } return this.scheduleCache; }
    get mission() { return this.active ? allMissionCatalog.find(m => m.id === this.active.type) : null; }
    announce(text) { this.notice = { text, until: this.now + b.noticeSeconds }; }
    arrival(eventId, count, helper) { for (let i = 0; i < count && this.arrivals.length < b.maxQueuedArrivals; i++)
        this.arrivals.push({ eventId, ...helper ? { helper } : {} }); }
    advance(dt, g) { if (!unlocked(g, 'missions'))
        return; if (!this.enabled || this.closed)
        return; this.now = Math.min(this.duration, this.now + dt); if (this.active && g.mode === 'CAFE_GROWTH' && g.management?.run?.special?.eventId === this.active.eventId)
        this.check(g); if (this.active && this.now + 1e-6 >= this.active.deadline)
        this.resolve(false, g); const slots = this.schedule; if (this.cursor < slots.length && this.now + 1e-6 >= slots[this.cursor].at) {
        const slot = slots[this.cursor];
        if (slot.urgent && this.active)
            return;
        this.cursor++;
        if (slot.urgent)
            this.startMission(g);
        else
            this.startIncident(g);
    } if (this.now >= this.duration)
        this.close(); }
    startMission(g) { const themed = g.mode === 'CAFE_GROWTH' && g.specialization && this.cursor % 4 === 1 ? allMissionCatalog.filter(m => 'specialization' in m && m.specialization === g.specialization.selected) : []; if (themed.length) {
        this.beginMission(themed[Math.floor(this.cursor / 4) % themed.length].id, g);
        return;
    } const available = allMissionCatalog.filter(m => !('specialization' in m) && m.unlock <= g.cafeLevel && (m.id !== 'rescue' || g.menus.some(m => m.stock === 0))); const choices = available.filter(m => m.id !== this.lastMission), m = (choices.length ? choices : available)[Math.floor(this.cursor / 2) % (choices.length || available.length)]; this.beginMission(m.id, g); }
    beginMission(type, g) { if (!unlocked(g, 'missions'))
        return false; if (!this.enabled || this.closed || this.active || g.status !== 'RUNNING')
        return false; const m = allMissionCatalog.find(m => m.id === type); if (!m || m.unlock > g.cafeLevel || 'specialization' in m && (g.mode !== 'CAFE_GROWTH' || g.specialization?.selected !== m.specialization))
        return false; const id = this.records.length + 1; this.records.push({ id, kind: 'mission', type, name: m.name, at: this.now, outcome: 'active', reward: 0, giftValue: 0 }); this.active = { eventId: id, type, deadline: Math.min(this.duration, this.now + m.seconds), correct: 0, served: 0, streak: 0, challengeMet: false, servedIds: [], readingIds: [], ...(type === 'rescue' ? { targetMenu: g.menus.find(m => m.stock === 0)?.menuId ?? g.menus[0].menuId } : {}) }; this.lastMission = type; this.arrival(id, m.arrivals, type === 'gourmet' ? 'judge' : undefined); if ('specialization' in m)
        for (const a of this.arrivals)
            if (a.eventId === id)
                a.specialization = m.specialization; this.announce(m.line); return true; }
    startIncident(g) { const available = incidentCatalog.filter(m => m.unlock <= g.cafeLevel), choices = available.filter(m => m.id !== this.lastIncident), m = (choices.length ? choices : available)[Math.floor(this.cursor / 2) % (choices.length || available.length)]; this.beginIncident(m.id, g); }
    beginIncident(type, g) { if (!unlocked(g, 'missions'))
        return false; const m = incidentCatalog.find(m => m.id === type); if (!this.enabled || this.closed || g.status !== 'RUNNING' || !m || m.unlock > g.cafeLevel)
        return false; const id = this.records.length + 1; this.records.push({ id, kind: 'incident', type: m.id, name: m.name, at: this.now, outcome: 'waiting', reward: 0, giftValue: 0 }); this.arrival(id, 1, m.helper); this.lastIncident = m.id; this.announce(m.name + ' · 손님을 대접하면 작은 선물이 있어요.'); return true; }
    takeArrival(g) { if (!unlocked(g, 'missions'))
        return; if (!this.arrivals.length || this.now - this.lastArrival < b.arrivalGap || g.guests.some(g => g.state === 'ENTERING' || this.arrivals[0].helper && g.helperType === this.arrivals[0].helper))
        return; this.lastArrival = this.now; return this.arrivals.shift(); }
    extendReservedBusiness(seconds, ownerAssist = false) { if (this.active)
        this.active.deadline = Math.min(this.duration, this.now + Math.max(0, Math.min(ownerAssist ? 300 : 210, seconds))); }
    questionPresented(id, reading) { if (!this.active || !reading || this.active.readingIds.includes(id) || this.active.readingIds.length >= b.maxReadingExtensions)
        return; this.active.readingIds.push(id); this.active.deadline = Math.min(this.duration, this.active.deadline + b.readingExtraSeconds); this.announce('글을 읽는 시간 ' + b.readingExtraSeconds + '초를 더 드려요. 영업 종료 시각은 같아요.'); }
    answer(correct, g, difficulty = 1) { if (!unlocked(g, 'missions'))
        return; const a = this.active, m = this.mission; if (!a || !m || this.closed || g.status !== 'RUNNING')
        return; if (correct) {
        a.correct++;
        a.streak++;
        if (difficulty >= 2)
            a.challengeMet = true;
    }
    else
        a.streak = 0; this.check(g); }
    served(id, g) { if (!unlocked(g, 'missions'))
        return; if (!this.active || this.active.servedIds.includes(id))
        return; this.active.servedIds.push(id); this.active.served++; this.check(g); }
    check(g) { const a = this.active, m = this.mission; if (!a || !m)
        return; const special = g.mode === 'CAFE_GROWTH' ? g.management?.run?.special : undefined; if (special?.eventId === a.eventId && special.kind !== 'vip' && special.served < (special.ownerAssist || special.kind === 'reservation' ? 1 : 2))
        return; const stock = m.id !== 'rescue' || (g.menus.find(x => x.menuId === a.targetMenu)?.stock ?? 0) > 0; const challenge = m.id !== 'gourmet' || a.challengeMet; if (a.correct >= m.correct && a.served >= (special?.inventory && special.eventId === a.eventId && special.kind !== 'vip' ? (special.ownerAssist || special.kind === 'reservation' ? 1 : 2) : m.served) && a.streak >= m.streak && stock && challenge)
        this.resolve(true, g); }
    rewardPreview(request, kind = 'mission') { const count = this.schedule.filter(x => x.urgent === (kind === 'mission')).length || 1, share = kind === 'mission' ? b.missionBudgetShare : 1 - b.missionBudgetShare, weight = kind === 'mission' ? b.missionWeightBase : b.incidentWeightBase, perEvent = Math.max(1, Math.floor(this.budget * share / count * request / weight)); const futureM = Math.max(0, this.schedule.filter(x => x.urgent).length - this.records.filter(r => r.kind === 'mission').length), futureI = Math.max(0, this.schedule.filter(x => !x.urgent).length - this.records.filter(r => r.kind === 'incident').length), reserve = futureM * b.reservePerMission + futureI * b.reservePerIncident; return Math.min(request, perEvent, Math.max(0, this.budget - this.budgetSpent - reserve)); }
    grant(request, g, kind = 'mission') { const cash = this.rewardPreview(request, kind); this.budgetSpent += cash; g.money += cash; g.stats.revenue += cash; return cash; }
    resolve(success, g) { const a = this.active, m = this.mission; if (!a || !m)
        return; const record = this.records.find(r => r.id === a.eventId); record.outcome = success ? 'success' : 'failed'; record.resolvedAt = this.now; if (a.type === 'gourmet') {
        for (const guest of g.guests.filter(x => x.eventArrival?.eventId === a.eventId && x.signature)) {
            if (success)
                guest.signatureReady = true;
            else {
                guest.abandoned = true;
                guest.state = 'LEAVING';
                guest.elapsed = 0;
                g.customersLeft++;
            }
        }
    } if (success) {
        record.reward = this.grant(m.cash, g);
        if (m.id === 'sns' || m.id === 'team')
            this.promotionUntil = this.now + b.promotionSeconds;
    } if (!success)
        this.arrivals = this.arrivals.filter(x => x.eventId !== a.eventId); this.active = null; this.announce(success ? m.name + ' 성공! ' + record.reward + '원 · ' + (m.id === 'team' ? '잠시 방문 홍보 UP' : '잘 해냈어요!') : m.name + ' 시간 종료 · 벌금 없이 다음 기회에 다시 도전해요.'); }
    paid(guest, g) { if (!guest.eventArrival || !guest.paid || guest.abandoned)
        return; const r = this.records.find(r => r.id === guest.eventArrival.eventId); if (!r || r.kind !== 'incident' || r.outcome !== 'waiting')
        return; const m = incidentCatalog.find(x => x.id === r.type); r.outcome = 'success'; r.resolvedAt = this.now; r.reward = this.grant(m.cash, g, 'incident'); if (m.id === 'supplier' || m.id === 'lucky' && r.id % 2 === 0) {
        const gifts = this.records.filter(x => x.giftValue > 0).length, spent = this.records.reduce((n, r) => n + r.giftValue, 0);
        const cap = gifts < b.giftLimit ? Math.max(0, b.giftValueCap - spent) : 0;
        r.giftValue = g.hospitality.gift(g, cap, 1);
    } if (m.id === 'influencer')
        this.promotionUntil = this.now + b.promotionSeconds; this.announce(m.name + ' · 대접 완료! ' + (r.reward + r.giftValue ? String(r.reward + r.giftValue) + '원 상당의 감사 선물' : '따뜻한 응원을 받았어요.')); }
    close() { if (!this.enabled || this.closed)
        return; this.closed = true; for (const r of this.records)
        if (r.outcome === 'active' || r.outcome === 'waiting') {
            r.outcome = 'cancelled';
            r.resolvedAt = this.now;
        } this.active = null; this.arrivals = []; this.promotionUntil = 0; this.notice = { text: '', until: 0 }; }
    report() { const missions = this.records.filter(r => r.kind === 'mission'), best = [...this.records].sort((a, b) => b.reward + b.giftValue - a.reward - a.giftValue)[0]; return { occurred: this.records.length, missionSuccess: missions.filter(r => r.outcome === 'success').length, missionFailed: missions.filter(r => r.outcome === 'failed').length, missionCancelled: missions.filter(r => r.outcome === 'cancelled').length, specialReward: this.records.filter(r => r.kind === 'incident').reduce((n, r) => n + r.reward + r.giftValue, 0), cashReward: this.records.reduce((n, r) => n + r.reward, 0), giftValue: this.records.reduce((n, r) => n + r.giftValue, 0), budget: this.budget, budgetSpent: this.budgetSpent, best: best && best.reward + best.giftValue ? { name: best.name, value: best.reward + best.giftValue } : null, missions: missions.length }; }
    checkpoint() { return structuredClone({ version: 1, duration: this.duration, now: this.now, cursor: this.cursor, closed: this.closed, records: this.records, active: this.active, arrivals: this.arrivals, lastArrival: this.lastArrival, budgetSpent: this.budgetSpent, promotionUntil: this.promotionUntil, ...this.lastMission ? { lastMission: this.lastMission } : {}, ...this.lastIncident ? { lastIncident: this.lastIncident } : {}, notice: this.notice }); }
    restore(value) { if (!validEventCheckpoint(value))
        return false; const s = structuredClone(value); this.enabled = true; Object.assign(this, s); return true; }
}
export function validEventCheckpoint(value) {
    try {
        const s = value, finite = (n, min = 0, max = 1e7) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
        if (!s || s.version !== 1 || !finite(s.duration, 1, 3600) || !finite(s.now, 0, s.duration) || !Number.isSafeInteger(s.cursor) || s.cursor < 0 || s.cursor > eventSchedule(s.duration).length || typeof s.closed !== 'boolean' || !Array.isArray(s.records) || s.records.length > 40 || !Array.isArray(s.arrivals) || s.arrivals.length > b.maxQueuedArrivals || !finite(s.budgetSpent, 0, Math.floor(s.duration / 60 * b.cashPerMinute)) || !finite(s.promotionUntil) || !finite(s.lastArrival, -999) || typeof s.notice?.text !== 'string' || s.notice.text.length > 500 || !finite(s.notice.until))
            return false;
        const ids = new Set();
        for (const r of s.records) {
            if (!Number.isSafeInteger(r.id) || ids.has(r.id) || r.id < 1 || !['mission', 'incident'].includes(r.kind) || !['active', 'waiting', 'success', 'failed', 'cancelled'].includes(r.outcome) || !finite(r.at, 0, s.now) || !finite(r.reward) || !finite(r.giftValue) || typeof r.name !== 'string' || !([...allMissionCatalog, ...incidentCatalog].some(x => x.id === r.type)))
                return false;
            ids.add(r.id);
        }
        const reservationKeys = s.arrivals.filter(a => a.reservationIndex !== undefined).map(a => a.eventId + ':' + a.reservationIndex);
        if (new Set(reservationKeys).size !== reservationKeys.length)
            return false;
        if (!s.arrivals.every(a => (a.reservationIndex === undefined || Number.isInteger(a.reservationIndex) && a.reservationIndex >= 0 && a.reservationIndex <= 1) && ids.has(a.eventId) && (!a.helper || a.helper === 'judge' || incidentCatalog.some(i => i.helper === a.helper)) && (!a.specialization || specializationById(a.specialization) && s.records.some(r => r.id === a.eventId && r.type.startsWith('spec-' + a.specialization + '-')))))
            return false;
        if (s.active) {
            const a = s.active;
            if (!ids.has(a.eventId) || !allMissionCatalog.some(m => m.id === a.type) || !finite(a.deadline, 0, s.duration) || ![a.correct, a.served, a.streak].every(n => Number.isSafeInteger(n) && n >= 0) || !Array.isArray(a.readingIds) || a.readingIds.length > b.maxReadingExtensions || !a.readingIds.every(id => typeof id === 'string') || !Array.isArray(a.servedIds) || a.servedIds.length > 100 || !a.servedIds.every(Number.isSafeInteger) || typeof a.challengeMet !== 'boolean' || s.closed)
                return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
