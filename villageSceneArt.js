import { sceneRoads, sceneProps, lakeShore, riverPath } from './villageNavigation.js';
import { customerPoseArt, selectCustomerPose } from './customerPoses.js';
import { escapeText as esc } from './questionRenderer.js';
const art = (key) => customerPoseArt(selectCustomerPose(key, 'ENTERING', 'right'));
const asset = 'assets/web/village-v2/';
const propFrames = [[0, 0, 512, 385], [512, 0, 512, 385], [1024, 0, 512, 385], [0, 385, 512, 280], [512, 385, 512, 300], [1024, 385, 512, 300], [0, 665, 512, 359], [512, 685, 512, 339], [1024, 685, 512, 339]];
export function spriteStyle(tile, w, prop = false) { const f = prop ? propFrames[tile] : [tile % 3 * 512, Math.floor(tile / 3) * 1024 / 3, 512, 1024 / 3]; return `width:${w}px;height:${w * f[3] / f[2]}px;background-image:url(${asset + (prop ? 'props' : 'buildings')}.webp);background-size:${1536 / f[2] * 100}% ${1024 / f[3] * 100}%;background-position:${f[0] / (1536 - f[2]) * 100}% ${f[1] / (1024 - f[3]) * 100}%`; }
export function sceneEnvironment(scene, founded = false) {
    const prefix = 'scene-' + scene.id, roads = sceneRoads(scene);
    const stage = scene.progressionStage ?? 5;
    let ground = `<defs><pattern id="${prefix}-stone" width="120" height="120" patternUnits="userSpaceOnUse"><image href="${asset}stone.webp" width="120" height="120"/></pattern>` + (scene.id === 'lake' ? `<pattern id="${prefix}-water" width="480" height="480" patternUnits="userSpaceOnUse"><image href="${asset}water-soft.webp" width="480" height="480"/></pattern>` : '') + '</defs>';
    if (scene.id === 'lake')
        ground += `<path d="${riverPath}" fill="none" stroke="#dbd6ad" stroke-width="110"/><path d="${riverPath}" fill="none" stroke="url(#${prefix}-water)" stroke-width="75"/><path d="${lakeShore}" fill="#d6d2a1" stroke="#91a780" stroke-width="36"/><path d="${lakeShore}" fill="url(#${prefix}-water)" stroke="#e3d8ac" stroke-width="14"/>`;
    for (const [color, width] of [['#89976a', 88], ['#e2d0a7', 82], [`url(#${prefix}-stone)`, 74]])
        for (const road of roads)
            ground += `<path d="${road.d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round"/>`;
    if (scene.id === 'town')
        ground += `<ellipse cx="775" cy="660" rx="204" ry="145" fill="#b6b48b" stroke="#8e9f73" stroke-width="16"/><ellipse cx="775" cy="660" rx="191" ry="132" fill="url(#${prefix}-stone)"/><ellipse cx="775" cy="660" rx="${stage === 1 ? 85 : 132}" ry="${stage === 1 ? 55 : 85}" fill="none" stroke="#b7ab83" stroke-width="${stage === 1 ? 2 : 5}"/>`;
    let html = `<svg class="scene-ground" viewBox="0 0 1600 1200" width="1600" height="1200" aria-hidden="true">${ground}</svg>`;
    for (const p of sceneProps(scene))
        html += `<span class="scene-sprite scene-prop" data-prop="${p.tile}" style="left:${p.x}px;top:${p.y}px;z-index:${p.bridge ? 240 : Math.floor(p.y)};${spriteStyle(p.tile, p.w, true)}" aria-hidden="true"></span>`;
    for (const b of scene.buildings) {
        const site = scene.id === 'lake' && b.id === 'site';
        html += `<button class="scene-building ${site ? 'lake-site' : ''}" data-building="${b.id}" aria-label="${esc(b.name)}까지 이동" style="left:${b.x}px;top:${b.y}px;z-index:${b.y};width:${b.w}px;height:${b.w * 2 / 3}px">` + (site && !founded ? '<span class="scene-empty-plot" aria-hidden="true"></span>' : buildingArt(scene, b.id, b.tile, b.w)) + `<b class="scene-label">${site && founded ? '2호점 카페' : esc(b.name)}</b></button>`;
    }
    if (scene.id === 'town' && scene.progressionStage) {
        if (stage < 5)
            html += `<span class="scene-sprite scene-prop growth-gate" data-growth-gate style="left:1460px;top:685px;z-index:700;${spriteStyle(5, 210, true)}" aria-hidden="true"></span><span class="growth-world-sign" style="left:1470px;top:575px">호숫가 길 정비 중</span>`;
        else
            html += `<span class="growth-world-sign growth-open-sign" style="left:1470px;top:575px">바람결 호숫가 →</span>`;
        if (stage >= 3)
            html += `<span class="growth-world-sign growth-workshop-sign" style="left:1080px;top:1015px">윤슬의 큰 공방</span>`;
        if (stage >= 4)
            html += `<span class="growth-world-sign" style="left:1270px;top:415px">이웃 장터</span>`;
    }
    return html;
}
function buildingArt(scene, id, tile, w) { const expanded = scene.id === 'town' && ((id === 'workshop' && (scene.progressionStage ?? 0) >= 3) || (id === 'market' && (scene.progressionStage ?? 0) >= 4)); return expanded ? `<img class="scene-building-expansion" src="assets/web/village-v2c/${id}.webp" alt="" decoding="sync" style="position:absolute;left:50%;top:100%;transform:translate(${id === 'workshop' ? '-60%' : '-50%'},-100%);object-fit:contain;object-position:center bottom;pointer-events:none;width:${w}px;height:${w * 2 / 3}px;${id === 'workshop' ? '--building-anchor:60%' : ''}">` : `<span class="scene-sprite scene-building-art" style="${spriteStyle(tile, w)}" aria-hidden="true"></span>`; }
export function replaceSceneEnvironment(map, scene) { map.querySelectorAll(':scope>.scene-ground,:scope>.scene-prop,:scope>.scene-building,:scope>.growth-world-sign').forEach(n => n.remove()); map.insertAdjacentHTML('afterbegin', sceneEnvironment(scene)); }
export function sceneMarkup(scene, founded = false) {
    let html = sceneEnvironment(scene, founded);
    for (const [id, name, key, x, y] of scene.residents)
        html += `<button class="village-resident scene-resident ${scene.id === 'lake' ? 'lake-npc' : ''}" data-${scene.id === 'lake' ? 'lake-resident' : 'resident'}="${id}" style="left:${x}px;top:${y}px;z-index:${y}" aria-label="${esc(name)}에게 이동">${art(key)}<b>${esc(name)}</b><span class="village-near" hidden>이야기해요</span></button>`;
    if (scene.id === 'town')
        for (const [id, name, node] of [['ribbon', '리본 꾸러미', 'west'], ['wood', '작은 나무 조각', 'east'], ['seeds', '꽃씨 봉투', 'park']]) {
            const [x, y] = scene.nodes[node];
            html += `<button class="scene-material" data-material="${id}" style="left:${x}px;top:${y + 32}px" aria-label="${name}까지 이동">${name}</button>`;
        }
    if (scene.id === 'lake')
        for (const [id, name] of [['lookout', '작은 다리 전망대'], ['photo', '호숫가 사진 광장']]) {
            const [x, y] = scene.nodes[id];
            html += `<button class="scene-spot" data-lake-spot="${id}" style="left:${x}px;top:${y + 40}px">${name}</button>`;
        }
    html += `<div class="village-player scene-player">${art('child')}<b>나</b></div><div class="scene-destination" hidden aria-hidden="true"></div>`;
    return html;
}
export function ensureVillageSceneStyle() { if (document.getElementById('village-scene-style'))
    return; const style = document.createElement('link'); style.id = 'village-scene-style'; style.rel = 'stylesheet'; style.href = 'village-scene.css?v=v2a1'; document.head.append(style); }
export function markSceneFounded(map) { const site = map.querySelector('[data-building="site"]'); if (!site)
    return; site.querySelector('.scene-empty-plot')?.remove(); if (!site.querySelector('.scene-building-art'))
    site.insertAdjacentHTML('afterbegin', `<span class="scene-sprite scene-building-art" style="${spriteStyle(0, 320)}" aria-hidden="true"></span>`); site.querySelector('b').textContent = '2호점 카페'; }
