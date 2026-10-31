import { freeBody } from './freeLayoutModel.js';
const graphs = new WeakMap();
export const freeRouteMetrics = { graphs: 0, searches: 0, connectivity: 0 };
const distance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3);
function segment(a, b, rects) { return !rects.some(r => { let lo = 0, hi = 1; for (const axis of ['x', 'y']) {
    const min = axis === 'x' ? r.left : r.top, max = axis === 'x' ? r.right : r.bottom, delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-9) {
        if (a[axis] <= min || a[axis] >= max)
            return false;
    }
    else {
        const u = (min - a[axis]) / delta, v = (max - a[axis]) / delta;
        lo = Math.max(lo, Math.min(u, v));
        hi = Math.min(hi, Math.max(u, v));
        if (lo >= hi)
            return false;
    }
} return lo < hi && hi > 0 && lo < 1; }); }
const occupied = (p, rs) => rs.some(r => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom);
function graph(s) { const old = graphs.get(s); if (old)
    return old; freeRouteMetrics.graphs++; const rects = [...s.tables.map(freeBody), ...s.extraObstacles ?? []], points = [], edges = [], indices = new Map(); for (let y = 42; y <= 99; y += 1.5)
    for (let x = 4; x <= 96; x++) {
        const p = { x, y };
        if (occupied(p, rects))
            continue;
        indices.set(x + ':' + y, points.length);
        points.push(p);
        edges.push([]);
    } for (let i = 0; i < points.length; i++) {
    const a = points[i];
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1.5], [0, 1.5], [-1, -1.5], [1, -1.5], [-1, 1.5], [1, 1.5]]) {
        const j = indices.get((a.x + dx) + ':' + (a.y + dy));
        if (j !== undefined && segment(a, points[j], rects))
            edges[i].push(j);
    }
} const components = points.map(() => -1); let group = 0; for (let i = 0; i < points.length; i++)
    if (components[i] < 0) {
        components[i] = group;
        const queue = [i];
        for (let q = 0; q < queue.length; q++)
            for (const j of edges[queue[q]])
                if (components[j] < 0) {
                    components[j] = group;
                    queue.push(j);
                }
        group++;
    } const g = { points, edges, rects, components }; graphs.set(s, g); return g; }
function connect(g, p) { if (occupied(p, g.rects))
    return []; return g.points.map((q, i) => ({ i, d: distance(p, q) })).filter(x => x.d < 10).sort((a, b) => a.d - b.d).slice(0, 24).filter(x => segment(p, g.points[x.i], g.rects)).map(x => x.i); }
export function freeConnected(s, points) { freeRouteMetrics.connectivity++; const g = graph(s), root = new Set(connect(g, s.entrance).map(i => g.components[i])); return points.map(p => connect(g, p).some(i => root.has(g.components[i]))); }
function avoidClear(a, b, avoid) { return !avoid.some(p => { if (distance(a, p) < 3.99)
    return distance(b, p) < distance(a, p); const dx = b.x - a.x, dy = (b.y - a.y) * 2 / 3, px = p.x - a.x, py = (p.y - a.y) * 2 / 3, den = dx * dx + dy * dy, t = den ? Math.max(0, Math.min(1, (px * dx + py * dy) / den)) : 0; return Math.hypot(px - dx * t, py - dy * t) < 3.99; }); }
export function freeFloorRoute(s, from, to, avoid = []) { freeRouteMetrics.searches++; const g = graph(s), clear = (a, b) => segment(a, b, g.rects) && avoidClear(a, b, avoid); if (clear(from, to))
    return [{ ...from }, { ...to }]; const starts = connect(g, from).filter(i => avoidClear(from, g.points[i], avoid)), ends = new Set(connect(g, to).filter(i => avoidClear(g.points[i], to, avoid))); if (!starts.length || !ends.size)
    throw Error('No free hall route'); const costs = new Float64Array(g.points.length); costs.fill(Infinity); const previous = new Int32Array(g.points.length); previous.fill(-1); const heap = []; const push = (v) => { heap.push(v); let i = heap.length - 1; while (i) {
    const p = (i - 1) >> 1;
    if (heap[p].f <= v.f)
        break;
    heap[i] = heap[p];
    i = p;
} heap[i] = v; }; const pop = () => { const root = heap[0], v = heap.pop(); if (heap.length) {
    let i = 0;
    while (i * 2 + 1 < heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < heap.length && heap[c + 1].f < heap[c].f)
            c++;
        if (heap[c].f >= v.f)
            break;
        heap[i] = heap[c];
        i = c;
    }
    heap[i] = v;
} return root; }; for (const i of starts) {
    costs[i] = distance(from, g.points[i]);
    push({ i, f: costs[i] + distance(g.points[i], to) });
} let finish = -1; const done = new Uint8Array(g.points.length); while (heap.length) {
    const { i } = pop();
    if (done[i])
        continue;
    done[i] = 1;
    if (ends.has(i)) {
        finish = i;
        break;
    }
    for (const j of g.edges[i])
        if (!done[j] && avoidClear(g.points[i], g.points[j], avoid)) {
            const cost = costs[i] + distance(g.points[i], g.points[j]);
            if (cost < costs[j]) {
                costs[j] = cost;
                previous[j] = i;
                push({ i: j, f: cost + distance(g.points[j], to) });
            }
        }
} if (finish < 0)
    throw Error('No free hall route'); const raw = [{ ...to }]; for (let i = finish; i >= 0; i = previous[i])
    raw.unshift(g.points[i]); raw.unshift({ ...from }); const result = [raw[0]]; for (let i = 1; i < raw.length;) {
    let last = i;
    for (let j = i + 1; j < raw.length && clear(result.at(-1), raw[j]); j++)
        last = j;
    result.push({ ...raw[last] });
    i = last + 1;
} return result; }
