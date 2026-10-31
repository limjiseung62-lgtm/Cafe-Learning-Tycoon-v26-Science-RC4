import { customers } from './data.js';
import { specialNames, specialTypes } from './phase4Config.js';
import { freeKey } from './freeLayoutModel.js';
import { recruitById } from './recruitConfig.js';
export function serviceReview(g, guest, wait) {
    const active = g.freeLayouts?.plans[freeKey(g.cafeLevel, g.branchId)], interior = !!active?.decor.length;
    const special = !!(guest.specialType || guest.signature), courier = g.staffAbilities.run?.couriers[String(guest.id)], staff = courier ? recruitById(courier) : undefined;
    const context = wait > 75 ? 'late' : special ? 'special' : interior ? 'interior' : wait <= 30 ? 'quick' : 'normal';
    const texts = {
        late: ['음식이 조금 늦었지만 따뜻하게 잘 먹었어요.', '기다림이 길었어요. 다음에는 조금 더 일찍 부탁해요.', '오늘은 음식이 늦게 나왔네요. 다음 방문을 기대할게요.', '여유 있게 기다렸지만 다음에는 더 빨리 만나고 싶어요.'],
        special: ['특별한 주문도 정성껏 준비해 줬어요!', '복잡한 특별 주문을 끝까지 챙겨 줬네요.', '오늘의 특별 메뉴를 잘 대접받았어요.', '특별한 부탁을 들어줘서 기억에 남아요!'],
        interior: ['테이블과 장식이 예쁘고 편안했어요.', '꾸며 놓은 자리가 아늑해 음식을 즐기기 좋았어요.', '가구와 장식이 어울리는 카페네요.', '장식 덕분에 식사 시간이 더 포근했어요.'],
        quick: ['주문한 음식이 금방 도착했어요!', '기다림이 짧아서 기분 좋게 먹었어요.', '오늘은 빠르게 한 끼를 즐겼네요.', '주문 뒤 오래 기다리지 않아도 돼서 좋았어요.'],
        normal: ['주문한 음식을 친절하게 가져다줬어요!', '차근차근 준비해 준 음식을 잘 먹었어요.', '오늘도 한 접시를 끝까지 챙겨 줬네요.', '다음에도 편안하게 들르고 싶은 카페예요.']
    };
    const recent = new Set(g.management?.reviews.slice(-3).map(r => r.text));
    const choices = texts[context];
    const offset = guest.id % choices.length;
    let text = choices[offset];
    for (let i = 0; i < choices.length; i++) {
        const candidate = choices[(offset + i) % choices.length];
        if (!recent.has(candidate)) {
            text = candidate;
            break;
        }
    }
    return { text, interior, reason: '정상 결제 · 서빙 대기 ' + Math.round(wait) + '초' + (special ? ' · 실제 특별 주문' : '') + (interior ? ' · 현재 홀 장식 있음' : '') + (staff ? ' · 담당 ' + staff.name + ' (' + staff.ability + ')' : '') };
}
export function abandonedReview(g, id) { const options = ['다음에는 음식을 조금 더 일찍 만나고 싶어요.', '오늘은 기다리다 돌아가요. 다음에 다시 들를게요.', '음식을 받기 전에 시간이 다 됐네요. 다음 방문을 기대해요.', '이번에는 오래 기다렸어요. 다음에는 한 접시 부탁해요.']; const recent = new Set(g.management?.reviews.slice(-3).map(r => r.text)); return Array.from({ length: 4 }, (_, i) => options[(id + i) % 4]).find(t => !recent.has(t)) ?? options[id % 4]; }
export function regularGuestName(id) { const normal = customers.find(c => c.visualKey === id); if (normal)
    return normal.name; const special = specialTypes.find(t => 'special-' + t === id); if (special)
    return specialNames[special]; return { 'resident:flowers': '소담 · 꽃집', 'resident:market': '다온 · 시장', 'resident:mill': '보리 · 제분소', 'resident:plaza': '광장 이웃' }[id] ?? '다시 찾아온 손님'; }
