export function escapeText(text) { return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function renderQuestionText(text) { text = text.replace(/^(\d+)\/(\d+)(L|m|kg)?$/, '[FRACTION:$1/$2]$3'); text = text.replace(/(?<![\w:/])(\d+)\s*(?:와|과)\s*(\d+)\/(\d+)/g, '[FRACTION:$1 $2/$3]'); const regex = /\[FRACTION:(?:(\d+) )?(\d+)\/(\d+)\]/g; let output = '', cursor = 0; for (const match of text.matchAll(regex)) {
    output += escapeText(text.slice(cursor, match.index)).replace(/\n/g, '<br>');
    output += '<span class="fraction" aria-label="' + (match[1] ? match[1] + '과 ' : '') + match[3] + '분의 ' + match[2] + '">' + (match[1] ? '<span class="fraction-whole">' + match[1] + '</span>' : '') + '<span class="fraction-stack"><span>' + match[2] + '</span><span>' + match[3] + '</span></span></span>';
    cursor = match.index + match[0].length;
} return output + escapeText(text.slice(cursor)).replace(/\n/g, '<br>'); }
/** Authored self-contained SVG only, rendered as an inert image. */
export function safeDiagram(svg) { return svg.length < 60000 && /^<svg\s/i.test(svg) && /<\/svg>\s*$/i.test(svg) && !/<\s*(?:script|image|foreignObject|iframe|object|embed|use|style|animate|set)\b|\bon\w+\s*=|\b(?:href|src)\s*=|url\s*\(|<!/i.test(svg); }
export function renderDiagram(svg, label = '도형') { if (!svg || !safeDiagram(svg))
    return ''; const alt = /<title>([^<]+)<\/title>/.exec(svg)?.[1] ?? '문제에 제시된 도형'; const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); return '<figure class="question-diagram"><img src="' + escapeText(src) + '" alt="' + escapeText(alt) + '"><details><summary>' + escapeText(label) + ' 확대 / 접기</summary><div class="diagram-scroll"><img src="' + escapeText(src) + '" alt="' + escapeText(alt) + ' · 확대"></div></details></figure>'; }
