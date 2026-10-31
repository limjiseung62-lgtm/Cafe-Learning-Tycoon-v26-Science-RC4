import { imageReady, imageState } from './imageLoading.js';
let installed = false;
export function installAssetFallbacks() {
    if (installed)
        return;
    installed = true;
    const last = new WeakMap(), pending = new Map();
    const inspect = (node) => { const style = node instanceof HTMLImageElement ? node.src : node.style.backgroundImage || node.style.getPropertyValue('--room'), url = node instanceof HTMLImageElement ? style : style.match(/url\(["']?([^"')]+)["']?\)/)?.[1]; if (!url || last.get(node) === url)
        return; last.set(node, url); pending.set(node, url); imageReady(url); };
    const scan = (node) => { if (node.matches('.art-sprite,.cafe'))
        inspect(node); node.querySelectorAll('.art-sprite,.cafe').forEach(inspect); };
    scan(document.body);
    new MutationObserver(changes => { for (const change of changes) {
        if (change.type === 'attributes' && change.target instanceof HTMLElement && change.target.matches('.art-sprite,.cafe'))
            inspect(change.target);
        for (const node of change.addedNodes)
            if (node instanceof Element)
                scan(node);
    } }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    setInterval(() => { for (const [node, url] of pending) {
        if (!node.isConnected) {
            pending.delete(node);
            continue;
        }
        if (imageReady(url)) {
            node.classList.remove('asset-unavailable');
            if (node instanceof HTMLImageElement && node.dataset.retryImage) {
                delete node.dataset.retryImage;
                node.src = url;
            }
            pending.delete(node);
        }
        else if (imageState(url) === 'failed') {
            node.dataset.fallbackLabel = node.closest('[aria-label]')?.getAttribute('aria-label')?.split(' · ')[0] ?? (node.classList.contains('guest-art') ? '손님' : '카페');
            node.classList.add('asset-unavailable');
        }
    } }, 500);
    document.addEventListener('error', event => { if (event.target instanceof HTMLImageElement) {
        event.target.dataset.retryImage = 'true';
        inspect(event.target);
    } }, true);
}
