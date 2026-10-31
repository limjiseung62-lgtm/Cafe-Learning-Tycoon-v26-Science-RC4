import { arcadeOpen, difficultyIndex, randomFor } from './arcadeTypes.js';
export const sortFoods = ['커피', '딸기 케이크', '초콜릿 디저트', '쿠키'];
export function sortOrder(seed, difficulty, id, now) { const r = randomFor(seed + id * 7919), d = difficultyIndex(difficulty), need = [0, 0, 0, 0], first = Math.floor(r() * (d ? 4 : 3)); need[first] = 1 + Math.floor(r() * (d === 2 ? 3 : 2)); if (d > 0 && r() > .25) {
    const second = (first + 1 + Math.floor(r() * 3)) % 4;
    need[second] = 1 + Math.floor(r() * 2);
} return { id, need, placed: [0, 0, 0, 0], expiresAt: now + ([18000, 17000, 12000][d]) + (d === 2 ? Math.floor(r() * 6000) : id * 400) }; }
export function newSort(seed, difficulty, now) { const size = 2 + difficultyIndex(difficulty); return { version: 1, kind: 'sort', difficulty, seed: seed >>> 0, startedAt: now, duration: 45, message: '음식을 고르고 주문 트레이에 올려요. 잘못 놓았으면 빼고 고칠 수 있어요.', queue: Array.from({ length: size }, (_, i) => sortOrder(seed, difficulty, i, now)), generated: size, selected: 0, history: [] }; }
function refill(s, now) { const n = 2 + difficultyIndex(s.difficulty); while (s.queue.length < n && s.generated < 12)
    s.queue.push(sortOrder(s.seed, s.difficulty, s.generated++, now)); if (!s.queue.length && s.generated === 12)
    s.endedAt = Math.min(now, s.startedAt + 45000); }
export function tickSort(s, now) { if (s.endedAt !== undefined)
    return; for (const o of [...s.queue])
    if (now >= o.expiresAt) {
        s.history.push({ id: o.id, score: 0, accuracy: 0, exact: false, note: '주문 대기시간 종료' });
        s.queue = s.queue.filter(x => x.id !== o.id);
        s.message = '기다리던 손님이 떠났어요. 다음 주문에 집중해요.';
    } if (now >= s.startedAt + 45000) {
    s.endedAt = s.startedAt + 45000;
    return;
} refill(s, now); }
export function putSort(s, id, item, now, remove = false) { tickSort(s, now); const o = s.queue.find(o => o.id === id); if (!arcadeOpen(s, now) || !o || !Number.isInteger(item) || item < 0 || item > 3 || remove && o.placed[item] === 0 || !remove && o.placed[item] >= 6)
    return false; o.placed[item] += remove ? -1 : 1; s.message = sortFoods[item] + (remove ? ' 하나를 뺐어요.' : ' 하나를 올렸어요. 주문을 확인해 주세요.'); return true; }
export function submitSort(s, id, now) { tickSort(s, now); const o = s.queue.find(o => o.id === id); if (!arcadeOpen(s, now) || !o || !o.placed.some(Boolean))
    return false; const total = Math.max(o.need.reduce((a, b) => a + b, 0), o.placed.reduce((a, b) => a + b, 0)), matched = o.need.reduce((a, n, i) => a + Math.min(n, o.placed[i]), 0), accuracy = Math.round(matched / total * 100), exact = o.need.every((n, i) => n === o.placed[i]); s.history.push({ id, score: exact ? 1000 : accuracy * 5, accuracy, exact, note: exact ? '손님이 활짝 웃어요!' : '주문과 조금 달라요. 다음 트레이에서 만회해요.' }); s.queue = s.queue.filter(x => x.id !== id); s.message = s.history.at(-1).note; refill(s, now); return true; }
