import { unlocked } from './progressiveFeatures.js';
import { managementFor } from './managementState.js';
import { recruitById } from './recruitConfig.js';
export const educationThresholds = [5, 12, 22];
export function educationLevel(g, id) { return g.mode === 'CAFE_GROWTH' ? g.management?.training[id]?.level ?? 0 : 0; }
export function observeEducation(g, guestId) { if (!unlocked(g, 'education'))
    return; const m = g.management, id = g.staffAbilities.run?.couriers[String(guestId)]; if (g.mode !== 'CAFE_GROWTH' || !m || !id || !g.service.paid.some(w => w.staffId === id))
    return; const t = m.training[id] ??= { level: 0, progress: 0, lesson: recruitById(id).ability + ' 교육', badges: [] }; t.progress = Math.min(1000, t.progress + 1); }
export function educateStaff(save, id) { if (!unlocked(save, 'education'))
    return false; if (!save.roster?.owned.some(w => w.id === id) || save.campaign?.run && !save.campaign.run.closed)
    return false; const t = managementFor(save).training[id]; if (!t || t.level >= 3 || t.progress < educationThresholds[t.level])
    return false; t.level++; const badge = id + ':' + t.level; if (!t.badges.includes(badge))
    t.badges.push(badge); return true; }
export function educationEffect(id, level) { if (id === 'staff-2')
    return '재고 레이더 간격 ' + (level * .5).toFixed(1) + '초 단축'; if (id === 'staff-3')
    return '준비 절약 적립 ' + (level * 3) + '점 · 총 절약 3초 상한 유지'; if (['staff-6', 'staff-11', 'staff-12'].includes(id))
    return level >= 2 ? '기념 칭호 필요 기록 1개 감소' : '교육 2단계부터 칭호 필요 기록 1개 감소'; return '기존 능력 적립액 +' + (level * 2.5).toFixed(1) + '%p · 합계 매출 1%·1,500원 상한 유지'; }
