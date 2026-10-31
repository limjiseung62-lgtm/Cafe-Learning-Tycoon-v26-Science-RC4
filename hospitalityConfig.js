export const hospitalityBalance = { helperChance: .02, helperCooldown: 120, helperLimits: { CLASS_MATCH: 8, CAFE_GROWTH: 2 }, specialChance: .003, specialCooldown: 1800, specialLimit: 1, signatureMultiplier: 5, signaturePriceCap: 1200, tipCap: 100, giftCap: 300, discountCap: 150, buffCap: 150 };
export const helperCatalog = [
    { id: 'tip', name: '팁 요정', unlock: 1, line: '작은 고마움을 두고 갈게요!', effect: '결제금 10% 팁 · 최대 100원' },
    { id: 'influencer', name: '인플루언서', unlock: 3, line: '친구들에게 이 카페를 알려줄게요!', effect: '30초 동안 입장 간격 10% 감소' },
    { id: 'florist', name: '꽃집 사장님', unlock: 2, line: '꽃처럼 기분 좋은 하루예요.', effect: '감사금 60원 · 꽃 장식 30초' },
    { id: 'supplier', name: '재료 납품 손님', unlock: 3, line: '오늘은 작은 재료 선물이 있어요.', effect: '부족 재고 최대 3종 +1 · 가치 300원 이하' },
    { id: 'patissier', name: '천재 파티시에', unlock: 4, line: '오늘의 맛을 조금 더 특별하게!', effect: '다음 일반 주문 3건 +5% · 총 150원 이하' },
    { id: 'repair', name: '수리공', unlock: 3, line: '작은 손질은 제가 도와드릴게요.', effect: '다음 메뉴 강화 5% 할인 · 최대 150원' },
    { id: 'grandma', name: '동네 할머니', unlock: 1, line: '차근차근 하면 더 멋진 카페가 될 거야.', effect: '격려금 80원' },
    { id: 'critic', name: '미식 평론가', unlock: 4, line: '다음 한 접시가 기대되는군요.', effect: '다음 일반 주문 +10% · 최대 150원' },
    { id: 'traveler', name: '여행 블로거', unlock: 5, line: '여행 노트에 꼭 적어둘게요.', effect: '다음 적격 특수 손님 확률 +2%p · 60초' },
    { id: 'lucky', name: '행운의 손님', unlock: 4, line: '오늘의 작은 행운을 나눌게요!', effect: '60원 또는 재고 선물 · 가치 120원 이하' }
];
export function hospitalityDefinition(id) { const h = helperCatalog.find(h => h.id === id); return { customerId: 'helper-' + id, visualKey: 'helper-' + id, name: h?.name ?? '레시피 공모전 심사위원', personality: 'KIND', orderPreference: 'NONE', characterTrait: h?.effect ?? '특별 문제를 풀어 오늘의 시그니처 플레이트를 완성해요.', unlockCafeLevel: h?.unlock ?? 4, spawnWeight: 1, patienceSeconds: id === 'judge' ? 180 : 140, category: 'hospitality', orderProfile: { minQuantity: 1, maxQuantity: 2, maxTypes: 2 } }; }
// Existing carry questions checked against exact rational arithmetic; no bank edits.
const verifiedAnswers = { 'generated-006': '2와 2/5', 'generated-008': '2와 4/8', 'generated-012': '2와 1/7', 'generated-020': '3와 4/9' };
export function specialQuestions(pool) { return pool.filter(q => q.packId === 'fraction-addition-g4-s2' && q.difficulty === 2 && q.answer === verifiedAnswers[q.questionId.split('/').at(-1)] && q.prompt.includes('받아올림') && q.explanation.trim() && verifiedCarry(q)); }
function verifiedCarry(q) { const parts = [...q.prompt.matchAll(/\[FRACTION:(?:(\d+) )?(\d+)\/(\d+)\]/g)].map(m => ({ whole: Number(m[1] ?? 0), n: Number(m[2]), d: Number(m[3]) })); if (parts.length !== 2 || parts[0].d !== parts[1].d || parts[0].d <= 0)
    return false; const d = parts[0].d, sum = parts[0].n + parts[1].n; return sum >= d && q.answer === (parts[0].whole + parts[1].whole + Math.floor(sum / d)) + '와 ' + (sum % d) + '/' + d; }
