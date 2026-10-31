import { furnitureFrames } from './furnitureFrames.js';
import { imageReady } from './imageLoading.js';
import { furnitureFor } from './furnitureCatalog.js';
import { branchRoom } from './growthBranch.js';
import { tableKinds, freeBody, chairOffsets } from './freeLayoutModel.js';
export const freeAtlas = 'assets/web/free-layout/furniture-atlas.webp';
export function freeSprite(row, rotation, atlas = freeAtlas, fallbackRow = row) {
    const requestedAtlas = atlas, requestedRow = row;
    if (atlas !== freeAtlas && !imageReady(atlas)) {
        atlas = freeAtlas;
        row = fallbackRow;
    }
    const column = rotation / 90;
    let position = (column * 100 / 3) + '% ' + (row * 100 / 3) + '%', size = '400% 400%';
    let frameStyle = '';
    const theme = atlas.match(/theme-furniture\/(garden|bakery|dessert)\.webp$/)?.[1], sheet = theme ? furnitureFrames[theme] : undefined;
    if (sheet) {
        const f = sheet.frames[row][column], width = f.w / sheet.cell * 100;
        position = (f.x / (sheet.width - f.w) * 100) + '% ' + (f.y / (sheet.height - f.h) * 100) + '%';
        size = (sheet.width / f.w * 100) + '% ' + (sheet.height / f.h * 100) + '%';
        frameStyle = 'width:' + width + '%;margin-left:' + (100 - width) / 2 + '%;aspect-ratio:' + f.w + '/' + f.h + ';';
    }
    return '<span class="free-sprite" data-art-sheet="' + requestedAtlas + '" data-art-row="' + requestedRow + '" data-art-turn="' + rotation + '" data-art-fallback="' + fallbackRow + '" style="' + frameStyle + 'background-image:url(' + atlas + ');background-size:' + size + ';background-position:' + position + '"></span>';
}
export function furnitureVisualVersion(tables) { return tables.map(t => { const f = furnitureFor(t.kind ?? t.tableKind ?? 'two', t.furnitureId); return f.id + ':' + imageReady(f.atlas); }).join('|'); }
export function freeHallLayers(space, room) { const file = room ?? branchRoom(space.branch ?? 'garden'), right = space.branch === 'dessert'; return '<div class="free-fixed-layer" aria-hidden="true" style="background-image:url(' + file + ');clip-path:polygon(0 0,100% 0,100% ' + (right ? 49 : 42) + '%,78% ' + (right ? 49 : 42) + '%,78% 42%,0 42%)"></div><div class="free-floor-layer" aria-hidden="true" style="background-image:url(' + file + ');clip-path:polygon(0 42%,78% 42%,78% ' + (right ? 49 : 42) + '%,100% ' + (right ? 49 : 42) + '%,100% 100%,0 100%)"></div>'; }
export function freeFurniture(space, selected = '') { return space.tables.map(t => { const k = tableKinds[t.tableKind ?? 'two'], furniture = furnitureFor(t.tableKind ?? 'two', t.furnitureId), themed = furniture.atlas !== freeAtlas && imageReady(furniture.atlas), body = freeBody(t), rotation = t.rotation ?? 0, record = { id: t.tableId, kind: t.tableKind ?? 'two', x: t.x, y: t.y, rotation }; return '<span class="free-table free-object ' + (themed ? 'theme-table ' : '') + (t.tableId === selected ? 'free-selected' : '') + '" data-object="' + t.tableId + '" data-table="' + t.tableId + '" data-furniture="' + furniture.id + '" data-kind="' + t.tableKind + '" data-rotation="' + rotation + '" style="left:' + t.x + '%;top:' + (body.bottom) + '%;width:' + k.artWidth + '%;z-index:' + Math.round(t.y * 10) + '">' + freeSprite(furniture.row, rotation, furniture.atlas, k.row) + '</span>' + chairOffsets(record).map((p, i) => '<span class="free-chair free-object ' + (themed ? 'theme-chair ' : '') + (t.tableId === selected ? 'free-selected' : '') + '" data-object="' + t.tableId + '" data-chair="' + t.tableId + '-' + i + '" data-rotation="' + p.rotation + '" style="left:' + p.x + '%;top:' + p.y + '%;width:' + furniture.chairWidth + '%;z-index:' + Math.round(p.y * 10 - 2) + '">' + freeSprite(furniture.chairRow, p.rotation, furniture.atlas, 3) + '</span>').join(''); }).join(''); }
/** Decode completion updates only art styles, preserving focus, pointer targets and the editor draft. */
export function refreshFurnitureArt(root) { for (const node of root.querySelectorAll('.free-sprite[data-art-sheet]')) {
    const atlas = node.dataset.artSheet;
    if (!imageReady(atlas))
        continue;
    const template = document.createElement('template');
    template.innerHTML = freeSprite(Number(node.dataset.artRow), Number(node.dataset.artTurn), atlas, Number(node.dataset.artFallback));
    node.style.cssText = template.content.firstElementChild.style.cssText;
    if (atlas !== freeAtlas) {
        if (node.parentElement?.classList.contains('free-table'))
            node.parentElement.classList.add('theme-table');
        if (node.parentElement?.classList.contains('free-chair'))
            node.parentElement.classList.add('theme-chair');
    }
} }
