import { consumeUnlocks, featureLevels, unlocked } from './progressiveFeatures.js';
/** Presentation mirrors reducer gates; it never grants a capability. */
export function applyProgressiveVisibility(g) {
    if (!g.progressive && !g.progressiveState)
        return;
    if (g.progressiveState) {
        const added = consumeUnlocks(g.progressiveState, g.cafeLevel);
        if (added.length) {
            let note = document.getElementById('progressive-unlock');
            if (!note) {
                note = document.createElement('p');
                note.id = 'progressive-unlock';
                note.setAttribute('role', 'status');
                document.getElementById('playing')?.after(note);
            }
            note.textContent = 'Lv.' + Math.max(...added.map(f => featureLevels[f])) + ' 성장! 새 활동은 이번 영업을 마친 뒤 준비 화면에서 만나 보세요.';
        }
    }
    const rules = { 'open-board': 'missions', 'open-collection': 'missions', 'open-interior': 'decor', 'open-album': 'landmark', 'cafe-photo': 'decor', 'mini-offer': 'cake', 'management-tools': 'reviews', 'branch-open': 'branch', 'specialization-open': 'specialization' };
    for (const [id, feature] of Object.entries(rules)) {
        const el = document.getElementById(id);
        if (el)
            el.hidden = !unlocked(g, feature);
    }
}
