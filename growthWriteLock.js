import { deploymentPrefix } from './deploymentStorage.js';
let lockName = deploymentPrefix() + 'cafe-growth-single-writer-v172b';
export function configureGrowthQaLock(name) { if (!/^qa-[a-z0-9-]{1,60}$/.test(name) || owns || pending || closing)
    return false; lockName = name; return true; }
let owns = false, release = null, pending = null, closing = null, requestDone = null;
export const hasGrowthWriteLock = () => owns;
export const supportsGrowthLock = () => typeof navigator !== 'undefined' && !!navigator.locks;
export function ensureGrowthWriteLock() {
    if (closing)
        return closing.then(() => ensureGrowthWriteLock());
    if (owns)
        return Promise.resolve(true);
    if (pending)
        return pending;
    if (!supportsGrowthLock())
        return Promise.resolve(false);
    pending = new Promise(resolve => { requestDone = navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => { if (!lock) {
        resolve(false);
        return;
    } owns = true; resolve(true); await new Promise(done => { release = done; }); owns = false; release = null; }); void requestDone.catch(() => resolve(false)); }).finally(() => { pending = null; });
    return pending;
}
export function releaseGrowthWriteLock() { if (!release || closing)
    return; closing = (requestDone ?? Promise.resolve()).then(() => { }, () => { }).finally(() => { closing = null; }); owns = false; release(); }
