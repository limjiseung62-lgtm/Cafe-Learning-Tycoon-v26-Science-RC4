import { economicGoals } from './progressiveGoals.js';
import { recordedCapital } from './progressiveFinance.js';
import { featureLevels } from './progressiveFeatures.js';
import { investmentTierLimit, branchUpgradeCost, branchYield, progressiveEconomyConfig as config } from './progressiveEconomy.js';
export const featureNames = { missions: '미션 보드', recruitment: '직원 구인', cake: '케이크 미니게임', decor: '카페 꾸미기', oven: '오븐 미니게임', branch: '카페 분기', flowers: '꽃 미니게임', reviews: '평판·리뷰', research: '메뉴 연구', strategy: '영업 전략', sort: '주문 분류', village: '마을 탐험', investment: '마을 투자', specialization: '카페 전문화', machine: '머신 수리', education: '직원 교육', specialBusiness: '특별 영업', delivery: '배달', festival: '마을 축제', tray: '트레이 배달', franchise: '자동 운영 지점', landmark: '랜드마크' };
export function nextUnlock(level) { const next = Math.min(...Object.values(featureLevels).filter(n => n > level)); return Number.isFinite(next) ? 'Lv.' + next + ' · ' + Object.keys(featureLevels).filter(f => featureLevels[f] === next).map(f => featureNames[f]).join(' · ') : '모든 레벨 기능 해금 · 시설별 조건은 별도 확인'; }
export function investmentReason(s, field) { const v = s.v26, tier = v.investments[field], cost = config.investmentCosts[tier]; if (tier === 5)
    return '투자 완성'; if (tier >= investmentTierLimit(v.maxLevel))
    return '본점 Lv.' + ([10, 11, 12, 14, 15][tier]) + '에서 다음 투자가 열려요'; return s.money < cost ? (cost - s.money).toLocaleString() + '원 더 모으면 투자할 수 있어요' : '지금 투자할 수 있어요'; }
/** Configured capital, not a claim about already earned money. Only income from qualified future sessions is estimated. */
export function franchiseQuote(s, id) { const v = s.v26, b = v.branches.find(b => b.id === id); if (!b)
    return null; const income = branchYield(v, b), capital = config.branchCosts[id - 2] + Array.from({ length: b.level - 1 }, (_, i) => branchUpgradeCost(id, i + 1)).reduce((a, b) => a + b, 0), cost = branchUpgradeCost(id, b.level), gain = cost === null ? 0 : branchYield(v, { ...b, level: b.level + 1 }) - income; const recorded = recordedCapital(v, id), earned = v.finance?.earned[id] ?? 0; return { income, capital, capitalSessions: Math.ceil(capital / income), recordedCapital: recorded.amount, estimated: recorded.estimated, earned, net: earned - recorded.amount, remainingSessions: Math.ceil(Math.max(0, recorded.amount - earned) / income), upgradeCost: cost, upgradeGain: gain, upgradeSessions: cost === null ? null : Math.ceil(cost / gain) }; }
export function sessionGuidance(g) { const growth = g.mode === 'CAFE_GROWTH', now = g.readyToServe.length && !g.service.paid.length ? '준비된 주문을 서빙해요' : g.menus.some(m => m.stock === 0) ? '음식 만들기 → 문제를 풀어 재고를 채워요' : '손님을 맞이하고 성장·강화를 살펴봐요'; const plans = growth && g.progressiveState ? economicGoals({ v26: g.progressiveState, cafeLevel: g.cafeLevel, money: g.money, village: g.village }) : [], plan = plans.find(r => !r.reason) ?? plans[0]; return { now, next: growth ? nextUnlock(Math.max(g.cafeLevel, g.progressiveState?.maxLevel ?? 1)) : g.remainingSeconds <= 180 ? '마지막 3분 · 준비한 음식을 팔고 성장에 도전해요' : '15분 단판 · 최대 Lv.15에 도전해요', money: g.nextCafe ? '카페 Lv.' + (g.cafeLevel + 1) + ' · ' + g.nextCafe.expansionCost.toLocaleString() + '원' + (g.money >= g.nextCafe.expansionCost ? ' · 지금 확장 가능' : ' · ' + Math.max(0, g.nextCafe.expansionCost - g.money).toLocaleString() + '원 더 모아요') : growth ? (plan ? '영업 후 마을 투자·지점·랜드마크 · ' + plan.name + ' ' + plan.cost.toLocaleString() + '원' + (plan.reason ? ' · ' + plan.reason : plan.affordable ? ' · 현재 금액으로 가능' : plan.sessions === null ? '' : ' · 약 ' + plan.sessions + '회 예상') : '마을 투자·지점·랜드마크 완성 · 앨범에서 명예 기록을 확인해요') : '최고 단계 달성! 메뉴·창고·직원을 강화해요' }; }
export function renderProgressiveGuidance(g) { let node = document.getElementById('progressive-goals'); if (!g.progressive) {
    if (node)
        node.hidden = true;
    return;
} if (!node) {
    node = document.createElement('aside');
    node.id = 'progressive-goals';
    node.className = 'progressive-goals';
    node.setAttribute('aria-label', '지금 할 일과 다음 목표');
    document.querySelector('#playing .hud')?.after(node);
} node.hidden = false; const goal = sessionGuidance(g), key = JSON.stringify(goal); if (node.dataset.key === key)
    return; node.dataset.key = key; node.replaceChildren(...Object.entries({ 지금: goal.now, 다음: goal.next, 목표: goal.money }).map(([label, text]) => { const p = document.createElement('p'), b = document.createElement('b'); b.textContent = label + ' '; p.append(b, document.createTextNode(text)); return p; })); }
