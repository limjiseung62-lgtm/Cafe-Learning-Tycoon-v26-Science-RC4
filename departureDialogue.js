import { specializationById } from './specializationConfig.js';
import { helperCatalog } from './hospitalityConfig.js';
export const departureCatalog = {
    student: { normal: ['친구들이랑 또 올게요!', '오늘 간식 최고예요!', '다음엔 케이크 먹을래요!'], fast: ['벌써 나왔네요!', '금방 먹고 갈게요!'], long: ['조금 오래 기다렸네요.', '다음엔 빨리 먹고 싶어요.'], failed: ['다음엔 꼭 먹고 싶어요!', '오늘은 시간이 없네요.'] },
    grandma: { normal: ['참 맛있게 먹었어요.', '사장님, 늘 고마워요.', '다음에도 들를게요.'], fast: ['금방 챙겨줘서 고마워요.', '손이 참 빠르네요.'], long: ['기다리긴 했지만 잘 먹었어요.', '오늘은 많이 바쁘시군요.'], failed: ['다음에 다시 들를게요.', '오늘은 먼저 가볼게요.'] },
    reader: { normal: ['책과 커피, 잘 어울리네요.', '다음 장은 여기서 읽겠어요.', '차분하게 쉬다 갑니다.'], fast: ['책 펼치자마자 왔네요!', '읽을 시간이 넉넉해졌어요.'], long: ['한 장 더 읽으며 기다렸어요.', '다음엔 조금 빨랐으면 해요.'], failed: ['다음 책과 함께 올게요.', '아쉽지만 오늘은 돌아갑니다.'] },
    walker: { normal: ['산책길에 또 들를게요.', '기분 좋은 쉼이었어요.', '덕분에 힘내서 걸어요.'], fast: ['쉬는 틈에 금방 먹었어요!', '바로 챙겨주셔서 좋았어요.'], long: ['조금 기다리긴 했네요.', '산책 시간이 늦어졌어요.'], failed: ['다음 산책에 다시 올게요.', '오늘 간식은 다음 기회에요.'] },
    bookworm: { normal: ['공부하다 또 들를게요!', '간식 먹으니 힘이 나요.', '이 카페 기억해 둘게요.'], fast: ['쉬는 시간에 딱 맞았어요!', '빨리 나와서 고마워요.'], long: ['공부 시간에 늦겠어요.', '다음엔 조금만 빨리 주세요.'], failed: ['오늘 간식은 못 먹었네요.', '다음 쉬는 시간에 올게요.'] },
    athlete: { normal: ['운동 뒤 간식은 최고죠!', '든든하게 잘 먹었어요.', '다음 훈련 뒤에도 올게요.'], fast: ['훈련 전에 딱 맞았어요!', '바로 힘을 채웠네요!'], long: ['몸풀며 기다렸어요.', '훈련 시간이 조금 늦었네요.'], failed: ['훈련 끝나고 다시 올게요.', '다음엔 꼭 먹고 가고 싶어요.'] },
    gentleman: { normal: ['좋은 오후였습니다.', '신문과 커피가 잘 맞네요.', '여유롭게 잘 쉬었어요.'], fast: ['배려가 빠르군요.', '커피가 금방 도착했네요.'], long: ['오늘은 조금 기다렸군요.', '다음엔 여유롭게 만나요.'], failed: ['다음 오후에 다시 오죠.', '오늘은 먼저 일어나겠습니다.'] },
    painter: { normal: ['좋은 빛과 맛이었어요.', '영감이 떠올랐어요!', '다음 그림도 여기서 그릴래요.'], fast: ['붓 잡기 전에 도착했네요!', '빠른 손길, 감사합니다.'], long: ['창가를 그리며 기다렸어요.', '기다림은 조금 길었네요.'], failed: ['다음 스케치 때 들를게요.', '맛을 못 본 게 아쉽네요.'] },
    traveler: { normal: ['여행 노트에 적어둘게요.', '다시 오고 싶은 곳이에요.', '좋은 추억을 만들었어요.'], fast: ['다음 일정에 딱 맞았어요!', '빠른 대접에 감사해요.'], long: ['다음 일정이 조금 늦었어요.', '기다림이 길었지만 기억할게요.'], failed: ['다음 여행에 다시 올게요.', '오늘은 길을 나서야겠네요.'] },
    child: { normal: ['토끼도 맛있대요!', '다음엔 다른 간식 먹을래요.', '정말 달콤했어요!'], fast: ['벌써 간식이 왔어요!', '토끼랑 바로 먹었어요!'], long: ['간식 기다리기 길었어요.', '조금 더 빨리 먹고 싶어요.'], failed: ['토끼랑 다음에 올게요.', '다음엔 꼭 간식 먹을래요!'] },
    office: { normal: ['좋은 휴식이었어요.', '덕분에 다시 힘냅니다.', '다음 점심에도 들를게요.'], fast: ['짧은 휴식에 딱이에요!', '일정에 늦지 않겠네요.'], long: ['휴식 시간이 다 갔네요.', '다음엔 조금 빨랐으면 해요.'], failed: ['회의 때문에 먼저 갈게요.', '다음 휴식 때 다시 올게요.'] },
    fashion: { normal: ['약속 전에 잘 쉬었어요.', '이 카페 분위기 좋아요.', '다음에도 들르고 싶어요.'], fast: ['약속에 딱 맞춰 나왔네요!', '빠르게 챙겨줘서 좋아요.'], long: ['약속 시간이 다가오네요.', '오늘은 조금 기다렸어요.'], failed: ['약속 때문에 먼저 갈게요.', '다음엔 맛보고 싶네요.'] },
    gourmand: { normal: ['든든하게 잘 먹었어요!', '다음엔 더 골라볼래요!', '한 입 한 입 즐거웠어요.'], fast: ['푸짐한 주문도 금방이네요!', '배고픔이 바로 사라졌어요!'], long: ['배가 많이 고팠어요.', '다음엔 조금만 빨리 주세요.'], failed: ['다음엔 꼭 배를 채울래요!', '아직 배고프지만 다음에요.'] },
    spender: { normal: ['좋은 대접이었어요!', '다음에도 넉넉히 주문하죠.', '즐거운 시간을 보냈어요.'], fast: ['서비스가 정말 빠르군요!', '기분 좋은 대접이네요.'], long: ['오늘은 기다림이 길었군요.', '다음엔 좀 더 빨리 부탁해요.'], failed: ['다음에는 함께 즐기죠.', '오늘 주문은 아쉽네요.'] },
    hurried: { normal: ['잘 먹었어요, 먼저 갈게요!', '짧게 쉬고 힘내서 갑니다.', '다음에도 빠르게 들를게요.'], fast: ['시간에 딱 맞았어요!', '이 속도, 정말 좋아요!'], long: ['조금 오래 기다렸네요.', '다음 일정이 급해서요.'], failed: ['시간이 없어 먼저 갈게요!', '다음엔 꼭 빨리 먹고 싶어요.'] },
    regular: { normal: ['사장님, 역시 여기예요!', '오늘도 익숙한 맛이네요.', '곧 다시 들를게요!'], fast: ['역시 제 마음을 아시네요!', '늘 빠르게 챙겨주셔서 좋아요.'], long: ['오늘은 조금 바쁘셨죠?', '다음엔 덜 기다리면 좋겠어요.'], failed: ['다음에 다시 들를게요, 사장님.', '오늘은 아쉽지만 또 올게요.'] },
    vip: { normal: ['정성스러운 대접에 감사해요.', '훌륭한 시간이었습니다.', '다시 찾아뵙겠습니다.'], fast: ['세심하고 신속한 서비스군요.', '준비가 훌륭하네요.'], long: ['기다림은 조금 길었군요.', '다음에는 더 여유롭길 바라요.'], failed: ['다음 방문을 기대하겠습니다.', '오늘은 먼저 돌아가겠습니다.'] }
};
export function departureOutcome(g) { if (g.abandoned || !g.paid)
    return 'failed'; const wait = Math.max(0, (g.servedAt ?? g.orderedAt) - g.orderedAt); return wait <= 12 ? 'fast' : wait >= g.definition.patienceSeconds * .55 ? 'long' : 'normal'; }
function hash(text) { let h = 2166136261; for (const c of text)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export class DepartureDialogue {
    seen = new Set();
    recent = new Map();
    messages = [];
    observe(guests, now) { this.messages = this.messages.filter(m => m.expires > now); for (const g of guests) {
        if (g.state !== 'LEAVING' || this.seen.has(g.id))
            continue;
        this.seen.add(g.id);
        if (this.seen.size > 128)
            this.seen.delete(this.seen.values().next().value);
        if (this.messages.length >= 2)
            continue;
        const key = g.specialType ?? g.definition.customerId, outcome = departureOutcome(g), lines = (departureCatalog[key] ?? departureCatalog.student)[outcome];
        let i = hash(key + '/' + g.id) % lines.length;
        if (lines[i] === this.recent.get(key) && lines.length > 1)
            i = (i + 1) % lines.length;
        const text = g.specializationId ? (g.paid ? specializationById(g.specializationId).line : '다음에는 함께 준비해요.') : g.paid && g.helperType ? helperCatalog.find(h => h.id === g.helperType).line : g.paid && g.signature ? '정성스러운 시그니처, 잘 맛봤어요!' : lines[i];
        this.recent.set(key, text);
        this.messages.push({ guestId: g.id, name: g.definition.name, text, outcome, expires: now + 2.2 });
    } return this.messages.map(m => ({ ...m })); }
    get retainedIds() { return this.seen.size; }
}
