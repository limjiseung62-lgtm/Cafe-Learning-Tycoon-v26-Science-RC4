import { branchYield, progressiveEconomyConfig as config } from './progressiveEconomy.js';
const legacyCosts = [300000, 900000, 2400000], legacyFactors = [.4, .65, 1, 1.5];
/** Existing saves lack capital receipts. Preserve an explicit legacy estimate, never fabricate past earnings. */
export function initializeFinance(v) { if (v.finance) {
    v.finance.completedIds ??= v.lastPayout ? [v.lastPayout.id] : [];
    return v.finance;
} const f = { version: 1, spent: {}, earned: {}, estimated: [], recentIncome: [], completedIds: v.lastPayout ? [v.lastPayout.id] : [] }; for (const b of v.branches) {
    f.spent[b.id] = Math.round(legacyCosts[b.id - 2] * (1 + legacyFactors.slice(0, b.level - 1).reduce((a, b) => a + b, 0)));
    f.estimated.push(b.id);
} return v.finance = f; }
export function recordedCapital(v, id) { if (v.finance?.spent[id] !== undefined)
    return { amount: v.finance.spent[id], estimated: v.finance.estimated.includes(id) }; const b = v.branches.find(b => b.id === id); return b ? { amount: Math.round(legacyCosts[id - 2] * (1 + legacyFactors.slice(0, b.level - 1).reduce((a, b) => a + b, 0))), estimated: true } : null; }
export const landmarkNames = ['마을 기념광장', '빛나는 정원', '상권 기념탑', '꽃빛 산책 정원', '마을 문화 광장', '프랜차이즈 기념광장'];
export const districtVisitors = { commerce: '동네 손님·단체 예약', tourism: '여행객·특별 방문객', culture: '공연 손님·수집가', housing: '이웃·단골 손님' };
export function branchReport(v, b, serial) { return { id: b.id, level: b.level, region: b.region, amount: branchYield(v, b), customers: districtVisitors[b.region], event: b.level >= 2 && serial % 4 === b.id % 4 ? ({ commerce: '거리 장터', tourism: '전망 산책 행사', culture: '작은 공연', housing: '이웃 모임' }[b.region]) : '정상 영업' }; }
export function remainingCapital(v) { let cost = 0; for (const b of v.branches)
    for (let level = b.level; level < 5; level++)
        cost += Math.round(config.branchCosts[b.id - 2] * config.upgradeFactors[level - 1]); for (const id of [2, 3, 4])
    if (!v.branches.some(b => b.id === id))
        cost += config.branchCosts[id - 2] * (1 + config.upgradeFactors.reduce((a, b) => a + b, 0)); cost += config.landmarkCosts.slice(v.landmark).reduce((a, b) => a + b, 0); for (const tier of Object.values(v.investments))
    cost += config.investmentCosts.slice(tier).reduce((a, b) => a + b, 0); return Math.round(cost); }
