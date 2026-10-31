import { specializationEvents } from './specializationConfig.js';
export const eventBalance = { version: 1, firstAt: 30, lastMargin: 30, cashPerMinute: 8, missionBudgetShare: .8, missionWeightBase: 60, incidentWeightBase: 40, reservePerMission: 6, reservePerIncident: 1, giftLimit: 3, giftValueCap: 300, readingExtraSeconds: 45, maxReadingExtensions: 2, noticeSeconds: 4, warningSeconds: 10, arrivalGap: 1.2, maxQueuedArrivals: 6, promotionSeconds: 25, promotionSpawnFactor: .9, performanceActorLimit: 12 };
export const eventFrequency = [{ seconds: 300, total: 4, urgent: 2 }, { seconds: 600, total: 7, urgent: 4 }, { seconds: 900, total: 10, urgent: 5 }, { seconds: 1200, total: 14, urgent: 7 }, { seconds: 1800, total: 19, urgent: 10 }, { seconds: 2400, total: 25, urgent: 13 }, { seconds: 3600, total: 36, urgent: 18 }];
export const missionCatalog = [
    { id: 'rush', name: '단체 주문 폭주', line: '긴급! 단체 주문이 들어왔어요!', unlock: 1, seconds: 85, correct: 2, served: 1, streak: 0, cash: 60, arrivals: 2, effect: 'party' },
    { id: 'kitchen', name: '주방 긴급 상황', line: '주방을 도와주세요! 차근차근 문제로 해결해요.', unlock: 1, seconds: 75, correct: 2, served: 0, streak: 0, cash: 40, arrivals: 0, effect: 'kitchen' },
    { id: 'gourmet', name: '미식가의 특별 주문', line: '미식가가 특별한 문제를 기다려요!', unlock: 2, seconds: 100, correct: 1, served: 0, streak: 0, cash: 100, arrivals: 1, effect: 'gourmet' },
    { id: 'sns', name: 'SNS 인기 폭발', line: '카페를 알릴 기회! 문제를 맞혀 홍보해요.', unlock: 2, seconds: 80, correct: 2, served: 0, streak: 0, cash: 40, arrivals: 0, effect: 'camera' },
    { id: 'rescue', name: '재고 구조 미션', line: '품절 메뉴를 구조해요! 정답으로 재고를 채워요.', unlock: 1, seconds: 75, correct: 1, served: 0, streak: 0, cash: 40, arrivals: 0, effect: 'stock' },
    { id: 'streak', name: '연속 정답 도전', line: '차근차근 두 문제 연속 정답에 도전!', unlock: 1, seconds: 90, correct: 0, served: 0, streak: 2, cash: 60, arrivals: 0, effect: 'cheer' },
    { id: 'team', name: '직원 응원 미션', line: '공부하고 서빙하며 함께 힘내요!', unlock: 2, seconds: 95, correct: 2, served: 1, streak: 0, cash: 50, arrivals: 0, effect: 'team' },
    { id: 'birthday', name: '생일 파티 주문', line: '생일 파티 주문이에요! 함께 준비해요.', unlock: 3, seconds: 105, correct: 2, served: 2, streak: 0, cash: 120, arrivals: 3, effect: 'birthday' }
];
export const incidentCatalog = [
    { id: 'tip', name: '팁 손님 방문', helper: 'tip', unlock: 1, cash: 30, effect: 'tip' },
    { id: 'supplier', name: '재료 선물', helper: 'supplier', unlock: 3, cash: 0, effect: 'gift' },
    { id: 'influencer', name: '인플루언서 방문', helper: 'influencer', unlock: 3, cash: 0, effect: 'camera' },
    { id: 'grandma', name: '동네 할머니 방문', helper: 'grandma', unlock: 1, cash: 40, effect: 'gift' },
    { id: 'critic', name: '미식 평론가 방문', helper: 'critic', unlock: 4, cash: 60, effect: 'gourmet' },
    { id: 'lucky', name: '행운의 손님', helper: 'lucky', unlock: 4, cash: 50, effect: 'lucky' }
];
export const allMissionCatalog = [...missionCatalog, ...specializationEvents];
export function eventSchedule(seconds) { const row = eventFrequency.find(r => r.seconds >= seconds) ?? eventFrequency.at(-1); const total = seconds < 300 ? Math.max(1, Math.round(seconds / 75)) : row.total, urgent = seconds < 300 ? Math.ceil(total / 2) : row.urgent; const first = Math.min(eventBalance.firstAt, seconds * .1), end = Math.max(first, seconds - eventBalance.lastMargin); return Array.from({ length: total }, (_, i) => ({ at: Math.round(first + (end - first) * i / Math.max(1, total - 1)), urgent: Math.ceil((i + 1) * urgent / total) > Math.ceil(i * urgent / total) })); }
