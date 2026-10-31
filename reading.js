import { escapeText } from './questionRenderer.js';
export function readingErrors(q) { const r = q.readingContext; if (!r)
    return []; try {
    if (!r.groupId || !r.passageId || !r.title || !Array.isArray(r.paragraphs) || !r.paragraphs.length || !r.paragraphs.every(x => typeof x === 'string' && x.trim()) || r.total !== 5 || !Number.isInteger(r.position) || r.position < 1 || r.position > 5 || r.reviewRequired !== true || !Array.isArray(r.tables))
        return ['reading schema'];
    for (const t of r.tables)
        if (!t.id || !t.caption || !Array.isArray(t.columns) || t.columns.length < 2 || !t.columns.every(x => typeof x === 'string') || !Array.isArray(t.rows) || !t.rows.length || !t.rows.every(row => Array.isArray(row) && row.length === t.columns.length && row.every(x => typeof x === 'string')))
            return ['material schema'];
    if (r.materialRequired && !r.tables.length)
        return ['missing material'];
    if (q.type === 'short_answer' && (!q.answerPolicy || q.answerPolicy.ignoreSpaces !== true || q.answerPolicy.terminalPunctuation !== true || !Array.isArray(q.answerPolicy.accepted) || !q.answerPolicy.accepted.length || !q.answerPolicy.accepted.every(x => typeof x === 'string' && x.trim()) || !q.answerPolicy.accepted.includes(q.answer)))
        return ['answer policy'];
    return [];
}
catch {
    return ['reading schema'];
} }
export function gradeAnswer(q, answer, normalize) { if (q.type === 'short_answer' && q.answerPolicy) {
    const norm = (s) => s.normalize('NFKC').trim().replace(/\s+/g, '').replace(/[.!?。！？]+$/u, '').toUpperCase();
    return q.answerPolicy.accepted.some(a => norm(a) === norm(answer));
} return normalize(answer) === normalize(q.answer); }
export function materialHtml(r) { return r.tables.map(t => '<table class="reading-table"><caption>' + escapeText(t.caption) + '</caption><thead><tr>' + t.columns.map(c => '<th scope="col">' + escapeText(c) + '</th>').join('') + '</tr></thead><tbody>' + t.rows.map(row => '<tr>' + row.map(c => '<td>' + escapeText(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>').join(''); }
export function passageHtml(r) { return '<div class="reading-text">' + r.paragraphs.map(p => '<p>' + escapeText(p) + '</p>').join('') + '</div>' + materialHtml(r); }
