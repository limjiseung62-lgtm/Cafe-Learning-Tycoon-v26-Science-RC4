import { QuestionPackCatalog, JsonQuestionProvider, validatePack } from './questionPack.js';
const digestPattern = /^[a-f0-9]{64}$/;
export async function publicationSHA256(bytes) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer)), b => b.toString(16).padStart(2, '0')).join(''); }
function requireThat(value, code) { if (!value)
    throw Error(code); }
export function inspectStaticPublication(value, pin, purpose) {
    requireThat(purpose === 'review' || purpose === 'production', 'PUBLICATION_PURPOSE');
    const m = value;
    requireThat(m?.schemaVersion === 'cafe-static-publication/1', 'PUBLICATION_SCHEMA');
    requireThat(m.packId === pin.packId && m.version === pin.version && /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(m.version), 'PUBLICATION_ID_VERSION');
    requireThat(m.source?.owner === 'common-question-bank' && typeof m.source.version === 'string' && !!m.source.version && digestPattern.test(m.source.sha256), 'PUBLICATION_SOURCE');
    requireThat(m.artifact && /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.json$/.test(m.artifact.file) && !m.artifact.file.includes('..') && Number.isSafeInteger(m.artifact.bytes) && m.artifact.bytes > 0 && m.artifact.bytes <= 10000000 && digestPattern.test(m.artifact.sha256), 'PUBLICATION_ARTIFACT');
    requireThat(Number.isSafeInteger(m.questionCount) && m.questionCount > 0 && m.descriptor?.packId === m.packId, 'PUBLICATION_DESCRIPTOR');
    requireThat(m.release && ['operational', 'rightsCleared', 'teacherReviewCleared', 'curriculumCleared', 'reviewProviderRegistered'].every(k => typeof m.release[k] === 'boolean') && Array.isArray(m.release.holds) && m.release.holds.every(x => typeof x === 'string') && Array.isArray(m.release.evidenceRefs) && m.release.evidenceRefs.every(x => typeof x === 'string' && !!x.trim()), 'PUBLICATION_APPROVAL');
    requireThat(['legacy-preserved-review-only', 'bank-approved'].includes(m.relationPolicy), 'PUBLICATION_RELATION_POLICY');
    if (purpose === 'production')
        requireThat(m.release.operational && m.release.rightsCleared && m.release.teacherReviewCleared && m.release.curriculumCleared && m.release.reviewProviderRegistered && m.release.evidenceRefs.length > 0 && m.release.holds.length === 0 && m.relationPolicy === 'bank-approved', 'PUBLICATION_HELD');
    return m;
}
/** The common-bank exporter also uses this stronger boundary, without changing v2.0's legacy validator. */
export function validateStaticPack(pack) {
    const errors = validatePack(pack);
    const ids = new Set();
    const sources = new Set();
    if (errors.length)
        return errors;
    const restricted = (v) => { const x = v; return !!x && (x.publicExportAllowed === false || x.sourceType === 'publisher-copyright' || !!x.material); };
    if (restricted(pack))
        errors.push('publication restricted pack');
    for (const q of pack.questions ?? []) {
        if (ids.has(q.questionId) || sources.has(q.sourceId))
            errors.push('publication duplicate identity');
        ids.add(q.questionId);
        sources.add(q.sourceId);
        if (!q.skillId.trim() || q.difficulty < 1 || q.difficulty > 5)
            errors.push('publication skill/difficulty ' + q.questionId);
        if (!['수학', '국어', '영어', '사회', '과학'].includes(q.subject) || ![3, 4, 5, 6].includes(q.grade) || ![1, 2].includes(q.semester))
            errors.push('publication pool metadata ' + q.questionId);
        if (restricted(q) || restricted(q.twin))
            errors.push('publication restricted material ' + q.questionId);
        if (q.twin?.twin)
            errors.push('publication nested twin ' + q.questionId);
        if (q.twin) {
            const root = pack.questions.find(p => p.questionId === q.twin.questionId);
            if (root && JSON.stringify([root.prompt, root.choices, root.answer, root.explanation, root.diagram]) !== JSON.stringify([q.twin.prompt, q.twin.choices, q.twin.answer, q.twin.explanation, q.twin.diagram]))
                errors.push('publication twin alias content ' + q.questionId);
        }
    }
    return errors;
}
export async function loadStaticQuestionPack(pin, purpose, request = fetch.bind(globalThis)) {
    requireThat(digestPattern.test(pin.sha256), 'PUBLICATION_PIN');
    const url = new URL(pin.manifestURL, typeof location === 'undefined' ? undefined : location.href);
    requireThat(!url.username && !url.password && (url.protocol === 'https:' || url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)), 'PUBLICATION_PROTOCOL');
    const response = await request(url.href);
    requireThat(response.ok, 'PUBLICATION_FETCH');
    const bytes = new Uint8Array(await response.arrayBuffer());
    requireThat(bytes.length < 100000 && await publicationSHA256(bytes) === pin.sha256, 'PUBLICATION_MANIFEST_HASH');
    const publication = inspectStaticPublication(JSON.parse(new TextDecoder().decode(bytes)), pin, purpose);
    const artifactURL = new URL(publication.artifact.file, url);
    requireThat(artifactURL.origin === url.origin, 'PUBLICATION_ORIGIN');
    const result = await request(artifactURL.href);
    requireThat(result.ok, 'PUBLICATION_PACK_FETCH');
    const payload = new Uint8Array(await result.arrayBuffer());
    requireThat(payload.length === publication.artifact.bytes && await publicationSHA256(payload) === publication.artifact.sha256, 'PUBLICATION_PACK_HASH');
    const pack = JSON.parse(new TextDecoder().decode(payload));
    requireThat(pack.packId === pin.packId && pack.version === pin.version && pack.questions.length === publication.questionCount, 'PUBLICATION_PACK_ID_VERSION');
    requireThat(!validateStaticPack(pack).length, 'PUBLICATION_PACK_CONTRACT');
    const d = publication.descriptor;
    requireThat(d.grade === pack.grade && d.semester === pack.semester && d.subject === pack.subject && d.unit === pack.unit && d.title === pack.title, 'PUBLICATION_METADATA');
    return { pack, publication, descriptor: { ...d, file: artifactURL.href }, provider: new JsonQuestionProvider(pack) };
}
/** Opt-in catalog; the current game entry point and registry remain untouched. */
export class PublishedQuestionPackCatalog extends QuestionPackCatalog {
    pins;
    purpose;
    fetcher;
    loaded = new Map();
    constructor(pins, purpose, fetcher = fetch.bind(globalThis)) {
        super(fetcher);
        this.pins = pins;
        this.purpose = purpose;
        this.fetcher = fetcher;
        requireThat(new Set(pins.map(p => p.packId)).size === pins.length, 'PUBLICATION_DUPLICATE_PACK');
    }
    read(id) { const pin = this.pins.find(p => p.packId === id); requireThat(pin, 'PUBLICATION_UNKNOWN_PACK'); if (!this.loaded.has(id)) {
        const pending = loadStaticQuestionPack(pin, this.purpose, this.fetcher).catch(e => { this.loaded.delete(id); throw e; });
        this.loaded.set(id, pending);
    } return this.loaded.get(id); }
    reset() { super.reset(); this.loaded.clear(); }
    async list() { return Promise.all(this.pins.map(async (p) => structuredClone((await this.read(p.packId)).descriptor))); }
    async load(id) { return structuredClone((await this.read(id)).pack); }
}
