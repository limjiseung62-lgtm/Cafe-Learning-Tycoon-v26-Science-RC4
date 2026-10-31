import { mountManagementResult } from './managementResults.js';
import { mountTwinWorksheet } from './twinWorksheet.js';
import { incompleteRunHistory } from './classroomCheckpoint.js';
import { percentage } from './learningAnalytics.js';
import { renderQuestionText, renderDiagram, escapeText as esc } from './questionRenderer.js';
export function cafeResultData(game) { return { producedFoodStored: game.successfulProduction, cafeId: game.mode === 'CAFE_GROWTH' ? (game.growthCafeId ?? 'cafe-1') : null, events: game.events.enabled ? game.events.report() : null, mode: game.run ? '오늘의 카페' : game.mode === 'CAFE_GROWTH' ? '내 카페 키우기 · 이번 영업' : '수업 게임', playSeconds: Math.round(game.result.playSeconds), cafeLevel: game.cafeLevel, cafeName: game.cafe.name, revenue: game.stats.revenue, customers: game.stats.servedCustomers, soldFood: game.stats.soldFood, money: game.money, staff: game.service.paid.map(w => ({ name: w.name, level: w.level })), menus: game.menus.map(m => ({ name: m.name, level: m.currentLevel })), run: game.run ? { ...game.run.report(), finalAssigned: incompleteRunHistory.has(game) ? null : game.run.finalAssigned } : null }; }
const num = (v) => v.toLocaleString('ko-KR');
const rateRow = (label, c) => '<div><span>' + esc(label) + '</span><strong>' + percentage(c) + '</strong><small>' + num(c.correct) + ' / ' + num(c.attempted) + '문항</small></div>';
export function resultLines(game, report, total) { const review = { attempted: report.byType.remediation.attempted + report.byType.twin.attempted, correct: report.byType.remediation.correct + report.byType.twin.correct }; return ['카페 학습 타이쿤 · 오늘의 결과표', game.mode + ' · 플레이 ' + Math.floor(game.playSeconds / 60) + '분 ' + game.playSeconds % 60 + '초', '학습 내용: ' + (report.packName || report.questionPackId), '카페 성장 결과', (game.cafeId ? (game.cafeId === 'cafe-2' ? '2호점 · ' : '1호점 · ') : '') + game.cafeName + ' · ' + game.cafeLevel + '단계', '총매출 ' + num(game.revenue) + '원 · 보유금 ' + num(game.money) + '원', '손님 ' + game.customers + '명 · 판매 음식 ' + game.soldFood + '개 · 직원 ' + game.staff.length + '명', '직원 강화: ' + (game.staff.map(w => w.name + ' Lv.' + w.level).join(' / ') || '고용 없음'), '메뉴 강화: ' + game.menus.map(m => m.name + ' ★' + m.level).join(' / '), ...(game.run ? ['시작 콘셉트: ' + game.run.concept, '선택 특성 ' + game.run.traits.length + '/4: ' + (game.run.traits.join(' / ') || '선택 없음'), '파티: 배정 ' + (game.run.finalAssigned ?? '미기록') + ' · 결제 ' + game.run.finalPaid + ' · 완료 보상 ' + (game.run.finalRewarded ? '받음' : '받지 않음')] : []), ...(game.events ? ['이벤트 성과 (학습 정답률과 별도)', '이벤트 ' + game.events.occurred + '회 · 미션 성공 ' + game.events.missionSuccess + ' / 실패 ' + game.events.missionFailed + ' / 종료 취소 ' + game.events.missionCancelled, '이벤트 보상 ' + game.events.cashReward + '원 · 재고 선물 가치 ' + game.events.giftValue + '원', '가장 큰 보상: ' + (game.events.best ? game.events.best.name + ' ' + game.events.best.value + '원' : '없음')] : []), '나의 학습 결과', ...(report.spacedReview ? ['최초 도전 ' + percentage(report.spacedReview.first) + ' · ' + report.spacedReview.first.correct + '/' + report.spacedReview.first.attempted, '개념 복습 ' + percentage(report.spacedReview.review) + ' · ' + report.spacedReview.review.correct + '/' + report.spacedReview.review.attempted, '숙달 확인 ' + report.spacedReview.mastery.correct + '/' + report.spacedReview.mastery.attempted, '숙달 학습 요소 ' + report.spacedReview.mastered.map(id => report.spacedReview.labels[id] ?? id).join(' · '), '추가 복습 학습 요소 ' + report.spacedReview.needsReview.map(id => report.spacedReview.labels[id] ?? id).join(' · '), '미완료 복습 ' + report.spacedReview.pending + '건 · 생산 허용 ' + report.spacedReview.production + '회 · 실제 보관 ' + game.producedFoodStored + '개', '간격 조정 ' + report.spacedReview.shortages + ' · 예약 지연 ' + report.spacedReview.delayed] : []), '풀이 ' + total.attempted + ' · 정답 ' + total.correct + ' · 오답 ' + (total.attempted - total.correct) + ' · 정답률 ' + percentage(total), '최초 출제 ' + percentage(report.byType.first) + ' (' + report.byType.first.correct + '/' + report.byType.first.attempted + ')', '일반 반복 ' + percentage(report.byType.repeat) + ' (' + report.byType.repeat.correct + '/' + report.byType.repeat.attempted + ')', '오답 복습·쌍둥이 ' + percentage(review) + ' (' + review.correct + '/' + review.attempted + ')', '복습 성공 ' + report.remediationOutcome.success + '회 · 그중 쌍둥이 ' + report.remediationOutcome.twinSuccess + '회', ...(total.attempted !== report.total.attempted ? ['상세 분석은 이 기기에 남아 있는 ' + report.total.attempted + '문항 기준입니다.'] : []), '학습 요소별 결과', ...report.objectives.flatMap(o => [o.label + ': ' + o.total.attempted + '문항 / 정답 ' + o.total.correct + ' / 오답 ' + (o.total.attempted - o.total.correct) + ' / ' + percentage(o.total), o.feedback + ' (최초 ' + o.first.attempted + '문항 기준)']), ...(!report.total.attempted ? ['학습 기록이 더 필요해요. 다음에는 음식 만들기로 도전해 보세요.'] : []), '개인정보 입력 없음 · 브라우저에서 생성 · 원문과 답안 상세는 다운로드에 포함하지 않음']; }
export async function resultPng(lines) { await document.fonts.ready; const canvas = document.createElement('canvas'); const context = canvas.getContext('2d'); if (!context)
    throw Error('이미지 저장을 지원하지 않는 브라우저예요. 인쇄/PDF 저장을 사용해 주세요.'); const font = '24px "Cafe Information", "Malgun Gothic", sans-serif'; context.font = font; const wrapped = []; for (const line of lines) {
    let current = '';
    for (const char of line) {
        if (context.measureText(current + char).width > 1030) {
            wrapped.push(current);
            current = char;
        }
        else
            current += char;
    }
    wrapped.push(current);
} canvas.width = 1200; canvas.height = 150 + wrapped.length * 44; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#faf4e8'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fffdf8'; ctx.fillRect(36, 30, 1128, canvas.height - 60); ctx.fillStyle = '#493d31'; ctx.font = font; wrapped.forEach((line, i) => ctx.fillText(line, 80, 90 + i * 44)); return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('이미지를 만들지 못했어요.')), 'image/png')); }
let preparedResultUrl;
if (typeof addEventListener === 'function')
    addEventListener('pagehide', () => { if (preparedResultUrl)
        URL.revokeObjectURL(preparedResultUrl); });
function saveBlob(blob, name) { if (preparedResultUrl)
    URL.revokeObjectURL(preparedResultUrl); const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; preparedResultUrl = url; const status = document.getElementById('result-download-status'); a.id = 'prepared-result-file'; a.textContent = name + ' · 파일 저장'; a.className = 'secondary'; if (status) {
    document.getElementById('prepared-result-file')?.remove();
    status.after(a);
}
else
    document.body.append(a); a.click(); }
/** Wrong answers remain visible even when there is insufficient evidence to judge a skill. */
export function reviewRecommendationsHtml(report) {
    const groups = new Map();
    for (const wrong of report.wrong) {
        const id = wrong.question.learningObjective.id;
        groups.set(id, [...(groups.get(id) ?? []), wrong]);
    }
    const card = (item, index) => { const q = item.question; return '<article class="review-question"><h5>문제 ' + (index + 1) + ' · 틀린 횟수 ' + item.count + '회</h5>' + (q.restricted ? '<p>비공개 교실 자료예요. 원문은 선생님과 확인해 주세요.</p>' : (q.passage ? '<p class="analytics-prompt">' + esc(q.passage) + '</p>' : '') + '<p class="analytics-prompt">' + renderQuestionText(q.question) + '</p>' + renderDiagram(q.diagram) + (q.choices?.length ? '<ol class="review-choices">' + q.choices.map(choice => '<li>' + renderQuestionText(choice) + '</li>').join('') + '</ol>' : '')) + '<p><strong>내가 제출한 답:</strong> ' + item.answers.map(answer => '<code>' + esc(answer) + '</code>').join(' / ') + '</p><p class="review-answer"><strong>정답:</strong> ' + renderQuestionText(q.answer) + '</p><div class="review-explanation"><strong>해설</strong><p>' + renderQuestionText(q.explanation) + '</p></div><p class="review-progress">복습 성공 ' + item.reviewSuccess + '회 · 쌍둥이 복습 ' + (item.twinSuccess ? '성공 ' + item.twinSuccess + '회' : '아직 성공 기록 없음') + '</p>' + (item.omittedAnswers ? '<p>이 문제의 앞선 ' + item.omittedAnswers + '개 입력은 생략하고 최근 20개를 표시해요. 틀린 횟수는 모두 포함해요.</p>' : '') + '</article>'; };
    return '<section class="review-recommendations" aria-labelledby="review-heading"><h3 id="review-heading">다시 학습하면 좋은 내용</h3><p>' + (!report.total.attempted ? '학습 기록이 더 필요해요. 음식 만들기로 도전해 보세요.' : report.wrong.length ? '틀렸던 문제 ' + report.wrong.length + '개를 영역별로 모았어요. 내 답과 정답·해설을 바로 확인해 보세요.' : '이번 기록에는 틀린 문제가 없어요.') + '</p><div id="wrong-problems">' + [...groups].map(([id, items]) => { const objective = report.objectives.find(o => o.id === id); return '<section class="review-objective"><h4>' + esc(items[0].question.learningObjective.label) + '</h4><p>' + items.length + '문제 · 오답 ' + items.reduce((n, item) => n + item.count, 0) + '회' + (objective && objective.first.attempted >= 5 ? ' · ' + esc(objective.feedback) : ' · 아직 영역 수준을 단정하지 않아요.') + '</p>' + items.map(card).join('') + '</section>'; }).join('') + '</div></section>';
}
export function mountCafeResults(game, analytics) {
    const target = document.getElementById('results');
    mountManagementResult(game, target);
    if (target.querySelector('#learning-report'))
        return;
    const cafe = cafeResultData(game), report = analytics.report(), total = { attempted: game.stats.attempted, correct: game.stats.correct }, review = { attempted: report.byType.remediation.attempted + report.byType.twin.attempted, correct: report.byType.remediation.correct + report.byType.twin.correct };
    const section = document.createElement('section');
    section.id = 'learning-report';
    section.setAttribute('aria-label', '카페 성장과 나의 학습 결과');
    if (game.mode === 'CLASS_MATCH')
        target.querySelector('.result-grid')?.remove();
    section.innerHTML = (cafe.events ? '<h3>이벤트 성과</h3><p>발생 ' + cafe.events.occurred + '회 · 긴급 미션 성공 ' + cafe.events.missionSuccess + ' / 실패 ' + cafe.events.missionFailed + ' / 종료 취소 ' + cafe.events.missionCancelled + '</p><p>미션 성공률 ' + (cafe.events.missionSuccess + cafe.events.missionFailed ? Math.round(cafe.events.missionSuccess / (cafe.events.missionSuccess + cafe.events.missionFailed) * 100) + '%' : '미참여') + ' · 학습 정답률과 별도 집계</p><p>특별 손님 선물 ' + cafe.events.specialReward + '원 상당 · 총 현금 보상 ' + cafe.events.cashReward + '원</p><p>가장 큰 보상: ' + esc(cafe.events.best?.name ?? '없음') + ' ' + (cafe.events.best?.value ?? 0) + '원 상당</p>' : '') + '<h3>카페 성장 결과</h3><p>' + esc(cafe.cafeName) + ' · ' + cafe.cafeLevel + '단계</p><div class="analytics-grid"><div>총매출<strong>' + num(cafe.revenue) + '원</strong></div><div>보유금<strong>' + num(cafe.money) + '원</strong></div><div>손님<strong>' + cafe.customers + '명</strong></div><div>판매 음식<strong>' + cafe.soldFood + '개</strong></div></div><details><summary>직원 ' + cafe.staff.length + '명 · 메뉴 ' + cafe.menus.length + '종 강화 현황</summary><p>' + esc(cafe.staff.map(w => w.name + ' Lv.' + w.level).join(' · ') || '직원 고용 없음') + '</p><p>' + esc(cafe.menus.map(m => m.name + ' ★' + m.level).join(' · ')) + '</p></details>' + (cafe.run ? '<details><summary>오늘의 카페 조합 · 특성 ' + cafe.run.traits.length + '/4</summary><p>시작 콘셉트: ' + esc(cafe.run.concept) + '</p><p>선택한 조합: ' + esc(cafe.run.traits.join(' + ') || '선택 없음') + '</p><p>감사 파티 주문: 배정 ' + (cafe.run.finalAssigned ?? '미기록') + ' · 결제 ' + cafe.run.finalPaid + ' · 완료 보상 ' + (cafe.run.finalRewarded ? '받음' : '받지 않음') + '</p></details>' : '') + '<h3>나의 학습 결과</h3><p>' + esc(report.packName || report.questionPackId) + '</p><div class="analytics-grid"><div>전체 풀이<strong>' + total.attempted + '문항</strong></div><div>정답 / 오답<strong>' + total.correct + ' / ' + (total.attempted - total.correct) + '</strong></div>' + rateRow('전체 정답률', total) + rateRow('최초 출제 정답률', report.byType.first) + '</div><details><summary>최초·반복·복습 구분 보기</summary><div class="analytics-grid">' + rateRow('최초 출제', report.byType.first) + rateRow('일반 반복', report.byType.repeat) + rateRow('오답 복습', report.byType.remediation) + rateRow('쌍둥이', report.byType.twin) + '</div><p>오답 복습·쌍둥이 합계 ' + percentage(review) + ' · 복습 성공 ' + report.remediationOutcome.success + '회</p><p>최초 결과는 복습에 성공해도 바뀌지 않아요.</p></details>' + (total.attempted !== report.total.attempted ? '<p class="analytics-note">전체 풀이에는 이전 기기 기록이 포함돼요. 상세 분석은 이 기기에 남은 ' + report.total.attempted + '문항 기준이에요.</p>' : '') + reviewRecommendationsHtml(report) + '<details><summary>학습 요소별 기록 ' + report.objectives.length + '개 영역</summary>' + report.objectives.map(o => '<article><strong>' + esc(o.label) + '</strong><p>풀이 ' + o.total.attempted + ' · 정답 ' + o.total.correct + ' · 오답 ' + (o.total.attempted - o.total.correct) + ' · ' + percentage(o.total) + '</p><p>' + esc(o.feedback) + ' <small>(최초 ' + o.first.attempted + '문항 기준)</small></p></article>').join('') + '</details>' + (report.detailLimitReached ? '<p>제출 ' + report.total.attempted + '회 집계는 보존했어요. 상세 이벤트는 처음 10,000회까지 보관해요.</p>' : '') + '<h3>결과표 다운로드</h3><div class="analytics-actions"><button id="download-result" class="primary">결과표 다운로드 (PNG)</button><button id="print-result" class="secondary">인쇄 / PDF 저장</button><button id="download-analytics" class="secondary">요약 JSON 저장</button></div><p id="result-download-status" role="status"></p><small>이름 입력 없이 이 브라우저에서 만들어요. 다운로드에는 원문·입력 답안 상세를 넣지 않아요.</small>';
    const restart = target.querySelector('#restart,#growth-next');
    if (restart)
        restart.before(section);
    else
        target.append(section);
    mountTwinWorksheet(section, analytics, target);
    if (report.spacedReview) {
        const b = document.createElement('section');
        b.className = 'review-results';
        b.innerHTML = '<h3>복습·숙달 기록</h3>' + resultLines(cafe, report, total).filter(l => /^(최초 도전|개념 복습|숙달 확인|숙달 학습|추가 복습|미완료 복습|간격 조정)/.test(l)).map(l => '<p>' + esc(l) + '</p>').join('');
        section.querySelector('h3')?.before(b);
    }
    const lines = resultLines(cafe, report, total), status = section.querySelector('#result-download-status');
    const download = section.querySelector('#download-result');
    download.onclick = async () => { download.disabled = true; try {
        saveBlob(await resultPng(lines), 'cafe-learning-result.png');
        status.textContent = '결과표 파일을 준비했어요. 다운로드가 시작되지 않으면 아래 파일 저장 링크를 눌러 주세요.';
    }
    catch (e) {
        status.textContent = e instanceof Error ? e.message : '저장하지 못했어요. 인쇄/PDF 저장을 사용해 주세요.';
    }
    finally {
        download.disabled = false;
    } };
    section.querySelector('#download-analytics').onclick = () => saveBlob(new Blob([JSON.stringify({ schemaVersion: 1, cafe, learning: analytics.exportSummary(), confirmedTotal: total }, null, 2)], { type: 'application/json' }), 'cafe-learning-summary.json');
    section.querySelector('#print-result').onclick = () => { const w = window.open('', '_blank'); if (!w) {
        status.textContent = '팝업을 허용하거나 PNG 다운로드를 사용해 주세요.';
        return;
    } w.document.write('<!doctype html><html lang="ko"><meta charset="utf-8"><title>카페 학습 결과표</title><style>@page{size:A4;margin:14mm}body{font:12px/1.5 "Malgun Gothic",sans-serif;color:#302a22}h1{font-size:22px}p{margin:5px 0;break-inside:avoid}button{padding:12px}@media print{button{display:none}}</style><h1>오늘의 카페 결과표</h1><button onclick="window.print()">인쇄 / PDF 저장</button>' + lines.slice(1).map(l => '<p>' + esc(l) + '</p>').join('') + '</html>'); w.document.close(); };
}
