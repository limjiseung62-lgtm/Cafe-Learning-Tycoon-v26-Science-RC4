import { webAsset, webAssets } from './webAsset.js';
// One request per logical file; shared by base poses, motion and rooms. Browser HTTP/decoded caches remain browser-managed.
const entries = new Map(), retained = new Map();
let active = 0;
const MAX_ACTIVE = 3, MAX_RETAINED = 4, TIMEOUT = 45000, MAX_ATTEMPTS = 3;
const sourceFor = new Map(Object.entries(webAssets).map(([source, a]) => [a.file, source]));
export function logicalImageFile(file) { if (/^https?:/.test(file) && typeof location !== 'undefined') {
    const u = new URL(file);
    if (u.origin === location.origin)
        file = u.pathname;
} file = file.replace(/^\//, ''); return sourceFor.get(file) ?? file; }
function pump() {
    if (typeof Image === 'undefined')
        return;
    for (const [file, e] of entries) {
        if (active >= MAX_ACTIVE)
            break;
        if (e.state !== 'queued')
            continue;
        e.state = 'loading';
        active++;
        e.attempts++;
        const img = new Image();
        e.image = img;
        img.decoding = 'async';
        let ended = false;
        const finish = (ok) => { if (ended)
            return; ended = true; clearTimeout(e.timer); img.onload = null; img.onerror = null; e.image = undefined; active--; e.state = ok ? 'ready' : 'failed'; e.retryAt = Date.now() + (e.attempts >= MAX_ATTEMPTS ? 30000 : 2000 * Math.pow(2, e.attempts - 1)); if (ok) {
            retained.set(file, img);
            while (retained.size > MAX_RETAINED)
                retained.delete(retained.keys().next().value);
        } pump(); };
        img.onload = () => { if (typeof img.decode === 'function')
            void img.decode().then(() => finish(true), () => finish(false));
        else
            finish(true); };
        img.onerror = () => finish(false);
        e.timer = setTimeout(() => { img.removeAttribute('src'); finish(false); }, TIMEOUT);
        img.src = webAsset(file);
    }
}
export function imageReady(file) { file = logicalImageFile(file); if (typeof Image === 'undefined')
    return true; let e = entries.get(file); if (!e) {
    e = { state: 'queued', attempts: 0, retryAt: 0 };
    entries.set(file, e);
} if (e.state === 'ready')
    return true; if (e.state === 'failed' && Date.now() >= e.retryAt) {
    if (e.attempts >= MAX_ATTEMPTS)
        e.attempts = 0;
    e.state = 'queued';
} pump(); return imageState(file) === 'ready'; }
export function imageState(file) { return entries.get(logicalImageFile(file))?.state; }
export function waitForImages(files) { const deadline = Date.now() + 45000; return new Promise(resolve => { const check = () => { const states = files.map(imageReady); if (states.every(Boolean) || files.every(f => imageState(f) === 'ready' || imageState(f) === 'failed') || Date.now() >= deadline)
    resolve(states);
else
    setTimeout(check, 200); }; check(); }); }
export function retryFailedImages() { for (const e of entries.values())
    if (e.state === 'failed') {
        e.attempts = 0;
        e.state = 'queued';
    } pump(); }
if (typeof window !== 'undefined')
    window.addEventListener('online', retryFailedImages);
export function imageLoadingStatus() { const readyFiles = [...entries].filter(([, e]) => e.state === 'ready').map(([f]) => f); return { retainedImages: retained.size, readyFiles: readyFiles.length, loadingFiles: active, queuedFiles: [...entries.values()].filter(e => e.state === 'queued').length, failedFiles: [...entries].filter(([, e]) => e.state === 'failed').map(([f]) => f), estimatedDecodedBytes: readyFiles.reduce((n, f) => n + (webAssets[f]?.webRgbaBytes ?? 0), 0), decodeEstimate: 'RGBA width × height; not measured browser/GPU memory' }; }
