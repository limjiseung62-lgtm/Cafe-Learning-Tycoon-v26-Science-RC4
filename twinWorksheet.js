import { questionCatalog, validatePack } from './questionPack.js';
import { escapeText, renderQuestionText, renderDiagram } from './questionRenderer.js';
import { passageHtml } from './reading.js';
const shareable = (q) => { const flags = q; return !q.material && flags.publicExportAllowed !== false && flags.sourceType !== 'publisher-copyright'; };
const fingerprint = (question, diagram = '', choices = []) => JSON.stringify([question.trim(), diagram, [...choices].sort()]);
/** Select already validated alternatives; never invent a question or export a restricted original. */
export function buildTwinWorksheet(report, pack, seenIds = []) {
    if (pack.packId !== report.questionPackId || validatePack(pack).length)
        throw Error('복습 문제팩을 확인해 주세요.');
    const flags = pack;
    if (flags.publicExportAllowed === false || flags.sourceType === 'publisher-copyright')
        return { packName: report.packName || pack.title, items: [], skipped: report.wrong.length };
    const all = pack.questions.flatMap(q => [q, ...q.twin ? [q.twin] : []]);
    const wrongIds = new Set(report.wrong.map(w => w.question.questionId)), usedIds = new Set(), seen = new Set(seenIds);
    const usedPrints = new Set(report.wrong.map(w => fingerprint(w.question.question, w.question.diagram, w.question.choices)));
    const items = [];
    let skipped = 0;
    for (const wrong of report.wrong) {
        const source = all.find(q => q.questionId === wrong.question.questionId);
        if (wrong.question.restricted || !source || !shareable(source)) {
            skipped++;
            continue;
        }
        const candidates = [...(source.twin ? [source.twin] : []), ...all].filter(q => q.packId === pack.packId && q.skillId === source.skillId && shareable(q) && !wrongIds.has(q.questionId) && !usedIds.has(q.questionId) && !usedPrints.has(fingerprint(q.question, q.diagram, q.choices)));
        const chosen = candidates.find(q => !seen.has(q.questionId)) ?? candidates[0];
        if (!chosen) {
            skipped++;
            continue;
        }
        usedIds.add(chosen.questionId);
        usedPrints.add(fingerprint(chosen.question, chosen.diagram, chosen.choices));
        items.push({ question: structuredClone(chosen), label: wrong.question.learningObjective.label, kind: chosen.questionId === source.twin?.questionId ? 'twin' : 'same_skill', previouslySeen: seen.has(chosen.questionId) });
    }
    return { packName: report.packName || pack.title, items, skipped };
}
export function worksheetHtml(sheet, answers = false) {
    const title = answers ? '쌍둥이 문제 복습지 · 정답과 해설' : '쌍둥이 문제 복습지';
    const passages = new Set();
    const content = sheet.items.map((item, i) => {
        const q = item.question;
        let reading = '';
        if (!answers && q.readingContext && !passages.has(q.readingContext.passageId)) {
            passages.add(q.readingContext.passageId);
            reading = '<section class="passage"><h2>' + escapeText(q.readingContext.title) + '</h2>' + passageHtml(q.readingContext) + '</section>';
        }
        return reading + '<article><h2>' + (i + 1) + '. ' + escapeText(item.label) + '</h2><p class="kind">' + (item.kind === 'twin' ? '쌍둥이 문제' : '같은 학습 요소의 다른 문제') + '</p><p class="prompt">' + renderQuestionText(q.question) + '</p>' + (answers ? '<p class="answer-key"><strong>정답:</strong> ' + renderQuestionText(q.answer) + '</p><div class="explanation"><strong>해설</strong><p>' + renderQuestionText(q.explanation) + '</p></div>' : renderDiagram(q.diagram) + (q.choices.length ? '<ol class="choices">' + q.choices.map(c => '<li>' + renderQuestionText(c) + '</li>').join('') + '</ol>' : '') + '<div class="work-space">내 답: ____________________<br><br>생각한 방법:</div>') + '</article>';
    }).join('');
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{max-width:820px;margin:24px auto;padding:0 18px;color:#302a22;background:#fff;font:16px/1.7 "Malgun Gothic","Apple SD Gothic Neo",sans-serif}h1{font-size:26px}h2{font-size:19px;margin:8px 0}article{padding:18px 0;border-top:1px solid #cabb9d;break-inside:avoid;overflow-wrap:anywhere}.prompt,.reading-text{white-space:pre-line}.kind{font-size:13px;color:#665a47}.choices{padding-left:28px}.choices li{padding:4px 0}.work-space{min-height:100px;margin-top:20px;color:#665a47}.explanation{padding:12px;background:#f0f3e8}.passage{padding:14px;border:1px solid #cabb9d;margin:20px 0;break-inside:avoid}.reading-table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:6px}.question-diagram{margin:12px 0}.question-diagram>img{display:block;max-width:100%;width:560px;height:auto;max-height:270px;object-fit:contain}.question-diagram details{display:none}.fraction{display:inline-flex;align-items:center;gap:3px;vertical-align:middle}.fraction-stack{display:inline-flex;flex-direction:column;align-items:center;line-height:1.2}.fraction-stack>span:first-child{border-bottom:1px solid;padding:0 3px}.toolbar button{padding:12px;font:inherit;cursor:pointer}.note{font-size:14px;color:#665a47}@media print{body{max-width:none;margin:0;padding:0;font-size:12pt}.toolbar{display:none}.question-diagram details{display:none}h1{font-size:20pt}h2{font-size:14pt}}</style></head><body><header><h1>' + title + '</h1><p>' + escapeText(sheet.packName) + ' · ' + sheet.items.length + '문항</p><p class="note">이번 판 오답과 같은 학습 요소의 등록된 문제로 만들었어요. ' + (answers ? '학생용 복습지와 별도로 보관하세요.' : '문제를 풀고 별도 정답·해설로 확인하세요.') + '</p>' + (sheet.items.some(i => i.previouslySeen) ? '<p class="note">이미 풀어 본 다른 문항이 일부 포함될 수 있어요.</p>' : '') + '<div class="toolbar"><button onclick="window.print()">인쇄 / PDF 저장</button></div></header><main>' + content + '</main><footer class="note">카페 학습 타이쿤 · 학생의 이름·입력 답안·원래 오답 기록은 이 파일에 넣지 않았어요.</footer></body></html>';
}
const cleanups = new WeakMap();
export function mountTwinWorksheet(host, analytics, scope) {
    cleanups.get(scope)?.();
    host.insertAdjacentHTML('beforeend', '<section class="twin-worksheet"><h3>쌍둥이 문제 복습지</h3><p>이번 판에서 틀린 문제와 같은 학습 요소의 다른 문제를 모아요. 문제와 정답·해설은 별도 파일이에요.</p><div class="analytics-actions"><a id="download-twins" class="primary" download="cafe-twin-practice.html" target="_blank" rel="noopener" hidden>복습지 다운로드 (HTML)</a><a id="download-twin-answers" class="secondary" download="cafe-twin-answers.html" target="_blank" rel="noopener" hidden>정답·해설 다운로드 (HTML)</a><button id="print-twins" class="secondary" disabled>복습지 열기 / 인쇄·PDF</button></div><p id="twin-status" role="status">복습 문제를 준비하고 있어요…</p><button id="retry-twins" class="secondary" hidden>다시 준비하기</button><p class="hint">HTML 파일은 내려받은 뒤 브라우저에서 열 수 있어요. 인쇄 메뉴에서 PDF로 저장할 수도 있어요.</p></section>');
    const status = host.querySelector('#twin-status'), retry = host.querySelector('#retry-twins'), print = host.querySelector('#print-twins');
    const student = host.querySelector('#download-twins'), key = host.querySelector('#download-twin-answers');
    const urls = [];
    cleanups.set(scope, () => urls.forEach(url => URL.revokeObjectURL(url)));
    let busy = false;
    const prepare = async () => {
        if (busy)
            return;
        busy = true;
        retry.hidden = true;
        const report = analytics.report();
        if (!report.wrong.length) {
            status.textContent = '이번 기록에는 틀린 문제가 없어 복습지를 만들지 않았어요.';
            busy = false;
            return;
        }
        if (report.wrong.every(w => w.question.restricted)) {
            status.textContent = '비공개 교실 문제는 복습지로 내보내지 않아요. 선생님과 확인해 주세요.';
            busy = false;
            return;
        }
        try {
            const pack = await questionCatalog.load(report.questionPackId);
            if (!host.isConnected)
                return;
            const sheet = buildTwinWorksheet(report, pack, analytics.checkpoint().seen);
            if (!sheet.items.length) {
                status.textContent = '원래 오답과 겹치지 않는 등록 복습 문제가 없어요. 위의 오답·해설로 복습해 주세요.';
                return;
            }
            const html = worksheetHtml(sheet), answers = worksheetHtml(sheet, true);
            student.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
            key.href = URL.createObjectURL(new Blob([answers], { type: 'text/html;charset=utf-8' }));
            urls.push(student.href, key.href);
            student.hidden = key.hidden = false;
            print.disabled = false;
            status.textContent = sheet.items.length + '문항 준비 완료' + (sheet.skipped ? ' · 안전한 대체 문항이 없거나 비공개인 ' + sheet.skipped + '문항은 제외했어요.' : '.');
            print.onclick = () => { const view = window.open('', '_blank'); if (!view) {
                status.textContent = '새 창을 열지 못했어요. HTML 복습지를 내려받아 열어 주세요.';
                return;
            } view.opener = null; view.document.write(html); view.document.close(); };
        }
        catch {
            if (host.isConnected) {
                status.textContent = '복습 문제팩을 불러오지 못했어요. 연결을 확인하고 다시 준비해 주세요.';
                retry.hidden = false;
            }
        }
        finally {
            busy = false;
        }
    };
    retry.onclick = () => { questionCatalog.reset(); void prepare(); };
    void prepare();
}
