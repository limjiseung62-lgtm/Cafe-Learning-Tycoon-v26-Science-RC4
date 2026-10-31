import { unlocked } from './progressiveFeatures.js';
import { educationLevel } from './staffEducation.js';
import { recruitById, recruitConfig } from './recruitConfig.js';
import { hash } from './staffRecruitment.js';
export function validAbilityRun(v) { try {
    const r = v, strings = (a) => Array.isArray(a) && a.length <= 10000 && a.every(x => typeof x === 'string' && x.length <= 400), nums = (x) => !!x && Object.values(x).every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1e7);
    return !!r && r.version === 1 && typeof r.id === 'string' && r.id.length <= 128 && strings(r.seen) && new Set(r.seen).size === r.seen.length && strings(r.fresh) && !!r.couriers && Object.values(r.couriers).every(x => !!recruitById(x)) && nums(r.earned) && Object.keys(r.earned).every(id => !!recruitById(id)) && nums(r.counts) && Object.keys(r.counts).every(k => /^(staff-(?:[1-9]|1[0-2])|prepSaved|prepCredit|prep:\d+|solServed)$/.test(k)) && !!r.menus && Object.entries(r.menus).every(([id, a]) => !!recruitById(id) && strings(a)) && !!r.pending && Object.entries(r.pending).every(([id, a]) => ['staff-6', 'staff-11', 'staff-12'].includes(id) && strings(a)) && Number.isFinite(r.radarAt) && Number.isFinite(r.radarUntil) && typeof r.radarMenu === 'string';
}
catch {
    return false;
} }
export class StaffAbilities {
    g;
    run = null;
    messages = [];
    constructor(g) {
        this.g = g;
    }
    toJSON() { return { run: this.run, messages: this.messages }; }
    start(id) { if (!unlocked(this.g, 'recruitment'))
        return; if (!this.g.roster || this.g.mode !== 'CAFE_GROWTH')
        return; if (this.run?.id === id)
        return; this.run = { version: 1, id, seen: [], couriers: {}, fresh: [], earned: {}, counts: {}, menus: {}, pending: {}, radarAt: -100, radarMenu: '', radarUntil: 0 }; this.g.service.claimDuration = w => this.preparation(w); }
    restore(run) { if (!unlocked(this.g, 'recruitment'))
        return; if (!validAbilityRun(run))
        throw Error('직원 능력 기록 오류'); this.run = structuredClone(run); this.g.service.claimDuration = w => this.preparation(w); }
    once(key) { if (!this.run || this.run.seen.includes(key))
        return false; this.run.seen.push(key); return true; }
    active(id) { return this.g.service.paid.find(w => w.staffId === id); }
    notice(id, text) { const d = recruitById(id); if (!d)
        return; const previous = this.messages.find(m => m.staffId === id); if (previous && previous.until + 3.5 > this.g.elapsedTime)
        return; this.messages = this.messages.filter(m => m.until > this.g.elapsedTime && m.staffId !== id).slice(-1); this.messages.push({ staffId: id, text: text ?? d.feedback + (educationLevel(this.g, id) > 0 ? ' 배운 대로 해냈어요!' : ''), until: this.g.elapsedTime + 1.5 }); }
    credit(id, base, cap) { const r = this.run, n = r.counts[id] ?? 0; if (n >= cap)
        return; r.counts[id] = n + 1; const w = this.active(id); r.earned[id] = (r.earned[id] ?? 0) + Math.round(base * (1 + (w.level - 1) * .1 + educationLevel(this.g, id) * .025)); this.notice(id); }
    roll(key, chance) { return hash(this.run.id + ':' + key) / 2 ** 32 < chance; }
    stamp(id, key, max = 100) { const list = this.run.pending[id] ??= []; if (list.length < max && !list.includes(key)) {
        list.push(key);
        this.notice(id);
    } }
    served(guest, worker) { if (this.run && !worker.owner)
        this.run.couriers[String(guest.id)] = worker.staffId; }
    preparation(w) { if (!this.run || w.staffId !== 'staff-3' || !this.active(w.staffId))
        return .3; const r = this.run, key = 'prep:' + w.orderId; if (r.counts[key])
        return r.counts[key] / 1000; const used = r.counts.prepSaved ?? 0, credit = (r.counts.prepCredit ?? 0) + (used < 3000 ? 20 + w.level * 10 + educationLevel(this.g, w.staffId) * 3 : 0), saved = used < 3000 && credit >= 100 ? 100 : 0, ms = 300 - saved; r.counts.prepCredit = used < 3000 ? credit - saved : 0; r.counts[key] = ms; r.counts.prepSaved = used + saved; if (saved)
        this.notice(w.staffId); return ms / 1000; }
    poll() {
        const g = this.g, r = this.run, roster = g.roster;
        if (!r || !roster || g.mode !== 'CAFE_GROWTH')
            return;
        const known = roster.collections.visitors ??= [];
        for (const guest of g.guests) {
            const identity = guest.signature ? 'judge' : guest.helperType ? 'helper:' + guest.helperType : guest.specialType ? 'special:' + guest.specialType : 'normal:' + guest.definition.visualKey;
            if (this.once('visit:' + guest.id) && !known.includes(identity)) {
                known.push(identity);
                r.fresh.push(String(guest.id));
            }
            if (!guest.paid || !this.once('paid:' + guest.id))
                continue;
            const id = r.couriers[String(guest.id)], w = id ? this.active(id) : undefined;
            if (!w)
                continue;
            if (id === 'staff-1' && this.roll('tip:' + guest.id, .5))
                this.credit(id, 30, 10);
            if (id === 'staff-4' && (guest.specialType || guest.helperType || guest.signature) && this.roll('special:' + guest.id, .3))
                this.credit(id, 80, 3);
            if (id === 'staff-6' && r.fresh.includes(String(guest.id)))
                this.stamp(id, identity);
            if (id === 'staff-7') {
                const menus = r.menus[id] ??= [];
                for (const o of guest.order)
                    if (o.menuId !== 'event-signature' && !menus.includes(o.menuId))
                        menus.push(o.menuId);
                const sets = Math.floor(menus.length / 3);
                while ((r.counts[id] ?? 0) < Math.min(sets, 3))
                    this.credit(id, 50, 3);
            }
            if (id === 'staff-8') {
                r.counts.solServed = (r.counts.solServed ?? 0) + 1;
                if (r.counts.solServed >= [8, 8, 7, 7, 6][w.level - 1])
                    this.credit(id, 100, 1);
            }
            if (id === 'staff-9' && guest.specialType === 'regular')
                this.credit(id, 70, 3);
            if (id === 'staff-10' && guest.order.reduce((n, o) => n + o.quantity, 0) > w.carryCapacity)
                this.credit(id, 40, 5);
            if (id === 'staff-12' && guest.signature)
                this.stamp(id, r.id + ':' + guest.id, 1);
        }
        for (const event of g.events.records) {
            if (event.outcome !== 'success' || !this.once('event:' + event.id))
                continue;
            if (this.active('staff-5'))
                this.credit('staff-5', 50, 4);
            if (this.active('staff-11'))
                this.stamp('staff-11', r.id + ':' + event.id, 1);
        }
        const jun = this.active('staff-2');
        if (jun && g.elapsedTime - r.radarAt >= 22 - jun.level * 2 - educationLevel(g, jun.staffId) * .5) {
            const need = g.guests.filter(x => x.state === 'WAITING_FOR_FOOD').flatMap(x => x.order).find(o => o.menuId !== 'event-signature' && (g.menus.find(m => m.menuId === o.menuId)?.stock ?? 0) < o.quantity);
            if (need) {
                r.radarAt = g.elapsedTime;
                r.radarMenu = need.menuId;
                r.radarUntil = g.elapsedTime + 5;
                this.notice(jun.staffId);
            }
        }
    }
    settle(eligible) {
        const g = this.g, r = this.run, roster = g.roster;
        if (!r || !roster || g.status !== 'CLOSED')
            return null;
        const old = roster.settlements.find(s => s.id === r.id);
        if (old)
            return old;
        const earned = structuredClone(r.earned), raw = Object.values(earned).reduce((a, b) => a + b, 0), total = eligible ? Math.min(raw, Math.floor(g.stats.revenue * recruitConfig.bonusRate), recruitConfig.bonusCap) : 0;
        const receipt = { id: r.id, total, earned };
        roster.settlements.push(receipt);
        if (roster.settlements.length > 1000)
            roster.settlements.shift();
        g.money += total;
        if (eligible)
            for (const [id, keys] of Object.entries(r.pending)) {
                const list = roster.collections[id] ??= [];
                for (const key of keys)
                    if (!list.includes(key) && list.length < 2000)
                        list.push(key);
                const level = roster.owned.find(o => o.id === id)?.level ?? 1, threshold = id === 'staff-6' || id === 'staff-11' ? [5, 5, 4, 4, 3][level - 1] : [3, 3, 2, 2, 1][level - 1], title = recruitById(id).name + '의 ' + recruitById(id).ability;
                if (list.length >= Math.max(1, threshold - (educationLevel(g, id) >= 2 ? 1 : 0)) && !roster.titles.includes(title))
                    roster.titles.push(title);
            }
        return receipt;
    }
}
