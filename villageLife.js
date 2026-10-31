import { nearestScenePoint, sceneWalkable, sceneSegmentOpen, scenePath } from './villageNavigation.js';
export const lifeProfiles = {
    bloom: { role: '꽃집 주인', work: '꽃에 물 주기', rest: '꽃향기 맡기', tool: 'flower', speed: 48 },
    vendor: { role: '시장 상인', work: '진열 정리', rest: '손님 기다리기', tool: 'basket', speed: 53 },
    miller: { role: '제분소 주인', work: '곡물 살피기', rest: '잠깐 쉬기', tool: 'grain', speed: 43 },
    maker: { role: '공방 장인', work: '나무 다듬기', rest: '작업 구상', tool: 'hammer', speed: 50 },
    host: { role: '행사 담당', work: '축제 준비', rest: '광장 둘러보기', tool: 'flag', speed: 59 },
    guide: { role: '마을 안내인', work: '안내도 살피기', rest: '이웃 기다리기', tool: 'map', speed: 56 },
    keeper: { role: '호숫가 관리인', work: '산책로 살피기', rest: '호수 감상', tool: 'flower', speed: 46 },
    seller: { role: '산책로 상인', work: '판매 준비', rest: '손님 기다리기', tool: 'basket', speed: 52 },
    photographer: { role: '사진작가', work: '풍경 촬영', rest: '사진 살펴보기', tool: 'camera', speed: 49 },
    visitor: { role: '여행객', work: '여행 지도 보기', rest: '풍경 감상', tool: 'map', speed: 55 }
};
export const actorRadius = 13, actorGap = 29, talkDistance = 88, approachDistance = 50;
export const separation = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const phases = ['idle', 'walk', 'work', 'walk', 'rest'];
export function localLifePoints(scene, home) { const list = [home]; for (let r = 40; r <= 100; r += 20)
    for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6, p = { x: home.x + Math.cos(a) * r, y: home.y + Math.sin(a) * r };
        if (sceneWalkable(scene, p) && sceneSegmentOpen(scene, home, p) && list.every(q => separation(p, q) > 19))
            list.push(p);
    } return list; }
/** Transient presentation only: never changes café, quest, or learning records. */
export class VillageLife {
    scene;
    actors = [];
    elapsed = 0;
    metrics = { ticks: 0, pathPlans: 0, collisionChecks: 0, yields: 0, offscreenSkipped: 0 };
    constructor(scene, player) {
        this.scene = scene;
        scene.residents.forEach(([id, name, visual, x, y], i) => {
            const home = nearestScenePoint(scene, { x, y }), targets = localLifePoints(scene, home);
            const safe = targets.filter(p => separation(p, player) >= actorGap + 3 && this.actors.every(a => separation(a, p) >= actorGap + 3));
            // If a legacy player position is at the NPC's doorstep, spawn farther along the same safe street.
            let spawn = safe[0];
            if (!spawn)
                for (let r = 120; r <= 200 && !spawn; r += 20)
                    for (let j = 0; j < 16; j++) {
                        const p = nearestScenePoint(scene, { x: home.x + Math.cos(j * Math.PI / 8) * r, y: home.y + Math.sin(j * Math.PI / 8) * r });
                        if (separation(p, player) >= actorGap + 3 && this.actors.every(a => separation(a, p) >= actorGap + 3) && scenePath(scene, home, p).length) {
                            spawn = p;
                            break;
                        }
                    }
            this.actors.push({ id, name, visual, ...spawn ?? home, home, state: i % 3 === 0 ? 'work' : i % 3 === 1 ? 'rest' : 'idle', facing: i % 2 ? 'left' : 'right', remaining: 2 + i * 1.37, cycle: i % 5, route: [], reserved: false, yielding: false, blocked: 0, phase: 0, accumulator: 0, targets });
        });
    }
    actor(id) { return this.actors.find(a => a.id === id); }
    nearest(player) { return this.actors.filter(a => separation(a, player) <= talkDistance && separation(a, player) >= actorGap - 1).sort((a, b) => separation(a, player) - separation(b, player))[0]; }
    reserve(id) { for (const a of this.actors)
        if (a.id === id) {
            a.reserved = true;
            a.route = [];
            a.state = 'greet';
            a.remaining = 2;
        }
        else if (a.reserved)
            this.release(a.id); }
    release(id) { for (const a of this.actors)
        if (!id || a.id === id) {
            a.reserved = false;
            a.state = 'idle';
            a.route = [];
            a.yielding = false;
            a.remaining = 2 + (a.id.length % 3);
        } }
    face(id, player) { const a = this.actor(id); if (a)
        a.facing = player.x < a.x ? 'left' : 'right'; }
    clear(p, except) { return this.actors.every(a => a.id === except || separation(a, p) >= actorGap); }
    /** Ring around a moving resident, not the resident's feet. Reserve before planning. */
    approach(id, from) {
        const a = this.actor(id);
        if (!a)
            return;
        this.reserve(id);
        const angle = Math.atan2(from.y - a.y, from.x - a.x), points = Array.from({ length: 16 }, (_, i) => { const n = angle + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 8; return { x: a.x + Math.cos(n) * approachDistance, y: a.y + Math.sin(n) * approachDistance }; }).filter(p => sceneWalkable(this.scene, p) && this.clear(p));
        for (const p of points) {
            this.metrics.pathPlans++;
            if (scenePath(this.scene, from, p).length)
                return p;
        }
        this.release(id);
        return;
    }
    canPlayerMove(from, to) { this.metrics.collisionChecks++; if (!sceneWalkable(this.scene, to))
        return false; return this.actors.every(a => { const next = separation(a, to), old = separation(a, from); return next >= actorGap || next > old + .01; }); }
    crowded(p) { return this.actors.some(a => separation(a, p) < actorGap); }
    resolvePlayerStep(from, to) { if (this.canPlayerMove(from, to))
        return to; const length = separation(from, to), angle = Math.atan2(to.y - from.y, to.x - from.x); for (const turn of [Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3, Math.PI / 2, -Math.PI / 2]) {
        const p = { x: from.x + Math.cos(angle + turn) * length, y: from.y + Math.sin(angle + turn) * length };
        if (sceneSegmentOpen(this.scene, from, p) && this.canPlayerMove(from, p))
            return p;
    } return; }
    /** Yield into the side of a street when possible; never push or teleport the player. */
    yield(a, player, intent) {
        if (a.reserved)
            return;
        const direction = intent && separation(intent, player) > 1 ? Math.atan2(intent.y - player.y, intent.x - player.x) : Math.atan2(a.y - player.y, a.x - player.x);
        const candidates = [];
        for (const turn of [Math.PI / 2, -Math.PI / 2, 0, Math.PI * .8, -Math.PI * .8])
            for (const r of [22, 36, 55, 75]) {
                const p = { x: a.x + Math.cos(direction + turn) * r, y: a.y + Math.sin(direction + turn) * r };
                if (sceneSegmentOpen(this.scene, a, p) && this.clear(p, a.id) && separation(p, player) >= actorGap + 8 && separation(p, a.home) <= 180)
                    candidates.push(p);
            }
        const lateral = (p) => Math.abs((p.x - player.x) * Math.sin(direction) - (p.y - player.y) * Math.cos(direction));
        candidates.sort((p, q) => lateral(q) - lateral(p));
        if (candidates[0]) {
            a.route = [candidates[0]];
            a.yielding = true;
            a.state = 'walk';
            a.remaining = 2;
            a.blocked = 0;
            this.metrics.yields++;
        }
    }
    tick(dt, player, intent, visible = () => true) {
        dt = Math.min(.1, Math.max(0, dt));
        this.elapsed += dt;
        this.metrics.ticks++;
        for (const a of this.actors) {
            a.accumulator += dt;
            if (!visible(a) && a.accumulator < .5) {
                this.metrics.offscreenSkipped++;
                continue;
            }
            const stepDt = Math.min(.1, a.accumulator);
            a.accumulator = 0;
            if (a.reserved) {
                a.phase += stepDt;
                a.remaining -= stepDt;
                if (a.remaining <= 0)
                    a.state = 'idle';
                this.face(a.id, player);
                continue;
            }
            a.phase += stepDt;
            a.remaining -= stepDt * (this.scene.progressionStage && this.scene.progressionStage >= 2 ? 1.15 : 1);
            if ((separation(a, player) < actorGap + 8 || intent && separation(a, player) < 64) && (!a.yielding || a.blocked > .45)) {
                this.yield(a, player, intent);
            }
            if (a.route.length) {
                const next = a.route[0], d = separation(a, next), step = Math.min(d, stepDt * (a.yielding ? 125 : lifeProfiles[a.id].speed));
                const p = { x: a.x + (next.x - a.x) / (d || 1) * step, y: a.y + (next.y - a.y) / (d || 1) * step };
                const peers = this.actors.every(b => b === a || separation(b, p) >= actorGap || (separation(b, p) > separation(b, a) + .01));
                this.metrics.collisionChecks++;
                if (sceneWalkable(this.scene, p) && peers && (separation(p, player) >= actorGap || separation(p, player) > separation(a, player) + .01)) {
                    a.facing = p.x < a.x ? 'left' : 'right';
                    a.x = p.x;
                    a.y = p.y;
                    a.blocked = 0;
                    if (d <= step + .001)
                        a.route.shift();
                }
                else
                    a.blocked += stepDt;
                if (!a.route.length) {
                    a.yielding = false;
                    a.state = 'idle';
                    a.remaining = 1.5 + (a.id.length % 3);
                }
                else if (a.blocked > 2) {
                    a.route = [];
                    a.remaining = .5;
                    a.yielding = false;
                }
            }
            else if (a.remaining <= 0) {
                a.cycle++;
                a.state = phases[a.cycle % phases.length];
                a.remaining = 4 + (a.id.length * 7 + a.cycle * 3) % 6;
                if (a.state === 'walk') {
                    const candidates = a.targets.filter(p => separation(a, p) > 25 && this.clear(p, a.id) && separation(p, player) > 70);
                    const p = candidates[(a.cycle + a.id.length) % Math.max(1, candidates.length)];
                    if (p) {
                        this.metrics.pathPlans++;
                        a.route = sceneSegmentOpen(this.scene, a, p) ? [p] : scenePath(this.scene, a, p);
                    }
                    if (!a.route.length) {
                        a.state = 'idle';
                        a.remaining = 2;
                    }
                }
                if (a.state === 'rest')
                    a.facing = a.facing === 'left' ? 'right' : 'left';
            }
            // Offscreen actors use the same collision model; only the DOM/animation rendering is culled.
            void visible;
        }
    }
}
export function arrangeNameplates(items, width, height) {
    const out = [];
    for (const item of items.slice().sort((a, b) => b.priority - a.priority)) {
        const w = Math.min(item.width, width - 16);
        for (const dy of [0, -28, 28, -56, 56]) {
            const left = Math.max(8, Math.min(width - w - 8, item.x - w / 2)), top = Math.max(8, Math.min(height - item.height - 8, item.y + dy));
            if (out.every(b => left + w + 5 <= b.left || b.left + b.width + 5 <= left || top + item.height + 4 <= b.top || b.top + b.height + 4 <= top)) {
                out.push({ ...item, width: w, left, top });
                break;
            }
        }
    }
    return out;
}
export function residentLine(id, context) {
    const p = lifeProfiles[id];
    if (context.reaction === 'accept')
        return '도와준다니 정말 고마워! 공부하고 돌아오면 여기서 기다릴게.';
    if (context.reaction === 'complete')
        return '해냈구나! 네가 도와준 덕분에 마을이 더 따뜻해졌어. 정말 고마워!';
    if (context.first)
        return `안녕! 나는 ${p.role}이야. 우리 동네에 온 걸 환영해!`;
    if (context.festival)
        return `${context.festival} 준비로 마을이 들썩들썩해. 우리도 함께해 볼까?`;
    if (context.stage >= 3 && id === 'maker')
        return '공방이 넓어졌어! 모은 재료로 카페에 놓을 가구를 만들어 보자.';
    if (context.stage >= 4 && (id === 'vendor' || id === 'seller'))
        return '마을 시장에 이웃이 많아졌어. 리본과 특별 재료를 잘 챙겨 봐!';
    if (context.stage >= 5 && id === 'guide')
        return '호숫가로 가는 길이 열렸어! 다리를 건너 새로운 이웃도 만나 봐.';
    const workLines = { bloom: '꽃에 물을 주고 있었어. 향기가 참 좋지?', vendor: '이웃들이 보기 편하게 물건을 정리하고 있어.', miller: '오늘도 고운 가루를 만들려고 곡물을 살펴보고 있어.', maker: '나무를 다듬고 있어. 어떤 가구가 되면 좋을까?', host: '광장에서 열릴 행사를 준비하고 있어. 같이 둘러볼래?', guide: '안내도를 살펴보고 있었어. 길이 궁금하면 나를 찾아와.', keeper: '산책로를 돌보는 중이야. 호숫바람이 시원하지?', seller: '산책 나온 이웃들을 맞을 준비를 하고 있어.', photographer: '호수에 비친 빛을 사진에 담고 있었어.', visitor: '여행 지도를 보며 다음에 걸을 길을 찾고 있어.' };
    return [workLines[id] ?? '잠깐 이야기할까?', '네 카페 이야기가 궁금해. 오늘은 어떤 공부를 했니?', '잠깐 쉬면서 마을 풍경을 보고 있어. 천천히 둘러봐!'][(context.turn ?? 0) % 3];
}
