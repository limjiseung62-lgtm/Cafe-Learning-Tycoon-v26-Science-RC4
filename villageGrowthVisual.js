import { townScene } from './villageSceneData.js';
export const growthMilestones = [
    { stage: 1, title: '작은 마을', detail: '작은 광장과 이웃의 가게에서 첫 인사를 나눠요.', facility: '기본 주민 의뢰', reaction: '우리 마을에 온 걸 환영해!' },
    { stage: 2, title: '첫 광장 정비', detail: '분수 광장을 넓히고 꽃밭·벤치·가로등을 마련했어요.', facility: '광장 꽃 축제', reaction: '광장이 정말 예뻐졌어! 여기서 잠깐 쉬어 갈래?' },
    { stage: 3, title: '공방 완공', detail: '공방에 새 작업실과 야외 작업대가 생겼어요.', facility: '공방 가구·장식 제작 / 빵 축제', reaction: '우리 공방이 더 넓어졌네! 멋진 가구를 함께 만들자.' },
    { stage: 4, title: '시장 확장', detail: '새 천막과 진열대가 골목까지 이어져요.', facility: '시장 재료 교환·기념품 / 디저트 축제', reaction: '시장이 활기차졌어! 새 진열대도 구경해 봐.' },
    { stage: 5, title: '호숫가 길 개방', detail: '외곽 울타리를 걷고 안내판과 길 조명을 설치했어요.', facility: '호숫가 탐험 / 마을 감사 축제', reaction: '드디어 호숫가로 갈 수 있어! 다리 너머에도 이웃이 있대.' }
];
export const growthStage = (n) => Math.max(1, Math.min(5, Number.isFinite(n) ? Math.floor(n) : 1));
const cache = new Map();
export function townAtStage(input) {
    const stage = growthStage(input);
    if (cache.has(stage))
        return cache.get(stage);
    const s = structuredClone(townScene);
    s.progressionStage = stage;
    for (const id of ['workshop', 'market']) {
        const b = s.buildings.find(b => b.id === id);
        b.w = id === 'workshop' ? (stage >= 3 ? 380 : 235) : (stage >= 4 ? 400 : 235);
        b.footprint = { x: b.x - b.w * (id === 'workshop' && stage >= 3 ? .47 : .37), y: b.y - b.w * .16, w: b.w * .74, h: b.w * .16 };
    }
    s.blockers = stage < 5 ? [{ x: 1435, y: 560, w: 165, h: 150 }] : [];
    s.extraProps = [];
    const add = (tile, x, y, w, solid = true) => s.extraProps.push({ tile, x, y, w, solid });
    if (stage >= 2) {
        for (const [x, y] of [[575, 810], [975, 800]])
            add(3, x, y, 125);
        for (const [x, y] of [[570, 540], [990, 535], [600, 900], [975, 900]])
            add(4, x, y, 58);
        for (const [x, y] of [[520, 490], [1050, 495], [575, 920], [975, 930]])
            add(1, x, y, 135);
    }
    if (stage >= 3) {
        add(7, 900, 1000, 138);
        add(7, 1260, 1040, 130);
        add(5, 1180, 1135, 150);
    }
    if (stage >= 4) {
        add(6, 1110, 395, 160);
        add(6, 1450, 480, 155);
        add(1, 1420, 560, 100);
    }
    if (stage >= 5) {
        for (const [x, y] of [[1415, 535], [1510, 730]])
            add(4, x, y, 66);
        add(1, 1450, 780, 135);
    }
    // Resident activity follows the new facilities, with navigation repairing unsafe points.
    if (stage >= 2) {
        s.residents.find(r => r[0] === 'host')[3] = 935;
        s.residents.find(r => r[0] === 'host')[4] = 735;
    }
    if (stage >= 3) {
        s.residents.find(r => r[0] === 'maker')[3] = 1040;
        s.residents.find(r => r[0] === 'maker')[4] = 1065;
    }
    if (stage >= 4) {
        s.residents.push(['photographer', '빛나', 'painter', 1150, 620], ['visitor', '다솔', 'bookworm', 1250, 710]);
        s.residents.find(r => r[0] === 'vendor')[3] = 1260;
        s.residents.find(r => r[0] === 'vendor')[4] = 485;
    }
    if (stage >= 5) {
        s.residents.find(r => r[0] === 'guide')[3] = 1380;
        s.residents.find(r => r[0] === 'guide')[4] = 650;
    }
    cache.set(stage, s);
    return s;
}
export function growthAlbum(p) { return growthMilestones.filter(m => m.stage <= growthStage(p.stage)).map(m => ({ ...m, reward: m.facility + ' 이용 가능', seen: m.stage <= p.seenStage })); }
export function acknowledgeGrowth(p, stage) { if (stage < 1 || stage > p.stage)
    return false; p.seenStage = Math.max(p.seenStage, stage); return true; }
export function growthPhase(seconds) { return seconds < 1.5 ? 'notice' : seconds < 4.5 ? 'working' : seconds < 6.5 ? 'reveal' : 'complete'; }
export const constructionDuration = 8;
export function growthReaction(id, stage) { if (stage >= 5 && ['guide', 'host', 'keeper', 'visitor'].includes(id))
    return growthMilestones[4].reaction; if (stage >= 4 && ['vendor', 'seller'].includes(id))
    return growthMilestones[3].reaction; if (stage >= 3 && id === 'maker')
    return growthMilestones[2].reaction; if (stage >= 2 && ['bloom', 'host', 'guide'].includes(id))
    return growthMilestones[1].reaction; return undefined; }
