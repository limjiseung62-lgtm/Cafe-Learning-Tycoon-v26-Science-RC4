import { customers } from './data.js';
import { newProgressiveState, unlocked } from './progressiveFeatures.js';
import { initializeFinance, branchReport } from './progressiveFinance.js';
export const investmentCatalog = [{ id: 'commerce', name: '상업', city: '상업도시', visual: '시장 가판대와 상점 간판', effect: '일반·단체 손님', tile: 6 }, { id: 'tourism', name: '관광', city: '관광마을', visual: '전망 벤치·산책 화단', effect: '관광객·특별 손님', tile: 3 }, { id: 'culture', name: '문화', city: '예술도시', visual: '광장 공연 무대·장식', effect: '예술가·행사 손님', tile: 7 }, { id: 'housing', name: '주거', city: '전원마을', visual: '주택 골목·생활 쉼터', effect: '이웃·단골 손님', tile: 4 }];
export const progressiveEconomyConfig = { investmentCosts: [1500, 7000, 25000, 70000, 160000], branchCosts: [108000, 306000, 720000], branchIncome: [9000, 18000, 30000], upgradeFactors: [.2, .21, .22, .24], maxBranchLevel: 5, landmarkCosts: [250000, 750000, 1800000, 8000000, 24000000, 60000000], revenueCap: .12 };
export function initializeProgressive(s) { s.v26 ??= newProgressiveState(); return s.v26; }
export const canEditProgressive = (s) => !!s.v26 && (!s.campaign?.run || s.campaign.run.closed);
export const investmentTotal = (s) => Object.values(s.investments).reduce((a, b) => a + b, 0);
export const investmentTierLimit = (level) => level >= 15 ? 5 : level >= 14 ? 4 : level >= 12 ? 3 : level >= 11 ? 2 : level >= 10 ? 1 : 0;
export function investVillage(s, field) { if (!canEditProgressive(s) || !unlocked(s, 'investment') || !investmentCatalog.some(c => c.id === field))
    return false; const v = s.v26, level = v.investments[field]; if (level >= investmentTierLimit(v.maxLevel))
    return false; const cost = progressiveEconomyConfig.investmentCosts[level]; if (cost === undefined || s.money < cost)
    return false; s.money -= cost; v.investments[field]++; const ranked = investmentCatalog.map(c => c.id).sort((a, b) => v.investments[b] - v.investments[a]); const lead = ranked[0]; if (v.investments[lead] >= 2 && v.investments[lead] - (v.identity ? v.investments[v.identity] : 0) >= 2)
    v.identity = lead; return true; }
export function progressiveTownName(s) { const v = s.v26; if (v?.identity)
    return '햇살 ' + investmentCatalog.find(c => c.id === v.identity).city; return (s.village?.progression?.stage ?? 1) >= 2 ? '햇살 마을' : '햇살 골목'; }
export function branchRequirement(s, id) { const v = s.v26, stage = s.village?.progression?.stage ?? 1; return [2, 3, 4].includes(id) && !!v && unlocked(s, 'franchise') && stage >= id + 1 && (id === 2 || v.branches.some(b => b.id === id - 1)) && (id === 2 || v.maxLevel >= 15 && investmentTotal(v) >= (id === 3 ? 8 : 12)); }
export const branchUpgradeCost = (id, level) => level < 5 ? Math.round(progressiveEconomyConfig.branchCosts[id - 2] * progressiveEconomyConfig.upgradeFactors[level - 1]) : null;
export function branchYield(s, b) { return Math.round(progressiveEconomyConfig.branchIncome[b.id - 2] * (1 + (b.level - 1) * .2) * (1 + s.investments[b.region] * .01)); }
export function foundFranchise(s, id, region) { if (!canEditProgressive(s) || !branchRequirement(s, id) || s.v26.branches.some(b => b.id === id) || !investmentCatalog.some(c => c.id === region))
    return false; const cost = progressiveEconomyConfig.branchCosts[id - 2]; if (s.money < cost)
    return false; const ledger = initializeFinance(s.v26); ledger.spent[id] = (ledger.spent[id] ?? 0) + cost; s.money -= cost; s.v26.branches.push({ id, level: 1, region }); return true; }
export function upgradeFranchise(s, id) { if (!canEditProgressive(s))
    return false; const b = s.v26.branches.find(b => b.id === id); if (!b)
    return false; const cost = branchUpgradeCost(id, b.level); if (cost === null || s.money < cost)
    return false; const ledger = initializeFinance(s.v26); ledger.spent[id] = (ledger.spent[id] ?? 0) + cost; s.money -= cost; b.level++; return true; }
export function buildLandmark(s) { if (!canEditProgressive(s) || !unlocked(s, 'landmark') || (s.village?.progression?.stage ?? 1) < 4)
    return false; const cost = progressiveEconomyConfig.landmarkCosts[s.v26.landmark]; if (cost === undefined || s.money < cost)
    return false; s.money -= cost; s.v26.landmark++; return true; }
export function openProgressiveBusiness(s, id) { if (!s.v26 || !canEditProgressive(s) || !id || id.length > 128)
    return false; const v = s.v26; if (v.inflight)
    return false; const known = [...new Set([...(v.finance?.completedIds ?? []), ...(s.growthEconomy?.receipts.map(r => r.id) ?? []), ...(s.campaign?.history?.map(r => r.id) ?? []), ...(v.lastPayout ? [v.lastPayout.id] : [])])]; if (known.includes(id) || known.length >= 10000)
    return false; initializeFinance(v).completedIds = known; v.serial++; v.inflight = { id, serial: v.serial }; return true; }
/** Serial is permanent; display history is not the replay-protection ledger. No Date.now based interest. */
export function settleFranchises(g, id, eligible) { const v = g.progressiveState, a = v?.inflight; if (!g.progressive || g.mode !== 'CAFE_GROWTH' || g.status !== 'CLOSED' || !v || !a || a.id !== id || a.serial <= v.settledThrough)
    return 0; const completion = initializeFinance(v); if (completion.completedIds.includes(id)) {
    v.settledThrough = a.serial;
    delete v.inflight;
    return 0;
} if (completion.completedIds.length >= 10000)
    return 0; completion.completedIds.push(id); v.settledThrough = a.serial; delete v.inflight; const amount = eligible && g.elapsedTime >= 900 - 1e-5 ? v.branches.reduce((n, b) => n + branchYield(v, b), 0) : 0; const ledger = initializeFinance(v), details = eligible && g.elapsedTime >= 900 - 1e-5 ? v.branches.map(b => branchReport(v, b, a.serial)) : []; for (const d of details)
    ledger.earned[d.id] = (ledger.earned[d.id] ?? 0) + d.amount; if (eligible && g.elapsedTime >= 900 - 1e-5)
    ledger.recentIncome = [...ledger.recentIncome, Math.round(g.stats.revenue + amount)].slice(-5); v.lastPayout = { id, amount, details }; g.money += amount; return amount; }
export function investmentRevenue(g) { const v = g.progressiveState; return v && g.mode === 'CAFE_GROWTH' ? 1 + Math.min(progressiveEconomyConfig.revenueCap, investmentTotal(v) * .006) : 1; }
export function investmentSpawn(g) { return g.progressiveState && g.mode === 'CAFE_GROWTH' ? Math.max(.9, 1 - investmentTotal(g.progressiveState) * .005) : 1; }
export function investmentVisitor(g, guest) { const v = g.progressiveState; if (!v || !unlocked(g, 'investment') || !investmentTotal(v))
    return; const fields = Array.from({ length: 5 }, (_, tier) => investmentCatalog.filter(c => v.investments[c.id] > tier)).flat(), pick = fields[(Math.floor(guest.id / 4) * 7) % fields.length]; if (guest.id % 4 === 0) {
    const archetype = customers.find(c => c.customerId === ({ commerce: 'reader', tourism: 'walker', culture: 'student', housing: 'grandma' }[pick.id])) ?? guest.definition;
    guest.definition = { ...guest.definition, ...(!guest.specialType && !guest.helperType ? { customerId: archetype.customerId, visualKey: archetype.visualKey, personality: archetype.personality, orderPreference: archetype.orderPreference } : {}), name: ({ commerce: '상점 거리 손님', tourism: '호숫가 여행객', culture: '마을 예술가', housing: '골목 이웃' }[pick.id]) + ' · ' + guest.definition.name, characterTrait: pick.effect, patienceSeconds: guest.definition.patienceSeconds + v.investments[pick.id] * (pick.id === 'housing' ? 4 : 2) };
    guest.patienceRemaining += v.investments[pick.id] * (pick.id === 'housing' ? 4 : 2);
} }
/** A district can invite one existing themed situation per business; existing event budgets/receipts still own rewards. */
export function pollInvestmentEvents(g) { const v = g.progressiveState; if (!v || g.mode !== 'CAFE_GROWTH' || g.status !== 'RUNNING' || !unlocked(g, 'investment') || !g.events.enabled || g.events.active || g.elapsedTime < 240)
    return; const fields = investmentCatalog.filter(c => v.investments[c.id] >= 2); if (!fields.length)
    return; const slot = Math.min(2, Math.floor(g.elapsedTime / 240) - 1), field = fields[(slot + v.serial) % fields.length].id; const type = { commerce: 'rush', tourism: 'influencer', culture: 'birthday', housing: 'grandma' }[field]; if (g.events.records.some(r => r.type === type) || field === 'culture' && !unlocked(g, 'festival'))
    return; if (field === 'commerce')
    g.events.beginMission('rush', g);
else if (field === 'culture')
    g.events.beginMission('birthday', g);
else
    g.events.beginIncident(field === 'tourism' ? 'influencer' : 'grandma', g); }
