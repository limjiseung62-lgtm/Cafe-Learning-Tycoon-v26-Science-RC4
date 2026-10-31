import { newSort, sortOrder, tickSort } from './sortGame.js';
import { newMachine, machineBlueprint, rotatePipe } from './machineGame.js';
import { newTray, trayMap } from './trayGame.js';
export function newArcade(kind, difficulty, seed, now) { return kind === 'sort' ? newSort(seed, difficulty, now) : kind === 'machine' ? newMachine(seed, difficulty, now) : newTray(seed, difficulty, now); }
export function tickArcade(s, now) { if (s.endedAt !== undefined)
    return; if (s.kind === 'sort')
    tickSort(s, now); if (now >= s.startedAt + 45000)
    s.endedAt = s.startedAt + 45000; }
export function arcadeStats(s) { const score = s.kind === 'tray' ? s.score : s.history.reduce((n, h) => n + h.score, 0), processed = s.kind === 'sort' ? s.history.length : s.kind === 'machine' ? s.history.length : s.deliveries, exact = s.kind === 'sort' ? s.history.filter(h => h.exact).length : processed, accuracy = s.kind === 'sort' ? (processed ? Math.round(s.history.reduce((n, h) => n + h.accuracy, 0) / processed) : 0) : s.kind === 'machine' ? (processed ? Math.round(processed / Math.max(1, s.history.reduce((n, h) => n + h.checks, 0) + (s.puzzle < 3 ? s.checks : 0)) * 100) : 0) : processed ? Math.max(0, 100 - s.collisions * 10) : 0; return { score, processed, exact, accuracy, stars: score >= 7000 ? 3 : score >= 3000 ? 2 : 1 }; }
const num = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const integer = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => num(v, min, max) && Number.isInteger(v);
export function validArcade(v) {
    try {
        const s = v;
        if (!s || s.version !== 1 || !['sort', 'machine', 'tray'].includes(s.kind) || !['easy', 'normal', 'challenge'].includes(s.difficulty) || !integer(s.seed, 0, 0xffffffff) || !num(s.startedAt) || s.duration !== 45 || typeof s.message !== 'string' || s.message.length > 250 || s.endedAt !== undefined && !num(s.endedAt, s.startedAt, s.startedAt + 45000))
            return false;
        if (s.kind === 'sort') {
            if (!integer(s.generated, 2, 12) || !integer(s.selected, 0, 3) || !Array.isArray(s.queue) || s.queue.length > 4 || !Array.isArray(s.history) || s.queue.length + s.history.length !== s.generated)
                return false;
            const ids = [...s.queue.map(o => o.id), ...s.history.map(h => h.id)];
            return new Set(ids).size === ids.length && ids.every(id => integer(id, 0, s.generated - 1)) && s.queue.every(o => JSON.stringify(o.need) === JSON.stringify(sortOrder(s.seed, s.difficulty, o.id, 0).need) && Array.isArray(o.placed) && o.placed.length === 4 && o.placed.every(n => integer(n, 0, 6)) && num(o.expiresAt, s.startedAt, s.startedAt + 65000)) && s.history.every(h => num(h.score, 0, 1000) && num(h.accuracy, 0, 100) && typeof h.exact === 'boolean' && typeof h.note === 'string');
        }
        if (s.kind === 'machine') {
            if (!integer(s.puzzle, 0, 3) || s.history.length !== s.puzzle || !s.history.every(h => integer(h.score, 0, 4000) && integer(h.moves, 0, 2000) && integer(h.checks, 1, 2000)) || typeof s.power !== 'boolean' || !integer(s.moves, 0, 2000) || !integer(s.checks, 0, 2000))
                return false;
            const b = machineBlueprint(s.seed, s.difficulty, Math.min(s.puzzle, 2));
            if (s.size !== b.size || JSON.stringify(s.heaters) !== JSON.stringify(b.heaters) || s.pieces.length !== b.pieces.length)
                return false;
            return s.pieces.every((m, i) => { let v = b.pieces[i]; for (let n = 0; n < 4; n++) {
                if (m === v)
                    return true;
                v = rotatePipe(v);
            } return false; });
        }
        const m = trayMap(s.seed, s.difficulty, Math.min(s.deliveries, 2), s.mapVersion ?? 1);
        return (s.mapVersion === undefined || s.mapVersion === 2 || s.mapVersion === 3 || s.mapVersion === 4 || s.mapVersion === 5) && integer(s.x, 0, 8) && integer(s.y, 0, 6) && [null, 'up', 'right', 'down', 'left'].includes(s.lastDirection) && num(s.balance, 0, 100) && integer(s.food, 0, 4) && integer(s.collisions, 0, 1000) && integer(s.deliveries, 0, 3) && integer(s.score, 0, 12000) && integer(s.steps, 0, 3000) && num(s.nextMoveAt, s.startedAt, s.startedAt + 45200) && num(s.collisionAt, s.startedAt - 1000, s.startedAt + 45000) && JSON.stringify(s.path) === JSON.stringify(m.path) && JSON.stringify(s.obstacles) === JSON.stringify(m.obstacles);
    }
    catch {
        return false;
    }
}
