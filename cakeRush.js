export const rushConfig = { duration: 45, maxOrders: 9, maxScore: 11550, easy: { slots: 2, patience: 32 }, normal: { slots: 3, patience: 26 }, challenge: { slots: 3, patience: 20 } };
export const emptyCake = () => ({ sheet: null, cream: null, fruits: Array(6).fill(null), ornament: null });
export function rushSeed(s) { let n = 2166136261; for (const c of s)
    n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
function random(seed) { let n = seed; return () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296); }
function recipeSequence(seed, d) { const rnd = random(seed), list = []; while (list.length < 9) {
    const i = list.length, r = { sheet: ['vanilla', 'strawberry', 'cocoa'][Math.floor(rnd() * 3)], cream: ['white', 'pink', 'cocoa'][Math.floor(rnd() * 3)], fruit: ['strawberry', 'chocolate', 'blueberry'][Math.floor(rnd() * 3)], count: 1 + Math.floor(rnd() * 3), ornament: rnd() < .5 ? 'heart' : 'star', conditions: d === 'challenge' ? (i < 2 ? 3 : 4) : d === 'normal' ? (i < 2 ? 2 : 3) : i < 4 ? 2 : 3 };
    const key = (x) => [x.sheet, x.cream, x.conditions >= 3 ? x.fruit + ':' + x.count : '', x.conditions >= 4 ? x.ornament : ''].join('/');
    if (!list.some(x => key(x) === key(r)))
        list.push(r);
} return list; }
export function newCakeRush(seed, difficulty, startedAt, duration = 45) { if (!Number.isInteger(duration) || duration < 30 || duration > 60)
    throw Error('30~60초만 설정할 수 있어요.'); const s = { version: 1, seed: seed >>> 0, difficulty, duration, startedAt, generated: 0, queue: [], history: [], selected: null }; fill(s, startedAt); return s; }
function fill(s, now) { const recipes = recipeSequence(s.seed, s.difficulty); while (s.queue.length < rushConfig[s.difficulty].slots && s.generated < 9 && now < s.startedAt + s.duration * 1000) {
    const id = s.generated++;
    s.queue.push({ id, recipe: recipes[id], createdAt: now, expiresAt: Math.min(now + rushConfig[s.difficulty].patience * 1000, s.startedAt + s.duration * 1000), draft: emptyCake() });
} if (!s.queue.some(o => o.id === s.selected))
    s.selected = s.queue[0]?.id ?? null; }
export function orderAccuracy(o) { const r = o.recipe, d = o.draft; return (Number(d.sheet === r.sheet) + Number(d.cream === r.cream) + (r.conditions >= 3 ? Number(d.fruits.filter(Boolean).length === r.count && d.fruits.filter(Boolean).every(f => f === r.fruit)) : 0) + (r.conditions >= 4 ? Number(d.ornament === r.ornament) : 0)) / r.conditions; }
export function rushStats(s) { let combo = 0, bestCombo = 0, score = 0, exact = 0, processed = 0; for (const h of s.history) {
    score += h.points;
    if (h.outcome !== 'missed')
        processed++;
    if (h.outcome === 'exact') {
        exact++;
        bestCombo = Math.max(bestCombo, ++combo);
    }
    else
        combo = 0;
} return { processed, exact, accuracy: processed ? Math.round(exact / processed * 100) : 0, bestCombo, combo, score, failed: s.history.filter(h => h.outcome === 'missed').length, stars: exact >= 5 ? 3 : exact >= 2 ? 2 : exact >= 1 ? 1 : 0 }; }
function points(o, now, combo) { const a = orderAccuracy(o); return a === 1 ? orderBase(o.recipe.conditions) + Math.floor(Math.max(0, (o.expiresAt - now) / (o.expiresAt - o.createdAt)) * 50) + Math.min((combo + 1) * 20, 100) : Math.round(orderBase(o.recipe.conditions) * .65 * a); }
export function tickCakeRush(s, now) { if (s.endedAt !== undefined)
    return false; let changed = false; for (const o of [...s.queue])
    if (now >= o.expiresAt) {
        s.history.push({ order: structuredClone(o), at: o.expiresAt, outcome: 'missed', points: 0 });
        s.queue = s.queue.filter(x => x.id !== o.id);
        changed = true;
    } const end = s.startedAt + s.duration * 1000; if (now >= end || s.generated === 9 && !s.queue.length) {
    s.endedAt = Math.min(now, end);
    s.selected = null;
    return true;
} if (changed)
    fill(s, now); return changed; }
export function selectRushOrder(s, id, now) { tickCakeRush(s, now); if (s.endedAt !== undefined || !s.queue.some(o => o.id === id))
    return false; s.selected = id; return true; }
export function editCake(s, field, value, now, index = 0) { tickCakeRush(s, now); const o = s.queue.find(o => o.id === s.selected); if (!o || s.endedAt !== undefined)
    return false; const d = o.draft; if (field === 'clear')
    o.draft = emptyCake();
else if (field === 'sheet' && (value === null || ['vanilla', 'strawberry', 'cocoa'].includes(String(value))))
    d.sheet = value;
else if (field === 'cream' && (value === null || ['white', 'pink', 'cocoa'].includes(String(value))))
    d.cream = value;
else if (field === 'ornament' && (value === null || ['heart', 'star'].includes(String(value))))
    d.ornament = value;
else if (field === 'fruit' && Number.isInteger(index) && index >= 0 && index < 6 && (value === null || ['strawberry', 'chocolate', 'blueberry'].includes(String(value))))
    d.fruits[index] = value;
else
    return false; return true; }
export function submitCake(s, now) { tickCakeRush(s, now); const o = s.queue.find(o => o.id === s.selected); if (!o || s.endedAt !== undefined)
    return false; const exact = orderAccuracy(o) === 1, p = points(o, now, rushStats(s).combo); s.history.push({ order: structuredClone(o), at: now, outcome: exact ? 'exact' : 'partial', points: p }); s.queue = s.queue.filter(x => x.id !== o.id); fill(s, now); tickCakeRush(s, now); return true; }
export function closeCakeRush(s, now) { if (s.endedAt !== undefined)
    return; for (const o of s.queue)
    s.history.push({ order: structuredClone(o), at: Math.min(now, o.expiresAt), outcome: 'missed', points: 0 }); s.queue = []; s.selected = null; s.endedAt = Math.min(now, s.startedAt + s.duration * 1000); }
const int = (v, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
export function validCakeRecords(v) { try {
    return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every(k => ['easy', 'normal', 'challenge'].includes(k)) && Object.values(v).every(r => int(r.best, 11550) && int(r.plays) && int(r.exact) && int(r.processed) && r.exact <= r.processed);
}
catch {
    return false;
} }
export function recordRush(records, s) { const r = rushStats(s), old = records[s.difficulty] ?? { best: 0, plays: 0, exact: 0, processed: 0 }; records[s.difficulty] = { best: Math.max(old.best, r.score), plays: old.plays + 1, exact: old.exact + r.exact, processed: old.processed + r.processed }; }
export function validCakeRush(v) { try {
    const s = v;
    if (!s || s.version !== 1 || !int(s.seed, 4294967295) || !['easy', 'normal', 'challenge'].includes(s.difficulty) || !int(s.duration, 60) || s.duration < 30 || !int(s.startedAt) || !int(s.generated, 9) || !Array.isArray(s.queue) || s.queue.length > rushConfig[s.difficulty].slots || !Array.isArray(s.history) || s.history.length > 9)
        return false;
    const all = [...s.history.map(h => h.order), ...s.queue], ids = all.map(o => o.id);
    if (ids.length !== s.generated || new Set(ids).size !== ids.length || ids.some(i => !int(i, 8) || i >= s.generated) || s.selected !== null && !s.queue.some(o => o.id === s.selected))
        return false;
    const end = s.startedAt + s.duration * 1000, recipes = recipeSequence(s.seed, s.difficulty);
    for (const o of all) {
        const d = o.draft;
        if (JSON.stringify(o.recipe) !== JSON.stringify(recipes[o.id]) || !int(o.createdAt) || o.createdAt < s.startedAt || o.createdAt >= end || o.expiresAt !== Math.min(end, o.createdAt + rushConfig[s.difficulty].patience * 1000) || !d || ![null, 'vanilla', 'strawberry', 'cocoa'].includes(d.sheet) || ![null, 'white', 'pink', 'cocoa'].includes(d.cream) || ![null, 'heart', 'star'].includes(d.ornament) || !Array.isArray(d.fruits) || d.fruits.length !== 6 || !d.fruits.every(f => [null, 'strawberry', 'chocolate', 'blueberry'].includes(f)))
            return false;
    }
    let combo = 0;
    for (const h of s.history) {
        if (!int(h.at) || h.at < h.order.createdAt || h.at > h.order.expiresAt || !['exact', 'partial', 'missed'].includes(h.outcome) || h.outcome !== 'missed' && (h.outcome === 'exact') !== (orderAccuracy(h.order) === 1) || h.points !== (h.outcome === 'missed' ? 0 : points(h.order, h.at, combo)))
            return false;
        combo = h.outcome === 'exact' ? combo + 1 : 0;
    }
    return (s.endedAt === undefined || int(s.endedAt) && s.endedAt >= s.startedAt && s.endedAt <= end && !s.queue.length && s.selected === null) && rushStats(s).score <= 11550;
}
catch {
    return false;
} }
export const orderBase = (conditions) => conditions === 2 ? 800 : conditions === 3 ? 1000 : 1200;
export const rushMaxScore = (d) => ({ easy: 9350, normal: 9750, challenge: 11550 })[d];
