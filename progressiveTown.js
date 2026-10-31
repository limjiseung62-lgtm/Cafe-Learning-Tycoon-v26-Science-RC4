import { townAtStage } from './villageGrowthVisual.js';
import { investmentCatalog, progressiveTownName } from './progressiveEconomy.js';
/** Reuse approved object layers, including their real solid footprints. */
export function progressiveTown(s) {
    const scene = structuredClone(townAtStage(s.village?.progression?.stage ?? 1));
    if (!s.v26)
        return scene;
    scene.name = progressiveTownName(s);
    const sites = { commerce: [1320, 300], tourism: [420, 820], culture: [700, 1090], housing: [190, 540] };
    for (const c of investmentCatalog) {
        const n = s.v26.investments[c.id], [x, y] = sites[c.id];
        for (let i = 0; i < n; i++)
            scene.extraProps.push({ tile: c.tile, x: x + (i % 3) * 72, y: y + Math.floor(i / 3) * 80, w: c.id === 'commerce' ? 90 : 70, solid: true });
        if (n >= 2 && c.id === 'commerce') {
            const market = scene.buildings.find(b => b.id === 'market');
            market.w += n * 8;
            market.footprint.x -= n * 2;
            market.footprint.w += n * 4;
            market.name = '투자로 확장한 상점 거리';
            const vendor = scene.residents.find(r => r[0] === 'vendor');
            if (vendor) {
                vendor[3] = 1260;
                vendor[4] = 485;
                vendor[1] += ' · 상점 거리';
            }
        }
        if (n >= 2 && c.id !== 'commerce') {
            const model = scene.buildings.find(b => b.id === (c.id === 'culture' ? 'workshop' : c.id === 'tourism' ? 'pavilion' : 'house-a')) ?? scene.buildings[0];
            const b = structuredClone(model);
            b.id = 'investment-' + c.id;
            b.name = c.name + ' 거리';
            b.x = x;
            b.y = y - 80;
            b.w = 160;
            b.footprint = { x: x - 55, y: y - 108, w: 110, h: 28 };
            b.door = { x, y: y - 60 };
            scene.buildings.push(b);
            scene.nodes[b.id] = [b.door.x, b.door.y];
            const near = Object.keys(scene.nodes).filter(id => id !== b.id && !id.startsWith('investment-')).sort((a, b) => Math.hypot(scene.nodes[a][0] - x, scene.nodes[a][1] - y) - Math.hypot(scene.nodes[b][0] - x, scene.nodes[b][1] - y))[0];
            scene.edges.push([near, b.id]);
            const person = scene.residents.find(r => r[0] === ({ commerce: 'vendor', tourism: 'guide', culture: 'host', housing: 'bloom' }[c.id]));
            if (person) {
                person[3] = x + 70;
                person[4] = y + 65;
                person[1] = person[1] + ' · ' + c.name + ' 거리';
            }
        }
    }
    for (let i = 0; i < Math.min(3, s.v26.landmark); i++)
        scene.extraProps.push({ tile: [2, 1, 6][i], x: 450 + i * 180, y: 1180, w: 130, solid: true });
    if (s.v26.landmark >= 4)
        for (let i = 0; i < s.v26.landmark - 3; i++) {
            for (let j = 0; j < 3; j++)
                scene.extraProps.push({ tile: [1, 4, 6][i], x: 420 + i * 180 + j * 45, y: 1100, w: 45, solid: false });
        }
    return scene;
}
