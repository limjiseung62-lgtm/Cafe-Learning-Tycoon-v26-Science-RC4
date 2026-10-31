import { branchRoom } from './growthBranch.js';
import { imageReady } from './imageLoading.js';
import { specializationRoom } from './specializationConfig.js';
import { webAsset } from './webAsset.js';
import { branchCatalog } from './growthBranch.js';
import { specializationById } from './specializationConfig.js';
import { recruitById } from './recruitConfig.js';
export function showcaseLines(g) { return [(g.specialization ? specializationById(g.specialization.selected)?.name : g.branchId ? branchCatalog.find(b => b.id === g.branchId)?.name : '나의 카페') + ' · Lv.' + g.cafeLevel, '성장 분기: ' + (branchCatalog.find(b => b.id === g.branchId)?.name ?? '첫 카페') + ' · 전문화: ' + (g.specialization ? specializationById(g.specialization.selected)?.name : '성장 중'), '근무 직원: ' + (g.service.paid.map(w => recruitById(w.staffId)?.name ?? '직원').join(' · ') || '사장님'), '인테리어는 실제 카페 화면에 배치한 모습이에요.', '특별 성취: 평판 ' + (g.management?.reputation.toFixed(1) ?? '기록 준비 중') + ' · 연구 메뉴 ' + Object.values(g.management?.research ?? {}).filter(x => x.stage === 'registered').length + '종']; }
/** Snapshot only the rendered room; no student names, learning answers or browser chrome. */
export async function cafeShowcasePng(room, lines) {
    const box = room.getBoundingClientRect();
    if (box.width < 20 || box.height < 20)
        throw Error('카페 화면을 먼저 열어 주세요.');
    const clone = room.cloneNode(true), original = [room, ...room.querySelectorAll('*')], copies = [clone, ...clone.querySelectorAll('*')], cache = new Map();
    const data = (url) => { const absolute = new URL(url, location.href).href; if (new URL(absolute).origin !== location.origin)
        return Promise.reject(Error('외부 이미지는 사진에 포함할 수 없어요.')); if (!cache.has(absolute))
        cache.set(absolute, fetch(absolute, { signal: AbortSignal.timeout(10000) }).then(r => { if (!r.ok)
            throw Error('이미지를 준비하지 못했어요.'); return r.blob(); }).then(b => new Promise((resolve, reject) => { const f = new FileReader(); f.onload = () => resolve(String(f.result)); f.onerror = reject; f.readAsDataURL(b); }))); return cache.get(absolute); };
    const imageVariables = new Map();
    const snapshots = original.map(n => { const style = getComputedStyle(n); return Object.fromEntries(Array.from(style).map(k => [k, style.getPropertyValue(k)])); });
    for (let i = 0; i < original.length; i++) {
        if (original[i].closest('.guest-bubble,.room-name,.worker-talk,.ability-talk,.staff-ability,.farewell-pop'))
            continue;
        const style = snapshots[i];
        for (const [key, value] of Object.entries(style))
            if (!key.startsWith('--'))
                copies[i].style.setProperty(key, value);
        copies[i].style.animation = 'none';
        copies[i].style.transition = 'none';
        for (const key of ['background-image', 'mask-image', '-webkit-mask-image']) {
            let value = style[key] ?? 'none';
            const matches = [...value.matchAll(/url\(["']?([^"')]+)["']?\)/g)];
            for (const match of matches) {
                let variable = imageVariables.get(match[1]);
                if (!variable) {
                    variable = '--photo-image-' + imageVariables.size;
                    imageVariables.set(match[1], variable);
                    clone.style.setProperty(variable, 'url("' + await data(match[1]) + '")');
                }
                value = value.replace(match[0], 'var(' + variable + ')');
            }
            if (matches.length)
                copies[i].style.setProperty(key, value);
        }
        if (original[i] instanceof HTMLImageElement) {
            const src = original[i].currentSrc || original[i].src;
            if (src)
                copies[i].src = await data(src);
        }
    }
    clone.querySelectorAll('.guest-bubble,.room-name,.worker-talk,.ability-talk,.staff-ability,.farewell-pop').forEach(n => n.remove());
    clone.style.width = box.width + 'px';
    clone.style.height = box.height + 'px';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + box.width + '" height="' + box.height + '"><foreignObject width="100%" height="100%">' + new XMLSerializer().serializeToString(clone) + '</foreignObject></svg>', img = new Image();
    await new Promise((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(Error('이 브라우저에서 카페 사진을 만들지 못했어요.')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const canvas = document.createElement('canvas'), width = 1200, roomHeight = Math.round(box.height / box.width * 1120);
    canvas.width = width;
    canvas.height = roomHeight + 110 + lines.length * 38;
    const c = canvas.getContext('2d');
    if (!c)
        throw Error('이미지 저장을 지원하지 않아요.');
    c.fillStyle = '#fff6e5';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.drawImage(img, 40, 40, 1120, roomHeight);
    c.fillStyle = '#493526';
    c.font = '24px "Cafe Information",sans-serif';
    lines.forEach((line, i) => c.fillText(line, 40, roomHeight + 85 + i * 38, 1120));
    return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('PNG 변환에 실패했어요.')), 'image/png'));
}
const completedPhotos = new WeakMap();
export function prepareCompletedShowcase(g) { const room = document.getElementById('cafe-room'); if (room && room.getBoundingClientRect().width > 20 && (!g.branchId || imageReady(branchRoom(g.branchId))) && !completedPhotos.has(g)) {
    const pending = cafeShowcasePng(room, showcaseLines(g));
    completedPhotos.set(g, pending);
    void pending.catch(() => { });
} }
async function restoredRoomPhoto(g, room) { const copy = room.cloneNode(true), host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-12000px;top:0;width:1000px;pointer-events:none'; copy.style.width = '1000px'; copy.style.height = '666.667px'; copy.style.margin = '0'; host.append(copy); document.body.append(host); try {
    const file = (g.specialization ? specializationRoom(g.specialization.selected) : undefined) ?? (g.branchId ? branchRoom(g.branchId) : g.cafeLevel >= 11 ? 'assets/web/long-growth/bakery.webp' : g.cafeLevel >= 7 ? 'assets/web/art/room-7.webp' : 'assets/web/art/room' + (g.cafeLevel === 1 ? '' : '-' + g.cafeLevel) + '.webp');
    const img = new Image();
    img.src = webAsset(file);
    await img.decode();
    copy.style.setProperty('--room', 'url("' + img.src + '")');
    return await cafeShowcasePng(copy, showcaseLines(g));
}
finally {
    host.remove();
} }
export async function downloadShowcase(g) { await document.fonts.ready; const room = document.getElementById('cafe-room'); if (!room)
    throw Error('카페 화면을 먼저 열어 주세요.'); const blob = await (g.status === 'CLOSED' ? (completedPhotos.get(g) ?? restoredRoomPhoto(g, room)) : cafeShowcasePng(room, showcaseLines(g))), url = await new Promise((resolve, reject) => { const f = new FileReader(); f.onload = () => resolve(String(f.result)); f.onerror = reject; f.readAsDataURL(blob); }); document.getElementById('cafe-photo-file')?.remove(); const a = document.createElement('a'); a.id = 'cafe-photo-file'; a.href = url; a.download = 'my-cafe-v25.png'; a.textContent = '카페 사진 PNG · 파일 저장'; document.getElementById('long-tools')?.append(a); a.click(); setTimeout(() => a.remove(), 120000); }
