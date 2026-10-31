import { settleFranchises } from './progressiveEconomy.js';
import { syncManagementAlbum } from './managementAlbum.js';
import { startManagement, settleManagement } from './managementEngine.js';
import { syncSharedFurniture } from './cafePortfolio.js';
import { syncLake, desiredLakeMini } from './lakeDistrict.js';
import { syncVillage, villageMetrics } from './village.js';
import { beginMiniSession, pauseCredit, pollMini } from './miniGames.js';
import { captureRoster } from "./staffRecruitment.js";
import { economyState, settleGrowthEconomy } from './growthEconomy.js';
import { longStateFor } from './longGrowthUi.js';
import { createGrowthSession, setGrowthExpected, growthBaseFor } from './sessionFactory.js';
import { restoreGrowthRun, captureRun, studyRecord, adaptiveLevel } from './growthCampaign.js';
import { LearningSession } from './learningSession.js';
import { providerForPool } from './learningIntegration.js';
class GrowthRuntime {
    grants = null;
    anchorPause = 0;
    anchorMono = 0;
    anchorElapsed = 0;
    pending = new WeakMap();
    current = null;
    initial = { version: 1, studies: {} };
    meta = null;
    state = null;
    create(save, pool, fresh = false, businessId) { const run = fresh ? undefined : save.campaign?.run; if (run) {
        const restored = restoreGrowthRun(run, pool);
        restored.game.progressiveState = structuredClone(save.v26);
        restored.game.growthCafeId = save.portfolio?.activeCafeId ?? 'cafe-1';
        restored.game.lakeMini = desiredLakeMini(save);
        restored.game.village = structuredClone(save.village);
        if (run.closed) {
            restored.game.management = structuredClone(save.management);
            restored.game.miniCollection = structuredClone(save.miniCollection);
            restored.game.specialization = structuredClone(save.specialization);
            restored.game.layouts = structuredClone(save.layouts);
            restored.game.freeLayouts = structuredClone(save.freeLayouts);
        }
        if (run.closed && save.roster) {
            restored.game.roster = structuredClone(save.roster);
            restored.game.money = save.money;
        }
        setGrowthExpected(restored.game, save);
        this.pending.set(restored.game, { save, state: { engine: restored.learning, analytics: restored.analytics, readVisits: restored.readVisits, specialAttempt: restored.specialAttempt } });
        return restored.game;
    } const clean = structuredClone(save); delete clean.eventState; const g = createGrowthSession(clean, Math.random, 900); setGrowthExpected(g, save); const copy = structuredClone(save); if (copy.campaign)
        delete copy.campaign.run; this.pending.set(g, { save: copy, businessId }); return g; }
    begin(g, pool, fallback, getState) { if (g.mode !== 'CAFE_GROWTH') {
        this.current = null;
        this.meta = null;
        return fallback;
    } const pending = this.pending.get(g); const save = pending?.save ?? growthBaseFor(g); this.grants = save ? economyState(save) : null; this.current = g; this.anchorMono = performance.now(); this.anchorElapsed = g.elapsedTime; this.initial = structuredClone(save?.campaign ?? { version: 1, studies: {} }); const id = pool?.[0]; const packId = id?.packId ?? fallback.engine.provider.packId; const now = Date.now(); this.meta = save?.campaign?.run ?? { id: pending?.businessId ?? crypto.randomUUID(), packId, startAt: now, endAt: now + 900000 }; startManagement(g, this.meta.id); g.staffAbilities.start(this.meta.id); if (g.status !== 'CLOSED')
        beginMiniSession(g, this.meta.id, packId); this.anchorPause = pauseCredit(g.miniGames, Date.now()); this.state = getState; let state = pending?.state ?? fallback; if (pending?.state) {
        const baseline = save?.campaign?.run?.studyBase;
        if (baseline)
            this.initial.studies[packId] = structuredClone(baseline);
        else
            delete this.initial.studies[packId];
    } const previous = this.initial.studies[packId]; if (!pending?.state && previous)
        state = { ...fallback, engine: new LearningSession(providerForPool(pool), Math.random, previous.progress, undefined, { difficulty: () => this.level(), seenIds: previous.seen }) }; state.engine.setDifficulty(() => this.level()); return state; }
    savedFor(g) { return this.pending.get(g)?.save; }
    businessId() { return this.meta?.id ?? ''; }
    level() { if (!this.meta || !this.state || !this.current)
        return 1; const previous = this.initial.studies[this.meta.packId]; const recent = [...(previous?.recent ?? []), ...this.state().engine.attempts.map(a => a.correct)].slice(-5); return adaptiveLevel(this.current.elapsedTime, { level: previous?.level ?? 1, recent }); }
    delta(g) { if (g !== this.current || !this.meta)
        return null; const now = Date.now(); pollMini(g, now); const pause = pauseCredit(g.miniGames, now); return Math.max(0, Math.max(g.elapsedTime, (now - this.meta.startAt - pause) / 1000, this.anchorElapsed + (performance.now() - this.anchorMono) / 1000 - (pause - this.anchorPause) / 1000) - g.elapsedTime); }
    enrich(save, base) { if (!this.current || !this.meta || !this.state)
        return save; if (!save.portfolio && this.pending.get(this.current)?.save.portfolio)
        save.portfolio = structuredClone(this.pending.get(this.current).save.portfolio); const { engine, analytics, readVisits, specialAttempt } = this.state(), studies = structuredClone(this.initial.studies); studies[this.meta.packId] = studyRecord(engine, this.initial.studies[this.meta.packId]); const history = structuredClone(this.initial.history ?? []).filter(h => h.id !== this.meta.id); if (this.current.status === 'CLOSED')
        history.push({ ...save.portfolio ? { cafeId: save.portfolio.activeCafeId } : {}, id: this.meta.id, packId: this.meta.packId, endedAt: Math.round(Math.min(this.meta.endAt, this.meta.startAt + this.current.elapsedTime * 1000)), levelBefore: base.cafeLevel, levelAfter: this.current.cafeLevel, revenue: this.current.stats.revenue, staff: this.current.service.paid.length, menus: this.current.menus.length, warehouse: this.current.warehouseLevel }); const longTerm = longStateFor(this.current); if (this.grants) {
        const growthReceipt = settleGrowthEconomy(this.current, this.grants, this.meta.id, this.meta.packId, engine.attempts, this.initial.studies[this.meta.packId], longTerm);
        this.current.staffAbilities.settle(growthReceipt?.eligible ?? false);
        settleFranchises(this.current, this.meta.id, growthReceipt?.eligible ?? false);
        if (this.current.roster)
            save.roster = captureRoster(this.current.roster, this.current.service.paid);
        save.money = this.current.money;
        save.growthEconomy = structuredClone(this.grants);
    } if (save.village) {
        syncVillage(save.village, villageMetrics(save));
        this.current.village = structuredClone(save.village);
    } settleManagement(this.current); if (this.current.management)
        save.management = structuredClone(this.current.management); const result = { ...save, ...longTerm ? { longTerm: structuredClone(longTerm) } : {}, campaign: { version: 1, history: history.slice(-100), studies, run: this.initial.run?.closed ? structuredClone(this.initial.run) : { ...captureRun(this.current, base, this.meta, engine, analytics, readVisits, specialAttempt), ...this.initial.studies[this.meta.packId] ? { studyBase: structuredClone(this.initial.studies[this.meta.packId]) } : {} } } }; if (this.current.progressiveState)
        result.v26 = { ...structuredClone(this.current.progressiveState), maxLevel: Math.max(this.current.cafeLevel, this.current.progressiveState.maxLevel), stock: Object.fromEntries(this.current.menus.map(m => [m.menuId, m.stock])) }; syncSharedFurniture(result); syncLake(result); syncManagementAlbum(result); return result; }
}
export const growthRuntime = new GrowthRuntime();
