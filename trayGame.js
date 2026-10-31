import { arcadeOpen, difficultyIndex, randomFor } from './arcadeTypes.js';
export const trayWidth = 9, trayHeight = 7;
export function trayMap(seed, difficulty, round, mapVersion = 5) { const r = randomFor(seed + round * 3571), path = [27]; let x = 0, y = 3; while (x < 8) {
    if (x % 2 === 1) {
        const target = mapVersion >= 2 && difficulty === 'easy' ? (x % 4 === 1 ? (mapVersion >= 5 ? 1 + Math.floor(r() * 2) : 1) : (mapVersion >= 5 ? 4 + Math.floor(r() * 2) : 5)) : 1 + Math.floor(r() * 5);
        while (y !== target) {
            y += Math.sign(target - y);
            path.push(y * 9 + x);
        }
    }
    x++;
    path.push(y * 9 + x);
} while (y !== 3) {
    y += Math.sign(3 - y);
    path.push(y * 9 + x);
} const obstacles = []; for (let cell = 0; cell < 63; cell++)
    if (!path.includes(cell) && r() < [.1, .2, .3][difficultyIndex(difficulty)])
        obstacles.push({ x: cell % 9, y: Math.floor(cell / 9), moving: difficulty === 'challenge' && r() < .22 }); if (mapVersion >= 2 && difficulty === 'easy')
    for (const gx of [2, 4, 6])
        if (!path.includes(27 + gx) && !obstacles.some(o => o.x === gx && o.y === 3))
            obstacles.push({ x: gx, y: 3, moving: false }); if (mapVersion >= 3 && (difficulty !== 'easy' || mapVersion >= 4)) {
    for (const o of obstacles)
        o.moving = false;
    const count = mapVersion >= 4 ? [2, 4, 6][difficultyIndex(difficulty)] : difficulty === 'normal' ? 2 : 5;
    const columns = [1, 2, 3, 4, 5, 6, 7];
    if (mapVersion >= 5)
        for (let n = columns.length - 1; n > 0; n--) {
            const j = Math.floor(r() * (n + 1));
            [columns[n], columns[j]] = [columns[j], columns[n]];
        }
    if (mapVersion >= 5 && difficulty === 'easy') {
        columns[0] = 1 + Math.floor(r() * 3);
        columns[1] = 5 + Math.floor(r() * 3);
    }
    for (let i = 0; i < count; i++) {
        const gx = mapVersion >= 5 ? columns[i] : mapVersion >= 4 ? (difficulty === 'easy' ? 2 + i * 4 : difficulty === 'normal' ? 1 + i * 2 : 1 + i) : 1 + i * (difficulty === 'normal' ? 4 : 1), gy = mapVersion >= 5 ? 1 + Math.floor(r() * 3) : [2, 4, 0, 6, 1, 5, 3].find(y => !path.includes(y * 9 + gx)) ?? 0;
        const at = obstacles.find(o => o.x === gx && o.y === gy);
        if (at)
            at.moving = true;
        else
            obstacles.push({ x: gx, y: gy, moving: true });
    }
} return { path, obstacles }; }
export function newTray(seed, difficulty, now) { const m = trayMap(seed, difficulty, 0); return { version: 1, kind: 'tray', mapVersion: 5, difficulty, seed: seed >>> 0, startedAt: now, duration: 45, message: '방향키·WASD 또는 방향 버튼으로 배달해요. 급회전보다 안전 운전!', x: 0, y: 3, lastDirection: null, balance: 100, food: 2 + difficultyIndex(difficulty), collisions: 0, deliveries: 0, score: 0, obstacles: m.obstacles, path: m.path, nextMoveAt: now, collisionAt: now - 1000, steps: 0 }; }
export function trayMotionPeriod(s) { return (s.mapVersion ?? 1) >= 4 ? [1100, 800, 500][difficultyIndex(s.difficulty)] : s.mapVersion === 3 ? (s.difficulty === 'challenge' ? 650 : 1100) : 1200; }
function patrolY(s, y, dy) { return (s.mapVersion ?? 1) >= 3 ? (y + dy > 6 ? 12 - y - dy : y + dy) : Math.min(6, y + dy); }
// Seeded bounded walk: reproducible after refresh, with independent direction choices per guest.
function guestOffset(s, index, phase) { const r = randomFor((s.seed + index * 7919 + s.deliveries * 3571) >>> 0), step = phase % 64; let y = 0; if (s.mapVersion === 5 && step < 4)
    return [0, 1, 2, 1][step]; for (let n = 0; n < Math.min(step, 62); n++) {
    const dir = r() < .5 ? -1 : 1;
    y = y === 0 ? 1 : y === 2 ? 1 : y + dir;
} if (step === 63)
    y = 1; return y; }
export function trayObstacles(s, now) { const lanes = new Set(); for (const o of s.obstacles)
    if (o.moving)
        for (const dy of (s.mapVersion ?? 1) >= 4 || ((s.mapVersion ?? 1) >= 3 && s.difficulty === 'challenge') ? [0, 1, 2] : [0, 1])
            lanes.add(patrolY(s, o.y, dy) * 9 + o.x); return s.obstacles.map((o, i) => { if (!o.moving)
    return o; const phase = Math.floor((now - s.startedAt) / trayMotionPeriod(s) + i), dy = (s.mapVersion ?? 1) >= 4 ? guestOffset(s, i, phase) : (s.mapVersion ?? 1) >= 3 && s.difficulty === 'challenge' ? [0, 1, 2, 1][phase % 4] : phase % 2, y = patrolY(s, o.y, dy); return (o.x === 0 || o.x === 8) && y === 3 ? o : { ...o, y, moving: true }; }).filter(o => o.moving || !lanes.has(o.y * 9 + o.x)); }
export function moveTray(s, direction, now) {
    if (!arcadeOpen(s, now) || !['up', 'right', 'down', 'left'].includes(direction) || now < s.nextMoveAt)
        return false;
    const [dx, dy] = ({ up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] })[direction], nx = s.x + dx, ny = s.y + dy, turn = s.lastDirection !== null && s.lastDirection !== direction, rest = Math.max(0, now - s.nextMoveAt);
    s.balance = Math.min(100, s.balance + Math.min(15, rest / 80));
    s.nextMoveAt = now + 180;
    s.steps++;
    if (nx < 0 || ny < 0 || nx >= 9 || ny >= 7 || trayObstacles(s, now).some(o => o.x === nx && o.y === ny)) {
        if (now - s.collisionAt >= 500) {
            s.collisions++;
            s.balance = Math.max(0, s.balance - ((s.mapVersion ?? 1) >= 4 ? [24, 30, 40][difficultyIndex(s.difficulty)] : s.mapVersion === 3 && s.difficulty === 'challenge' ? 34 : 24));
            s.collisionAt = now;
            s.message = '부딪혔어요. 잠깐 쉬고 다른 길로 가요.';
        }
        return true;
    }
    if (turn)
        s.balance = Math.max(0, s.balance - ((s.mapVersion ?? 1) >= 4 ? [12, 18, 26] : s.mapVersion === 3 ? [10, 14, 22] : [10, 12, 14])[difficultyIndex(s.difficulty)]);
    s.lastDirection = direction;
    s.x = nx;
    s.y = ny;
    if (s.balance <= 15 && s.food > 0) {
        s.food--;
        s.balance = 60;
        s.message = '음식을 하나 놓쳤어요. 남은 음식은 안전하게 배달해요.';
    }
    if (nx === 8 && ny === 3) {
        if (s.food === 0) {
            s.x = 0;
            s.y = 3;
            s.food = 2 + difficultyIndex(s.difficulty);
            s.balance = 100;
            s.message = '음식을 모두 놓쳤어요. 새 트레이로 다시 출발해요.';
            return true;
        }
        s.deliveries++;
        s.score += 1500 + s.food * 400 + Math.round(s.balance * 2) + Math.round(Math.max(0, 45 - (now - s.startedAt) / 1000) * 2);
        s.message = '안전 배달 완료! 다음 트레이를 준비했어요.';
        if (s.deliveries === 3) {
            s.endedAt = now;
            return true;
        }
        const m = trayMap(s.seed, s.difficulty, s.deliveries, s.mapVersion ?? 1);
        s.obstacles = m.obstacles;
        s.path = m.path;
        s.x = 0;
        s.y = 3;
        s.food = 2 + difficultyIndex(s.difficulty);
        s.balance = 100;
        s.lastDirection = null;
    }
    return true;
}
