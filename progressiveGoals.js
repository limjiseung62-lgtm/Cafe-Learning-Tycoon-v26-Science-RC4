import { progressiveEconomyConfig as config, investmentCatalog, investmentTierLimit, branchUpgradeCost, branchRequirement } from './progressiveEconomy.js';
import { landmarkNames } from './progressiveFinance.js';
export function economicGoals(s) { const v = s.v26; if (!v)
    return []; const rows = []; for (const c of investmentCatalog) {
    const tier = v.investments[c.id], cost = config.investmentCosts[tier];
    if (cost !== undefined)
        rows.push({ id: c.id, name: c.name + ' ' + (tier + 1) + '단계', cost, reason: tier >= investmentTierLimit(v.maxLevel) ? '본점 Lv.' + ([10, 11, 12, 14, 15][tier]) + ' 필요' : '', change: c.visual + ' · ' + c.effect });
} for (const id of [2, 3, 4]) {
    const b = v.branches.find(b => b.id === id), cost = b ? branchUpgradeCost(id, b.level) : config.branchCosts[id - 2];
    if (cost !== null)
        rows.push({ id: 'branch-' + id, name: id + '호점 ' + (b ? 'Lv.' + (b.level + 1) : '창업'), cost, reason: !b && !branchRequirement(s, id) ? '본점·마을·이전 지점 조건 확인' : '', change: b ? '건물·간판 개선과 자동 수익 증가' : '학습 영업 완료 때 자동 정산' });
} const cost = config.landmarkCosts[v.landmark]; if (cost !== undefined)
    rows.push({ id: 'landmark', name: landmarkNames[v.landmark], cost, reason: v.maxLevel < 15 || (s.village?.progression?.stage ?? 1) < 4 ? '본점 Lv.15 · 마을 4단계 필요' : '', change: v.landmark >= 3 ? '기념광장 고급 증축 · 외형·앨범·명예 · 추가 수익 없는 선택 목표' : '새로운 마을 기념 시설' }); const history = v.finance?.recentIncome ?? [], mean = history.length ? history.reduce((a, b) => a + b, 0) / history.length : 0; return rows.map(r => ({ ...r, affordable: !r.reason && s.money >= r.cost, needed: Math.max(0, r.cost - s.money), sessions: r.reason ? null : s.money >= r.cost ? 0 : mean > 0 ? Math.ceil((r.cost - s.money) / mean) : null })).sort((a, b) => Number(!!a.reason) - Number(!!b.reason) || a.cost - b.cost); }
export function goalsHtml(s) { const rows = economicGoals(s), pick = rows.slice(0, 2), landmark = rows.find(r => r.id === 'landmark'); if (landmark && !pick.includes(landmark))
    pick.push(landmark); return '<section class="economic-goals"><h3>다음에 이루고 싶은 목표</h3>' + (!rows.length ? '<p>마을과 모든 지점을 완성했어요! 성장 앨범의 마을빛 지킴이 기록을 확인해 보세요.</p>' : pick.map(r => '<article><strong>' + r.name + '</strong><p>' + r.cost.toLocaleString() + '원' + (r.reason || r.affordable ? '' : ' · ' + r.needed.toLocaleString() + '원 더 모아요') + '</p><p>' + (r.reason || (r.affordable ? '지금 준비할 수 있어요' : r.sessions === null ? '첫 자격 영업을 마치면 예상 횟수를 알려줘요' : '약 ' + r.sessions + '회 자격 영업 예상')) + '</p><small>' + r.change + '</small></article>').join('')) + '<p><small>예상은 최근 최대 5회 매출+분점 수익 기준이에요. 앞으로 쓸 강화비·새 투자비는 빼지 않은 참고값이에요.</small></p></section>'; }
