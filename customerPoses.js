import { waitForImages } from './imageLoading.js';
import { webAsset } from './webAsset.js';
import { guestMotionAsset } from './motionSprites.js';
import { hospitalityPoseCatalog } from './hospitalityPoseCatalog.js';
import { specialPoseCatalog } from './specialPoseCatalog.js';
import { customerPoseCatalog } from './customerPoseCatalog.js';
export const customerPoses = customerPoseCatalog;
export function selectCustomerPose(visualKey, action, facing, motion = '', phase = 0) { const p = customerPoses[visualKey] ?? hospitalityPoseCatalog[visualKey] ?? specialPoseCatalog[visualKey]; if (!p)
    throw new Error('Missing customer pose: ' + visualKey); const walking = ['ENTERING', 'WALKING_TO_SEAT', 'STANDING_UP', 'WALKING_TO_EXIT'].includes(action); const motionAsset = !walking || motion === 'WAVE' ? guestMotionAsset(visualKey, motion, phase) : undefined; return { key: visualKey + (motion ? '/' + motion + '/' + (motionAsset ? motionAsset.file + ':' + motionAsset.box.join(',') : 'base') : '') + (walking ? '/walk-' + facing : '/sit-' + facing), kind: walking ? 'walk' : 'sit', walk: p.walk, facing, asset: motionAsset ?? (walking ? null : facing === 'left' ? p.sitLeft : p.sitRight) }; }
export function selectedPoseAsset(s) { return s.asset ?? (customerPoses[s.walk] ?? hospitalityPoseCatalog[s.walk] ?? specialPoseCatalog[s.walk]).walkAsset; }
export function customerPoseArt(s) { const a = selectedPoseAsset(s), [x, y, w, h] = a.box; const flip = a.nativeFacing !== undefined && a.nativeFacing !== s.facing ? -1 : 1; return '<span class="guest-art ' + (s.kind === 'sit' ? 'sit-art' : 'walk-art') + ' art-sprite" aria-hidden="true" style="background-image:url(' + webAsset(a.file) + ');background-size:' + (a.width / w * 100) + '% ' + (a.height / h * 100) + '%;background-position:' + (x / (a.width - w) * 100) + '% ' + (y / (a.height - h) * 100) + '%;aspect-ratio:' + w + '/' + h + ';--sprite-flip:' + flip + ';transform:scaleX(' + flip + ')"></span>'; }
export function poseGeometry(s) { const a = selectedPoseAsset(s), [x, y, w, h] = a.box; let anchorX = (a.anchorX - x) / w * 100; if (a.nativeFacing !== undefined && a.nativeFacing !== s.facing)
    anchorX = 100 - anchorX; return { anchorX, anchorY: (a.anchorY - y) / h * 100, ratio: w / h }; }
export function preloadCustomerPoses(keys = Object.keys(customerPoses)) { const files = keys.flatMap(key => { const p = customerPoses[key] ?? hospitalityPoseCatalog[key] ?? specialPoseCatalog[key]; return p ? [p.walkAsset.file, p.sitLeft.file, p.sitRight.file] : []; }); return waitForImages(files); }
