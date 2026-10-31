export const recruitCatalog = [
    ['staff-1', '봄이', 'spring', '일반', '다정한 팁', '정상 서빙 때 팁을 모아요.', '팁 고마워요!'],
    ['staff-2', '준이', 'jun', '일반', '재고 레이더', '부족한 주문 재고를 알려 줘요.', '이 음식이 부족해요!'],
    ['staff-3', '하루', 'haru', '일반', '차분한 준비', '주문 확인을 조금 빨리 마쳐요.', '준비 끝!'],
    ['staff-4', '루나', 'luna', '숙련', '특별한 접객', '특별 손님을 대접하고 팁을 모아요.', '특별한 손님을 모셨어요!'],
    ['staff-5', '도담', 'dodam', '일반', '행사 뒷정리', '성공한 이벤트의 지원금을 모아요.', '행사 마무리 완료!'],
    ['staff-6', '나리', 'nari', '일반', '첫 만남 카드', '처음 만난 손님을 대접하고 칭호를 모아요.', '첫 만남을 기억해요!'],
    ['staff-7', '민트', 'mint', '일반', '골고루 진열', '세 가지 메뉴를 서빙하고 지원금을 모아요.', '다채로운 한 상이에요!'],
    ['staff-8', '솔', 'sol', '숙련', '따뜻한 환대', '여러 손님을 대접하고 지원금을 모아요.', '오늘도 반가웠어요!'],
    ['staff-9', '율', 'yul', '숙련', '단골의 쪽지', '단골을 대접하고 지원금을 모아요.', '다시 와 주셔서 고마워요!'],
    ['staff-10', '태오', 'taeo', '숙련', '끝까지 한 접시', '여러 번 운반한 주문을 마무리해요.', '한 접시까지 깔끔하게!'],
    ['staff-11', '별', 'byeol', '특별', '축제 사진첩', '성공한 축제를 기록하고 칭호를 모아요.', '오늘을 사진에 담아요!'],
    ['staff-12', '모아', 'moa', '특별', '주문의 추억', '특별 주문의 추억과 칭호를 모아요.', '특별한 주문을 기억해요!']
].map(([staffId, name, visualKey, grade, ability, description, feedback]) => ({ staffId, name, visualKey, grade, ability, description, feedback }));
export const recruitConfig = { prices: [4000, 14000, 30000, 60000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000], maxOwned: 12, maxWorking: 5, bonusRate: .01, bonusCap: 1500, version: 1 };
export const recruitById = (id) => recruitCatalog.find(d => d.staffId === id);
export function staffEffect(id, level) { const l = Math.max(1, Math.min(5, level)), factor = 1 + (l - 1) * .1; switch (id) {
    case 'staff-1': return '50% 팁 ' + Math.round(30 * factor) + '원 적립 · 최대10회';
    case 'staff-2': return '부족 재고 안내 · ' + (22 - l * 2) + '초 간격';
    case 'staff-3': return '주문 확인 평균 ' + (.28 - l * .01).toFixed(2) + '초 · 총 절약3초 이내';
    case 'staff-4': return '특별 손님 30% 팁 ' + Math.round(80 * factor) + '원 · 최대3회';
    case 'staff-5': return '이벤트 성공 ' + Math.round(50 * factor) + '원 · 최대4회';
    case 'staff-6': return '첫 만남 ' + [5, 5, 4, 4, 3][l - 1] + '회로 기념 칭호';
    case 'staff-7': return '메뉴3종 ' + Math.round(50 * factor) + '원 · 최대3회';
    case 'staff-8': return '손님 ' + [8, 8, 7, 7, 6][l - 1] + '명 서빙 시 ' + Math.round(100 * factor) + '원';
    case 'staff-9': return '단골 ' + Math.round(70 * factor) + '원 · 최대3회';
    case 'staff-10': return '여러 번 운반 ' + Math.round(40 * factor) + '원 · 최대5회';
    case 'staff-11': return '축제 ' + [5, 5, 4, 4, 3][l - 1] + '개로 기념 칭호';
    default: return '특별 주문 ' + [3, 3, 2, 2, 1][l - 1] + '회로 기념 칭호';
} }
