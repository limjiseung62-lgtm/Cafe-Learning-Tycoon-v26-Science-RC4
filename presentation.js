import { customerPoses } from './customerPoses.js';
// The top edge of the existing counter foreground polygon, in room percent.
const counterEdge = [[0, 59], [19, 64], [32, 75], [47, 85], [52, 86], [53, 79], [62, 74], [65, 64], [83, 64], [100, 65]];
export function counterBoundaryY(x) { for (let i = 1; i < counterEdge.length; i++) {
    const [a, y] = counterEdge[i - 1], [b, z] = counterEdge[i];
    if (x <= b)
        return y + (z - y) * Math.max(0, Math.min(1, (x - a) / (b - a)));
} return 65; }
export function visibleWorkerFraction(point, height = 5.9 * 1.9 * 1.5) { return Math.min(1, Math.max(0, (counterBoundaryY(point.x) - (point.y - height)) / height)); }
export function showOrderBubble(g) { return g.order.length > 0 && !g.paid && !g.abandoned && ['WAITING_FOR_FOOD', 'PREPARING', 'SERVING'].includes(g.state); }
export function syncOrderBubble(view, visible, key, html) { view.hidden = !visible; if (!visible) {
    if (view.innerHTML)
        view.replaceChildren();
    delete view.dataset.key;
    return;
} if (view.dataset.key !== key) {
    view.dataset.key = key;
    view.innerHTML = html();
} }
export function assetSignature(asset) { return asset.file + '#' + asset.box.join(','); }
export function auditCustomerPoses() { const errors = []; for (const pose of ['walkAsset', 'sitLeft', 'sitRight']) {
    const seen = new Map();
    for (const [key, p] of Object.entries(customerPoses)) {
        const asset = p[pose];
        if (!asset) {
            errors.push(key + '/' + pose + ' missing');
            continue;
        }
        const signature = assetSignature(asset);
        if (seen.has(signature))
            errors.push(key + '/' + pose + ' reuses ' + seen.get(signature));
        seen.set(signature, key);
        if (p.walk !== key)
            errors.push(key + ' identity mismatch');
    }
} return errors; }
