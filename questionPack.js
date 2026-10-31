import { safeDiagram } from './questionRenderer.js';
import { readingErrors } from './reading.js';
export function normalizeAnswer(text) { return text.trim().normalize('NFKC').replace(/\s+/g, ' ').toUpperCase(); }
export function validateQuestion(q) { const errors = []; if (!q || typeof q !== 'object' || ![q.questionId, q.sourceId, q.packId, q.skillId, q.prompt, q.question, q.answer, q.explanation].every(x => typeof x === 'string') || !Array.isArray(q.choices) || !q.choices.every(x => typeof x === 'string') || !Array.isArray(q.tags) || !q.tags.every(x => typeof x === 'string'))
    return ['schema']; if (!q.questionId || !q.sourceId || !q.packId || !q.skillId)
    errors.push('identity'); if (!q.prompt.trim() || q.prompt !== q.question || /<[^>]*>/.test(q.prompt + q.explanation + q.choices.join('')))
    errors.push('text'); if (!['multiple_choice', 'ox', 'short_answer'].includes(q.type))
    errors.push('type'); if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || !Number.isInteger(q.grade) || q.grade < 1 || !Number.isInteger(q.semester) || q.semester < 1 || typeof q.subject !== 'string' || typeof q.unit !== 'string')
    errors.push('metadata'); if (!q.answer.trim() || !q.explanation.trim())
    errors.push('answer'); if (q.type !== 'short_answer') {
    if (q.choices.length < 2 || new Set(q.choices.map(normalizeAnswer)).size !== q.choices.length || !q.choices.some(c => normalizeAnswer(c) === normalizeAnswer(q.answer)))
        errors.push('choices');
} if (q.answerPolicy && (q.type !== 'short_answer' || q.answerPolicy.ignoreSpaces !== true || q.answerPolicy.terminalPunctuation !== true || !Array.isArray(q.answerPolicy.accepted) || !q.answerPolicy.accepted.length || !q.answerPolicy.accepted.every(a => typeof a === 'string' && a.trim()) || !q.answerPolicy.accepted.includes(q.answer) || new Set(q.answerPolicy.accepted.map(normalizeAnswer)).size !== q.answerPolicy.accepted.length))
    errors.push('answer policy'); if (q.type === 'ox' && q.choices.some(c => !['O', 'X'].includes(c)))
    errors.push('ox'); for (const m of (q.prompt + q.choices.join('')).matchAll(/\[FRACTION:(?:(\d+) )?(\d+)\/(\d+)\]/g))
    if (Number(m[3]) <= 0 || Number(m[2]) < 0)
        errors.push('fraction'); if (q.diagram !== undefined && (typeof q.diagram !== 'string' || !safeDiagram(q.diagram)))
    errors.push('diagram'); if (q.material && (!Array.isArray(q.material.assetIds) || !q.material.assetIds.length || !q.material.assetIds.every(a => /^source-\d-page-\d+\.jpg$/.test(a)) || !Number.isInteger(q.material.initialPage) || q.material.initialPage < 0 || q.material.initialPage >= q.material.assetIds.length || typeof q.material.caption !== 'string'))
    errors.push('private material'); if (q.material && q.type === 'short_answer' && (!q.answerPolicy || q.answerPolicy.ignoreSpaces !== true || q.answerPolicy.terminalPunctuation !== true || !Array.isArray(q.answerPolicy.accepted) || !q.answerPolicy.accepted.includes(q.answer) || !q.answerPolicy.accepted.every(a => typeof a === 'string' && a.trim())))
    errors.push('private answer policy'); if (q.material?.selectionCount && (!Number.isInteger(q.material.selectionCount) || q.material.selectionCount < 1 || q.material.selectionCount > 5 || (q.material.selectionCount > 1 && (!Array.isArray(q.material.originalChoices) || q.material.originalChoices.length < q.material.selectionCount || !q.material.originalChoices.every(c => typeof c === 'string')))))
    errors.push('private multi-choice'); errors.push(...readingErrors(q)); return errors; }
export function validatePack(pack) { const errors = []; if (pack?.requiresGroupedProvider && (!Array.isArray(pack.questions) || pack.questions.some(q => !q?.readingContext)))
    errors.push('grouped adapter required'); if (!pack || !Array.isArray(pack.questions) || !Array.isArray(pack.templates))
    return ['schema']; if (pack.schemaVersion !== 1 || !pack.packId || !pack.title || !pack.version || !pack.questions.length)
    errors.push('pack'); if (![pack.packId, pack.title, pack.subject, pack.unit, pack.version, pack.source].every(v => typeof v === 'string' && v.trim()) || !Number.isInteger(pack.grade) || pack.grade < 1 || !Number.isInteger(pack.semester) || pack.semester < 1)
    return ['metadata']; if (pack.questions.some(q => q?.readingContext)) {
    if (pack.questions.some(q => !q?.readingContext))
        errors.push('mixed reading pack');
    const groups = new Map();
    for (const q of pack.questions) {
        if (!q?.readingContext)
            continue;
        const id = q.readingContext.groupId;
        groups.set(id, [...(groups.get(id) ?? []), q]);
    }
    for (const list of groups.values()) {
        if (list.length !== 5 || new Set(list.map(q => q.readingContext.position)).size !== 5 || new Set(list.map(q => q.readingContext.passageId)).size !== 1 || new Set(list.map(q => JSON.stringify({ ...q.readingContext, position: 0, materialRequired: false }))).size !== 1)
            errors.push('inconsistent reading group');
    }
} const ids = new Set(); for (const q of pack.questions) {
    if (!q || typeof q !== 'object') {
        errors.push('question schema');
        continue;
    }
    if (ids.has(q.questionId))
        errors.push('duplicate ' + q.questionId);
    ids.add(q.questionId);
    if (q.packId !== pack.packId || q.grade !== pack.grade || q.subject !== pack.subject || q.semester !== pack.semester || q.unit !== pack.unit)
        errors.push('metadata ' + q.questionId);
    errors.push(...validateQuestion(q).map(e => q.questionId + ':' + e));
    if (q.twin) {
        errors.push(...validateQuestion(q.twin).map(e => q.questionId + '/twin:' + e));
        if (q.twin.packId !== pack.packId || q.twin.skillId !== q.skillId || q.twin.questionId === q.questionId)
            errors.push('twin identity ' + q.questionId);
    }
} return errors; }
export class JsonQuestionProvider {
    pack;
    packId;
    constructor(pack) {
        this.pack = pack;
        const errors = validatePack(pack);
        if (errors.length)
            throw Error('Invalid pack: ' + errors.join(', '));
        this.packId = pack.packId;
    }
    list() { return structuredClone(this.pack.questions); }
    generateTwin(q) { const twin = q.twin ? structuredClone(q.twin) : null; return twin && !validateQuestion(twin).length ? twin : null; }
    twin(q) { return this.generateTwin(q); }
}
export function legacyQuestions(pool, packId = 'legacy-demo') { return pool.map(q => ({ ...q, questionId: packId + '/' + q.problemId, sourceId: q.problemId, packId, prompt: q.question, skillId: packId + '/' + q.unit, tags: [q.unit] })); }
export class QuestionPackCatalog {
    request;
    manifest;
    packs = new Map();
    registry = null;
    constructor(request = fetch.bind(globalThis), manifest = 'assets/questions/registry.json') {
        this.request = request;
        this.manifest = manifest;
    }
    reset() { this.registry = null; this.packs.clear(); }
    list() { return this.registry ??= (async () => { const response = await this.request(this.manifest); if (!response.ok)
        throw Error('문제팩 목록을 불러오지 못했어요.'); const list = await response.json(); if (!Array.isArray(list) || !list.length || new Set(list.map(x => x.packId)).size !== list.length || list.some(x => !x.packId || !x.title || !x.file))
        throw Error('문제팩 목록을 확인해 주세요.'); return list; })(); }
    async selectable(mode) { const list = (await this.list()).filter(p => mode === 'growth' ? (p.enabledForGrowth ?? p.enabledForSelection !== false) : p.enabledForSelection !== false); if (!list.length)
        throw Error('활성화된 문제팩이 없어요.'); return list.sort((a, b) => Number(!!b.defaultForSelection) - Number(!!a.defaultForSelection)); }
    async load(id) { if (!this.packs.has(id))
        this.packs.set(id, (async () => { const descriptor = (await this.list()).find(x => x.packId === id); if (!descriptor)
            throw Error('없는 문제팩이에요.'); if (descriptor.publication) {
            const { loadStaticQuestionPack, publicationSHA256 } = await import('./staticQuestionPublication.js');
            const loaded = await loadStaticQuestionPack(descriptor.publication, 'production', this.request);
            if (loaded.pack.packId !== id)
                throw Error('문제팩 ID 불일치');
            if (descriptor.spacedReview) {
                if (!descriptor.reviewRelations || descriptor.spacedReview.version !== 1 || !['every-correct'].includes(descriptor.spacedReview.foodPolicy))
                    throw Error('복습 정책 오류');
                const r = await this.request(descriptor.reviewRelations.file);
                if (!r.ok)
                    throw Error('복습 관계 로딩 실패');
                const bytes = new Uint8Array(await r.arrayBuffer());
                if (await publicationSHA256(bytes) !== descriptor.reviewRelations.sha256)
                    throw Error('복습 관계 해시 오류');
                const links = JSON.parse(new TextDecoder().decode(bytes));
                if (links.packId !== id || links.version !== loaded.pack.version)
                    throw Error('복습 관계 버전 오류');
                for (const q of loaded.pack.questions) {
                    const row = links.questions[q.questionId];
                    if (!row || !Array.isArray(row.equivalent) || !Array.isArray(row.masteryCheck))
                        throw Error('복습 관계 누락');
                    for (const peer of [...row.equivalent, ...row.masteryCheck])
                        if (!loaded.pack.questions.some(p => p.questionId === peer && p.skillId === q.skillId && p.questionId !== q.questionId))
                            throw Error('복습 학습 요소 오류');
                    q.spacedReview = descriptor.spacedReview;
                    q.packVersion = loaded.pack.version;
                    q.manifestHash = descriptor.publication.sha256;
                    q.reviewVariantIds = row.equivalent;
                    q.masteryVariantIds = row.masteryCheck;
                }
            }
            return loaded.pack;
        } const response = await this.request(descriptor.file); if (!response.ok)
            throw Error('문제팩을 불러오지 못했어요.'); const pack = await response.json(); if (pack.packId !== id || validatePack(pack).length)
            throw Error('문제팩 데이터를 확인해 주세요.'); return pack; })()); return structuredClone(await this.packs.get(id)); }
}
export let questionCatalog = new QuestionPackCatalog();
export function configureQuestionCatalog(catalog) { questionCatalog = catalog; }
