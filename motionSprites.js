import { recruitFrame } from "./recruitArt.js";
import { imageReady, imageLoadingStatus } from './imageLoading.js';
import { webAsset } from './webAsset.js';
import { expandedGuestPoses, expandedWorkerPoses } from './motionExpansionCatalog.js';
export const motionSheets = {
    bookworm: { file: 'assets/art/motion-v151/bookworm-actions.png', width: 1536, height: 1024, columns: 3, rows: 1 },
    owner: { file: 'assets/art/motion-v151/owner-actions.png', width: 2172, height: 724, columns: 3, rows: 1 },
    spring: { file: 'assets/art/motion-v151/spring-actions.png', width: 1774, height: 887, columns: 3, rows: 1 },
    student: { file: 'assets/art/motion-v151/student-actions-v2.png', width: 1024, height: 1536, columns: 2, rows: 2 },
};
const available = imageReady;
export const motionCacheStatus = imageLoadingStatus;
export function preloadMotionSheets(keys = ['owner']) { for (const key of keys) {
    const frames = expandedGuestPoses[key];
    if (frames)
        for (const variants of Object.values(frames))
            if (variants?.[0])
                available(variants[0].file);
    const worker = workerFrame(key, 'CARRY');
    if (worker)
        available(worker.file);
} }
// Pixel rectangles/seat anchors are authored for these sheets, not inferred at runtime.
export function guestMotionAsset(identity, motion, phase = 0) {
    const variants = expandedGuestPoses[identity]?.[motion];
    if (variants?.length) {
        const asset = variants[Math.abs(Math.floor(phase)) % variants.length];
        return available(asset.file) ? asset : undefined;
    }
    if (identity === 'student') {
        const box = motion === 'REACT_HAPPY' ? [555, 10, 410, 745] : motion === 'REACT_SURPRISED' ? [65, 755, 445, 770] : motion === 'WAVE' ? [565, 755, 435, 770] : null;
        if (!box)
            return;
        return { file: motionSheets.student.file, width: 1024, height: 1536, box, anchorX: box[0] + box[2] * .35, anchorY: box[1] + box[3] * (motion === 'WAVE' ? .98 : .72), nativeFacing: 'right' };
    }
    if (identity !== 'bookworm')
        return;
    const frame = motion === 'EAT' ? 0 : motion === 'REACT_HAPPY' ? 1 : motion === 'WAVE' ? 2 : -1;
    if (frame < 0)
        return;
    const box = frame === 0 ? [58, 88, 458, 912] : frame === 1 ? [556, 88, 467, 912] : [1060, 20, 460, 988];
    return { file: motionSheets.bookworm.file, width: 1536, height: 1024, box, anchorX: box[0] + box[2] * .6, anchorY: frame === 2 ? 1008 : 795, nativeFacing: 'left', displayScale: 1 };
}
export function workerFrame(id, motion, facing = 'right') {
    const recruit = recruitFrame(id, motion, facing);
    if (recruit)
        return recruit;
    const frame = motion === 'PICKUP' ? 0 : motion === 'CARRY' ? 1 : motion === 'SERVE' ? 2 : -1;
    if (frame < 0)
        return null;
    if (expandedWorkerPoses[id])
        return expandedWorkerPoses[id][frame];
    if (id !== 'owner' && id !== 'staff-1')
        return null;
    const sheet = id === 'owner' ? motionSheets.owner : motionSheets.spring;
    const [x, w] = id === 'owner' ? [[100, 550], [840, 490], [1550, 620]][frame] : [[40, 520], [560, 490], [1090, 684]][frame];
    const tray = id === 'owner' ? [{ x: .66, y: .87, width: .45 }, { x: .65, y: .60, width: .50 }, { x: .79, y: .61, width: .43 }][frame] : [{ x: .32, y: .82, width: .53 }, { x: .43, y: .60, width: .55 }, { x: .84, y: .50, width: .39 }][frame];
    return { file: sheet.file, width: sheet.width, height: sheet.height, box: [x, 0, w, sheet.height], nativeFacing: id === 'staff-1' && frame < 2 ? 'left' : 'right', tray };
}
export function workerPoseArt(id, motion, facing = 'right') {
    const f = workerFrame(id, motion, facing);
    if (!f || !available(f.file))
        return null;
    const [x, y, w, h] = f.box;
    return '<span class="worker-art art-sprite actual-worker-pose" aria-hidden="true" data-frame="' + motion + '" style="--worker-flip:' + (facing === f.nativeFacing ? 1 : -1) + ';background-image:url(' + webAsset(f.file) + ');background-size:' + (f.width / w * 100) + '% ' + (f.height / h * 100) + '%;background-position:' + (f.width === w ? 0 : x / (f.width - w) * 100) + '% ' + (f.height === h ? 0 : y / (f.height - h) * 100) + '%;aspect-ratio:' + w + '/' + h + '"></span>';
}
export function workerTrayPlacement(id, motion, facing) {
    const f = workerFrame(id, motion, facing);
    if (!f)
        return null;
    const ratio = 1.9 * f.box[2] / f.box[3], center = .5 + (f.tray.x - .5) * ratio * (facing === f.nativeFacing ? 1 : -1), width = f.tray.width * ratio;
    return { left: (center - width / 2) * 100, top: f.tray.y * 100, width: width * 100 };
}
