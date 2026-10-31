import { arcadeOpen, difficultyIndex, randomFor } from './arcadeTypes.js';
export const rotatePipe = (mask) => ((mask << 1) & 15) | (mask >> 3);
const opposite = [4, 8, 1, 2], bits = [1, 2, 4, 8], dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];
export function machineBlueprint(seed, difficulty, puzzle) { const size = 3 + difficultyIndex(difficulty), r = randomFor(seed + puzzle * 104729), path = [0]; let x = 0, y = 0; while (x < size - 1 || y < size - 1) {
    if (x === size - 1)
        y++;
    else if (y === size - 1)
        x++;
    else if (r() < .5)
        x++;
    else
        y++;
    path.push(y * size + x);
} const solution = Array(size * size).fill(0); path.forEach((cell, i) => { const before = i ? path[i - 1] : -1, next = i < path.length - 1 ? path[i + 1] : -2; const bit = (n) => n === -1 ? 8 : n === -2 ? 2 : n === cell + 1 ? 2 : n === cell - 1 ? 8 : n > cell ? 4 : 1; solution[cell] = bit(before) | bit(next); }); const heaters = [path[Math.floor(path.length / 2)], ...difficulty === 'challenge' ? [path[path.length - 2]] : []]; const pieces = solution.map(mask => { let v = mask || ((difficulty === 'easy' || r() < .3) ? 0 : r() < .5 ? 5 : 3); for (let n = Math.floor(r() * 4); n > 0; n--)
    v = rotatePipe(v); return v; }); return { size, solution, pieces, heaters }; }
export function newMachine(seed, difficulty, now) { const b = machineBlueprint(seed, difficulty, 0); return { version: 1, kind: 'machine', difficulty, seed: seed >>> 0, startedAt: now, duration: 45, message: '전원을 켜고, 물 입구에서 가열 장치를 지나 추출구까지 파이프를 이어요.', puzzle: 0, size: b.size, pieces: b.pieces, heaters: b.heaters, power: false, moves: 0, checks: 0, history: [] }; }
export function machineFlow(s) { const seen = new Set(); if (!(s.pieces[0] & 8) || !s.power)
    return seen; const q = [0]; seen.add(0); while (q.length) {
    const cell = q.shift(), x = cell % s.size, y = Math.floor(cell / s.size);
    for (let d = 0; d < 4; d++) {
        const nx = x + dx[d], ny = y + dy[d], n = ny * s.size + nx;
        if (nx >= 0 && ny >= 0 && nx < s.size && ny < s.size && (s.pieces[cell] & bits[d]) && (s.pieces[n] & opposite[d]) && !seen.has(n)) {
            seen.add(n);
            q.push(n);
        }
    }
} return seen; }
export function rotateMachine(s, index, now) { if (!arcadeOpen(s, now) || !Number.isInteger(index) || index < 0 || index >= s.pieces.length || s.pieces[index] === 0)
    return false; s.pieces[index] = rotatePipe(s.pieces[index]); s.moves++; s.message = '파이프를 90도 돌렸어요. 파란 물길을 살펴봐요.'; return true; }
export function checkMachine(s, now) { if (!arcadeOpen(s, now))
    return false; const flow = machineFlow(s), success = flow.has(s.size * s.size - 1) && !!(s.pieces.at(-1) & 2) && s.heaters.every(n => flow.has(n)); s.checks++; if (!success) {
    s.message = !s.power ? '먼저 전원을 켜 주세요.' : '아직 연결되지 않았어요. 파란 물길·가열 장치·추출구를 확인해요.';
    return true;
} const score = 3000 + Math.max(0, 600 - s.moves * 8) + Math.max(0, 400 - s.checks * 40); s.history.push({ score, moves: s.moves, checks: s.checks }); s.puzzle++; s.message = '커피 추출 성공! 다음 머신도 부탁해요.'; if (s.puzzle === 3) {
    s.endedAt = now;
    return true;
} const b = machineBlueprint(s.seed, s.difficulty, s.puzzle); s.pieces = b.pieces; s.heaters = b.heaters; s.moves = 0; s.checks = 0; s.power = false; return true; }
