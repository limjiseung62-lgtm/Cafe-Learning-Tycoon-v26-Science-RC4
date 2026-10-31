import { sprite } from './art.js';
import { imageReady } from './imageLoading.js';
export const isNewStaff = (id) => /^staff-(6|7|8|9|10|11|12)$/.test(id);
export function recruitFrame(id, motion, facing = 'right') {
    if (!isNewStaff(id))
        return null;
    const index = motion === 'IDLE' ? 0 : motion === 'PICKUP' ? 3 : motion === 'CARRY' ? 4 : motion === 'SERVE' ? 5 : facing === 'left' ? 1 : 2;
    const tray = index === 3 ? { x: .4, y: .88, width: .5 } : index === 4 ? { x: id === 'staff-9' ? .47 : .65, y: .50, width: .48 } : index === 5 ? { x: .78, y: .57, width: .48 } : { x: .5, y: .62, width: .45 };
    return { file: 'assets/web/recruit-staff/' + id + '.webp', width: 768, height: 512, box: [index % 3 * 256, Math.floor(index / 3) * 256, 256, 256], nativeFacing: index === 1 || index === 3 ? 'left' : 'right', tray };
}
export function recruitPortrait(id) { return isNewStaff(id) ? '<img class="crew-portrait" loading="lazy" src="assets/web/recruit-staff/' + id + '-portrait.webp" alt="직원 모습">' : '<span class="crew-portrait legacy-portrait">' + sprite(id, 'crew-portrait-art') + '</span>'; }
export function workerBaseArt(id) { if (!isNewStaff(id))
    return sprite(id, 'worker-art'); if (!imageReady('assets/web/recruit-staff/' + id + '.webp'))
    return sprite('staff-1', 'worker-art'); return '<span class="worker-art art-sprite actual-worker-pose" style="background-image:url(assets/web/recruit-staff/' + id + '.webp);background-size:300% 200%;background-position:0 0;aspect-ratio:1"></span>'; }
