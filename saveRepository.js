import { hasGrowthWriteLock, supportsGrowthLock } from './growthWriteLock.js';
import { validateGrowthSave, migrateGrowthSave } from './growthSave.js';
export const growthStorageKey = 'cafe-learning-tycoon.growth.v1';
/** A local candidate reads a legacy cafe until its first write, then uses its own copy. */
export class CandidateSaveRepository {
    target;
    original;
    constructor(target, original) {
        this.target = target;
        this.original = original;
    }
    read() { const own = this.target.read(); return own.status === 'empty' ? this.original.read() : own; }
    write(save, expected) { if (this.target.read().status === 'empty' && expected) {
        const source = this.original.read();
        if (source.status === 'ready' && JSON.stringify(source.save) !== JSON.stringify(expected))
            return { ok: false, message: '원본 카페가 변경됐어요. 다시 열어 주세요.' };
    } return this.target.write(save, expected); }
    replace(save, confirmed) { return this.target.replace(save, confirmed); }
}
export class LocalSaveRepository {
    storage;
    key;
    backupSequence = 0;
    constructor(storage, key = growthStorageKey) {
        this.storage = storage;
        this.key = key;
    }
    read() { try {
        if (!this.storage)
            return { status: 'unavailable', message: '이 브라우저에서 저장 기능을 사용할 수 없습니다.' };
        const raw = this.storage.getItem(this.key);
        if (raw === null)
            return { status: 'empty' };
        if (raw.length > 4000000)
            throw Error('oversized');
        const value = JSON.parse(raw);
        const save = migrateGrowthSave(value);
        if (save)
            return { status: 'ready', save };
        if (value && typeof value === 'object' && typeof value.schemaVersion === 'number' && value.schemaVersion !== 1)
            return { status: 'unsupported', message: '이 저장 버전은 불러올 수 없습니다. 기존 저장은 보관됩니다.' };
        return { status: 'corrupt', message: '저장 데이터를 불러올 수 없습니다. 기존 저장은 보관됩니다.' };
    }
    catch {
        return { status: this.storage ? 'corrupt' : 'unavailable', message: '저장 데이터를 불러올 수 없습니다. 기존 저장은 보관됩니다.' };
    } }
    write(save, expected) { if (!validateGrowthSave(save))
        return { ok: false, message: '저장할 카페 정보를 확인할 수 없습니다.' }; try {
        if (!this.storage)
            throw Error('unavailable');
        const current = this.storage.getItem(this.key);
        if (expected && current !== null) {
            let value;
            try {
                value = JSON.parse(current);
            }
            catch {
                return { ok: false, message: '저장 데이터가 바뀌어 덮어쓰지 않았습니다. 다시 열어 주세요.' };
            }
            if (JSON.stringify(value) !== JSON.stringify(expected))
                return { ok: false, message: '다른 창에서 카페가 변경됐어요. 다시 열어 주세요.' };
        }
        if (save.management && current !== null && !this.storage.getItem(this.key + '.before-management-v25'))
            this.storage.setItem(this.key + '.before-management-v25', current);
        if (save.portfolio && current !== null && !this.storage.getItem(this.key + '.before-portfolio-v1'))
            this.storage.setItem(this.key + '.before-portfolio-v1', current);
        let hasRoster = false, hasLayouts = false;
        if (current !== null) {
            try {
                const parsed = JSON.parse(current);
                hasRoster = !!parsed?.roster;
                hasLayouts = !!parsed?.layouts;
            }
            catch { }
        }
        if (save.roster && current !== null && !hasRoster && !this.storage.getItem(this.key + '.before-roster-v2'))
            this.storage.setItem(this.key + '.before-roster-v2', current);
        if (save.layouts && current !== null && !hasLayouts && !this.storage.getItem(this.key + '.before-layout-v1'))
            this.storage.setItem(this.key + '.before-layout-v1', current);
        if (save.freeLayouts && current !== null && !this.storage.getItem(this.key + '.before-free-layout-v2'))
            this.storage.setItem(this.key + '.before-free-layout-v2', current);
        if (save.longTerm?.furniture && current !== null && !this.storage.getItem(this.key + '.before-theme-furniture-v1'))
            this.storage.setItem(this.key + '.before-theme-furniture-v1', current);
        if (save.specialization && current !== null && !this.storage.getItem(this.key + '.before-specialization-v1'))
            this.storage.setItem(this.key + '.before-specialization-v1', current);
        if (save.miniCollection && current !== null && !this.storage.getItem(this.key + '.before-mini-v1'))
            this.storage.setItem(this.key + '.before-mini-v1', current);
        if (save.village && current !== null && !this.storage.getItem(this.key + '.before-village-v1'))
            this.storage.setItem(this.key + '.before-village-v1', current);
        this.storage.setItem(this.key, JSON.stringify(save));
        return { ok: true, message: '저장됨 ✓' };
    }
    catch {
        return { ok: false, message: '저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.' };
    } }
    replace(save, confirmed) { if (!confirmed)
        return { ok: false, message: '새로 시작 확인이 필요합니다.' }; if (!validateGrowthSave(save))
        return { ok: false, message: '새 카페 정보가 올바르지 않습니다.' }; try {
        if (!this.storage)
            throw Error('unavailable');
        const old = this.storage.getItem(this.key);
        if (old !== null)
            this.storage.setItem(this.key + '.backup.' + Date.now() + '.' + this.backupSequence++, old);
        return this.write(save);
    }
    catch {
        return { ok: false, message: '기존 저장을 보관할 수 없어 초기화하지 않았습니다.' };
    } }
}
export class BrowserGrowthRepository extends LocalSaveRepository {
    write(save, expected) { if ((save.roster || supportsGrowthLock()) && !hasGrowthWriteLock())
        return { ok: false, message: '다른 창의 저장을 보호하기 위해 카페를 다시 열어 주세요.' }; return super.write(save, expected); }
    replace(save, confirmed) { if ((save.roster || supportsGrowthLock()) && !hasGrowthWriteLock())
        return { ok: false, message: '카페 저장 권한을 먼저 확인해 주세요.' }; return super.replace(save, confirmed); }
}
