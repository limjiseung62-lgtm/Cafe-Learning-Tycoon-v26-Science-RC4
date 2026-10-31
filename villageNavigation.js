import { townScene, lakeScene } from './villageSceneData.js';
export const sceneFor = (id) => id === 'town' ? townScene : lakeScene;
export const navCell = 20, footRadius = 10;
export const lakeShore = 'M235 305 C320 180 510 160 650 235 C735 280 830 240 915 320 C940 375 880 425 900 455 C945 500 970 590 900 690 C960 790 825 755 770 845 C710 940 540 925 390 850 C280 795 220 690 190 590 C160 485 150 400 235 305Z';
export const riverPath = 'M870 350Q1025 360 1025 250V0';
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const segmentDistance = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); };
function quadratic(a, c, b, n = 24) { return Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return { x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y }; }); }
function cubic(a, c, d, b) { return Array.from({ length: 25 }, (_, i) => { const t = i / 24; return { x: (1 - t) ** 3 * a.x + 3 * (1 - t) ** 2 * t * c.x + 3 * (1 - t) * t * t * d.x + t ** 3 * b.x, y: (1 - t) ** 3 * a.y + 3 * (1 - t) ** 2 * t * c.y + 3 * (1 - t) * t * t * d.y + t ** 3 * b.y }; }); }
const shorePoints = [];
let shoreAt = { x: 235, y: 305 };
for (const [x1, y1, x2, y2, x, y] of [[320, 180, 510, 160, 650, 235], [735, 280, 830, 240, 915, 320], [940, 375, 880, 425, 900, 455], [945, 500, 970, 590, 900, 690], [960, 790, 825, 755, 770, 845], [710, 940, 540, 925, 390, 850], [280, 795, 220, 690, 190, 590], [160, 485, 150, 400, 235, 305]]) {
    shorePoints.push(...cubic(shoreAt, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }));
    shoreAt = { x, y };
}
const riverPoints = [...quadratic({ x: 870, y: 350 }, { x: 1025, y: 360 }, { x: 1025, y: 250 }), { x: 1025, y: 0 }];
export function insidePolygon(p, poly) { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)
        inside = !inside;
} return inside; }
const lineDistance = (p, line) => { let d = Infinity; for (let i = 1; i < line.length; i++)
    d = Math.min(d, segmentDistance(p, line[i - 1], line[i])); return d; };
export function sceneRoads(scene) {
    return scene.edges.map(([from, to]) => {
        const a = { x: scene.nodes[from][0], y: scene.nodes[from][1] }, b = { x: scene.nodes[to][0], y: scene.nodes[to][1] }, bend = (from.length % 2 ? 1 : -1) * .09, c = { x: (a.x + b.x) / 2 - (b.y - a.y) * bend, y: (a.y + b.y) / 2 + (b.x - a.x) * bend };
        const original = quadratic(a, c, b);
        const crosses = original.some(p => scene.buildings.some(building => rectHit(p, building.footprint, footRadius)));
        if (!crosses)
            return { from, to, d: `M${a.x},${a.y} Q${c.x},${c.y} ${b.x},${b.y}`, points: original };
        const approach = (id, door, other) => { const building = scene.buildings.find(x => x.id === id); if (!building)
            return [door]; const below = { x: door.x, y: Math.min(1170, door.y + 80) }; if (other.y >= door.y + 60)
            return [door, below]; const side = other.x < door.x ? building.footprint.x - 65 : building.footprint.x + building.footprint.w + 65; return [door, below, { x: side, y: below.y }, { x: side, y: other.y }]; };
        const raw = [...approach(from, a, b), ...approach(to, b, a).reverse()], way = raw.filter((p, i) => !i || distance(p, raw[i - 1]) > .1), points = [way[0]];
        let d = 'M' + way[0].x + ',' + way[0].y, last = way[0];
        const line = (end) => { const n = Math.max(1, Math.ceil(distance(last, end) / 8)); for (let k = 1; k <= n; k++)
            points.push({ x: last.x + (end.x - last.x) * k / n, y: last.y + (end.y - last.y) * k / n }); last = end; d += ' L' + end.x + ',' + end.y; };
        for (let i = 1; i < way.length - 1; i++) {
            const previous = way[i - 1], corner = way[i], next = way[i + 1], r = Math.min(30, distance(previous, corner) / 3, distance(corner, next) / 3), before = { x: corner.x + (previous.x - corner.x) / distance(previous, corner) * r, y: corner.y + (previous.y - corner.y) / distance(previous, corner) * r }, after = { x: corner.x + (next.x - corner.x) / distance(next, corner) * r, y: corner.y + (next.y - corner.y) / distance(next, corner) * r };
            line(before);
            points.push(...quadratic(before, corner, after));
            last = after;
            d += ' Q' + corner.x + ',' + corner.y + ' ' + after.x + ',' + after.y;
        }
        line(way.at(-1));
        return { from, to, d, points };
    });
}
const roadCache = new WeakMap();
const roads = (s) => { if (!roadCache.has(s))
    roadCache.set(s, sceneRoads(s)); return roadCache.get(s); };
export function bridgeDeck(p, r = footRadius) { return p.x >= 925 + r && p.x <= 1125 - r && p.y >= 255 + r && p.y <= 305 - r; }
export function lakeWater(p, r = 0) { return insidePolygon(p, shorePoints) || lineDistance(p, shorePoints) < r || lineDistance(p, riverPoints) < 37.5 + r; }
const rectHit = (p, r, pad = 0) => p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;
function baseOpen(scene, p, r = footRadius) { if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < r || p.y < r || p.x > 1600 - r || p.y > 1200 - r)
    return false; if (scene.blockers?.some(b => rectHit(p, b, r)))
    return false; if (scene.buildings.some(b => rectHit(p, b.footprint, r)))
    return false; if (scene.id === 'lake' && lakeWater(p, r) && !bridgeDeck(p, r))
    return false; const plaza = scene.id === 'town' && ((p.x - 775) / (191 - r)) ** 2 + ((p.y - 660) / (132 - r)) ** 2 <= 1; return plaza || roads(scene).some(road => lineDistance(p, road.points) <= 37 - r); }
const propCache = new WeakMap();
export function sceneProps(scene) {
    if (propCache.has(scene))
        return propCache.get(scene);
    const list = [], add = (tile, x, y, w, force = false) => { if (!force) {
        const rx = tile === 0 ? 32 : tile === 4 ? 16 : w * .37 + 10, ry = tile === 0 ? 32 : tile === 4 ? 16 : 22;
        const probes = [{ x, y: y - 10 }, ...Array.from({ length: 16 }, (_, i) => ({ x: x + Math.cos(i / 16 * Math.PI * 2) * rx, y: y - 10 + Math.sin(i / 16 * Math.PI * 2) * ry }))];
        if (probes.some(p => baseOpen(scene, p)))
            return;
    } list.push({ tile, x, y, w, solid: tile !== 8, bridge: tile === 8 }); };
    for (let i = 0; i < 13; i++)
        add(0, 65 + i * 122, 110 + i % 3 * 36, 135 + i % 2 * 18);
    for (let i = 0; i < 8; i++) {
        const y = 245 + i * 119;
        add(0, 55 + i % 2 * 29, y, 150);
        if (!(scene.id === 'town' && y > 480 && y < 760))
            add(0, 1530 - i % 2 * 24, y, 150);
    }
    for (const [x, y] of scene.id === 'town' ? [[560, 365], [1025, 380], [112, 1010], [455, 1120], [870, 1160], [1500, 930], [1350, 200], [585, 820]] : [[115, 760], [160, 1070], [790, 1110], [920, 240], [1200, 160], [1500, 520], [690, 1100]])
        add(0, x, y, 140);
    for (const [x, y] of scene.id === 'town' ? [[545, 460], [1000, 450], [530, 850], [1220, 870], [470, 1010], [1400, 590]] : [[1150, 450], [1180, 920], [420, 1120], [680, 1000], [1440, 460]])
        add(1, x, y, 125);
    if (scene.id === 'town') {
        add(2, 775, 650, 170, true);
        for (const [x, y] of [[620, 830], [935, 820]])
            add(3, x, y, 120);
        for (const [x, y] of [[560, 585], [995, 585], [620, 905], [1300, 570], [440, 850], [930, 1080]])
            add(4, x, y, 58);
        for (const [x, y] of [[525, 1130], [695, 1150]])
            add(5, x, y, 150);
        add(1, 630, 900, 140);
    }
    else {
        add(8, 1025, 305, 240, true);
        add(3, 905, 950, 130);
        add(3, 520, 1040, 130);
        add(4, 1160, 690, 60);
        add(4, 1320, 930, 60);
        add(5, 980, 1050, 120);
        add(1, 1060, 740, 120);
    }
    if (scene.id === 'town' && scene.progressionStage) {
        const stage = scene.progressionStage;
        for (let i = list.length - 1; i >= 0; i--)
            if ([3, 4, 5].includes(list[i].tile))
                list.splice(i, 1);
        if (stage === 1) {
            const fountain = list.find(p => p.tile === 2);
            if (fountain)
                fountain.w = 115;
        }
        list.push(...scene.extraProps ?? []);
    }
    propCache.set(scene, list);
    return list;
}
function propHit(p, o) { if (!o.solid)
    return false; if (o.tile === 0)
    return distance(p, { x: o.x, y: o.y - 10 }) < 22 + footRadius; if (o.tile === 4)
    return distance(p, { x: o.x, y: o.y - 5 }) < 6 + footRadius; const rx = o.w * (o.tile === 2 ? .40 : .37) + footRadius, ry = o.tile === 2 ? 25 + footRadius : 12 + footRadius; return ((p.x - o.x) / rx) ** 2 + ((p.y - (o.y - 10)) / ry) ** 2 < 1; }
export function sceneWalkable(scene, p) { return baseOpen(scene, p) && !sceneProps(scene).some(o => propHit(p, o)); }
const meshCache = new WeakMap();
function mesh(scene) { if (meshCache.has(scene))
    return meshCache.get(scene); const open = new Uint8Array(80 * 60), points = []; for (let y = 0; y < 60; y++)
    for (let x = 0; x < 80; x++) {
        const p = { x: x * 20 + 10, y: y * 20 + 10 };
        if (sceneWalkable(scene, p)) {
            open[y * 80 + x] = 1;
            points.push(p);
        }
    } const value = { open, points }; meshCache.set(scene, value); return value; }
export function nearestScenePoint(scene, p) { const candidates = mesh(scene).points; let best = candidates[0], d = Infinity; for (const q of candidates) {
    const n = distance(p, q);
    if (n < d) {
        d = n;
        best = q;
    }
} return { ...best }; }
const index = (p) => Math.floor(p.y / 20) * 80 + Math.floor(p.x / 20);
export function sceneSegmentOpen(scene, a, b) { const n = Math.ceil(distance(a, b) / 2); for (let i = 0; i <= n; i++)
    if (!sceneWalkable(scene, { x: a.x + (b.x - a.x) * i / (n || 1), y: a.y + (b.y - a.y) * i / (n || 1) }))
        return false; return true; }
export function scenePath(scene, from, to) { if (!sceneWalkable(scene, to))
    return []; const a = nearestScenePoint(scene, from), b = nearestScenePoint(scene, to), start = index(a), goal = index(b), m = mesh(scene), queue = [start], g = new Map([[start, 0]]), parent = new Map(); const point = (i) => ({ x: i % 80 * 20 + 10, y: Math.floor(i / 80) * 20 + 10 }); while (queue.length) {
    queue.sort((x, y) => g.get(x) + distance(point(x), b) - g.get(y) - distance(point(y), b));
    const at = queue.shift();
    if (at === goal) {
        const ids = [goal];
        while (ids[0] !== start)
            ids.unshift(parent.get(ids[0]));
        const points = ids.map(point);
        if (!sceneSegmentOpen(scene, from, points[0]))
            return [];
        points.unshift({ ...from });
        if (sceneSegmentOpen(scene, points.at(-1), to))
            points.push({ ...to });
        return points;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const x = at % 80 + dx, y = Math.floor(at / 80) + dy, n = y * 80 + x;
        if (x < 0 || x >= 80 || y < 0 || y >= 60 || !m.open[n] || !sceneSegmentOpen(scene, point(at), point(n)))
            continue;
        if (dx && dy && (!m.open[Math.floor(at / 80) * 80 + x] || !m.open[y * 80 + at % 80]))
            continue;
        const cost = g.get(at) + Math.hypot(dx, dy) * 20;
        if (cost < (g.get(n) ?? Infinity)) {
            g.set(n, cost);
            parent.set(n, at);
            if (!queue.includes(n))
                queue.push(n);
        }
    }
} return []; }
export function sceneTarget(scene, id) { const n = scene.nodes[id]; return n ? nearestScenePoint(scene, { x: n[0], y: n[1] }) : undefined; }
export function residentTarget(scene, id) { const r = scene.residents.find(r => r[0] === id); return r ? nearestScenePoint(scene, { x: r[3], y: r[4] }) : undefined; }
const legacyAnchors = { town: { cafe: [3, 5], flowers: [11, 5], market: [20, 5], mill: [3, 15], workshop: [11, 15], plaza: [12, 9], west: [7, 8], south: [12, 16] }, lake: { site: [19, 14], kiosk: [20, 4], photo: [5, 14], lookout: [10, 5], landing: [16, 10], entry: [23, 10] } };
export function restoreSceneLocation(scene, legacy, raw) { const old = raw; let point; if (old?.version === 2 && old.region === scene.id && typeof old.x === 'number' && Number.isFinite(old.x) && typeof old.y === 'number' && Number.isFinite(old.y))
    point = { x: old.x, y: old.y }; if (!point) {
    const entries = Object.entries(legacyAnchors[scene.id]).sort((a, b) => Math.hypot(a[1][0] - legacy.x, a[1][1] - legacy.y) - Math.hypot(b[1][0] - legacy.x, b[1][1] - legacy.y));
    const anchor = scene.nodes[entries[0][0]] ?? scene.nodes[scene.start];
    point = { x: anchor[0], y: anchor[1] };
} const safe = sceneWalkable(scene, point) ? point : nearestScenePoint(scene, point); return { version: 2, region: scene.id, ...safe }; }
export function sceneCamera(view, p, overview = false) { const scale = overview ? Math.min(view.width / 1600, view.height / 1200) : Math.max(1, view.width / 1600); return { scale, x: Math.max(Math.min(0, view.width - 1600 * scale), Math.min(0, view.width * .48 - p.x * scale)), y: Math.max(Math.min(0, view.height - 1200 * scale), Math.min(0, view.height * .55 - p.y * scale)) }; }
