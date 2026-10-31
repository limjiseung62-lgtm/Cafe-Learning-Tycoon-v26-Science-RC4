import { spriteStyle, ensureVillageSceneStyle } from './villageSceneArt.js';
import { goalsHtml } from './progressiveGoals.js';
import { landmarkNames, districtVisitors } from './progressiveFinance.js';
import { openManagementAlbum } from './managementAlbumUi.js';
import { syncManagementAlbum } from './managementAlbum.js';
import { investmentReason, franchiseQuote } from './progressiveGuidance.js';
import { investmentTierLimit, investmentCatalog, progressiveEconomyConfig as config, investVillage, foundFranchise, upgradeFranchise, branchYield, branchUpgradeCost, branchRequirement, buildLandmark, progressiveTownName } from './progressiveEconomy.js';
import { ensureGrowthWriteLock } from './growthWriteLock.js';
import { unlocked } from './progressiveFeatures.js';
export async function openProgressiveHub(repo, onClose) {
    if (!await ensureGrowthWriteLock())
        return;
    ensureVillageSceneStyle();
    const read = repo.read();
    if (read.status !== 'ready' || !read.save.v26)
        return;
    let base = read.save, message = '';
    const dialog = document.createElement('section');
    dialog.className = 'mode-confirm progressive-hub';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-label', '마을 투자와 자동 운영 지점');
    document.body.append(dialog);
    const edit = (change) => { const next = structuredClone(base); if (!change(next)) {
        message = '조건과 보유금을 확인해 주세요.';
        paint();
        return;
    } syncManagementAlbum(next); const write = repo.write(next, base); message = write.ok ? '저장했어요. 다음 영업부터 반영돼요.' : write.message; if (write.ok)
        base = next; paint(); };
    function paint() {
        const v = base.v26;
        dialog.innerHTML = '<div><button data-close>닫기 · 내 카페로</button><h2>' + progressiveTownName(base) + '</h2><p>보유금 ' + base.money.toLocaleString() + '원 · 마을 ' + (base.village?.progression?.stage ?? 1) + '단계</p>' + goalsHtml(base) + '<button data-album>성장 앨범 보기</button><p>여러 분야에 투자할 수 있어요. 처음에는 2단계 이상 투자한 선두 분야가 대표가 돼요. 다른 분야가 현재 대표보다 2단계 앞서면 바뀌어요.</p><div class="progressive-grid">' + investmentCatalog.map(c => { const level = v.investments[c.id], cost = config.investmentCosts[level]; return '<article><h3>' + c.name + ' 투자 ' + level + '/5</h3><p>' + c.visual + '</p><p>' + c.effect + ' · 투자 단계가 높을수록 해당 손님을 더 자주 만나요</p><p>' + investmentReason(base, c.id) + '</p><button data-invest="' + c.id + '" ' + (!unlocked(base, 'investment') || cost === undefined || level >= investmentTierLimit(v.maxLevel) || base.money < cost ? 'disabled' : '') + '>' + (cost === undefined ? '완성' : cost.toLocaleString() + '원 투자') + '</button></article>'; }).join('') + '</div>' + (unlocked(base, 'franchise') ? '<h3>자동 운영 지점</h3><p>본점만 직접 운영해요. 새 가격의 회수 계획과 이 카페의 투자·정산 기록을 나눠 보여줘요. 이전 버전의 과거 수익은 알 수 없어 기록에서 제외해요. 지점 수익은 본점 15분 완주·서로 다른 문제 8개·정답 5개를 채운 영업에서 한 번 정산해요. 접속하지 않은 시간에는 지급하지 않아요.</p><div class="progressive-grid">' + [2, 3, 4].map(id => { const b = v.branches.find(b => b.id === id), cost = b ? branchUpgradeCost(id, b.level) : config.branchCosts[id - 2]; return '<article><span class="branch-exterior" aria-hidden="true" style="display:block;position:relative;height:140px;overflow:hidden"><span style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);' + spriteStyle({ commerce: 2, tourism: 8, culture: 4, housing: 5 }[b?.region ?? 'commerce'], b ? 150 + b.level * 12 : 150) + '"></span>' + (b ? Array.from({ length: Math.min(3, b.level - 1) }, (_, i) => '<span style="position:absolute;left:' + (8 + i * 30) + '%;bottom:0;' + spriteStyle([1, 4, 6][i], 45, true) + '"></span>').join('') : '') + '</span><img width="160" loading="lazy" src="assets/web/art/room-' + (b ? Math.min(6, b.level + 1) : 2) + '.webp" alt="' + id + '호점 내부"><h3>' + id + '호점 ' + (b ? 'Lv.' + b.level + ' · ' + ['작은 가게', '새 간판', '확장 홀', '지역 명소', '대표 지점'][b.level - 1] : '창업 준비') + '</h3><p>' + (b ? districtVisitors[b.region] + ' · ' + (b.level >= 2 ? '가끔 작은 상권 행사도 열려요' : '강화하면 상권 행사가 열려요') : '어떤 상권에서 운영할지 골라요') + '</p>' + (b ? '<p>자격 영업당 ' + branchYield(v, b).toLocaleString() + '원 · ' + investmentCatalog.find(c => c.id === b.region).name + ' 상권</p><p>지금 가격의 투자 회수 약 ' + franchiseQuote(base, id).capitalSessions + '회 자격 영업</p><details><summary>투자와 수익 자세히</summary><p>새 가격 기준 시설비 ' + franchiseQuote(base, id).capital.toLocaleString() + '원 · 현재 수익 기준 회수 ' + franchiseQuote(base, id).capitalSessions + '회 자격 영업</p><p>이 카페의 투자 기록 ' + franchiseQuote(base, id).recordedCapital.toLocaleString() + '원' + (franchiseQuote(base, id).estimated ? ' (이전 가격 추정 · 과거 수익 미포함)' : '') + ' · RC2 누적 정산 ' + franchiseQuote(base, id).earned.toLocaleString() + '원 · RC2 이후 관측 순수익 (과거 수익 제외) ' + franchiseQuote(base, id).net.toLocaleString() + '원 · 관측 회수까지 약 ' + franchiseQuote(base, id).remainingSessions + '회</p></details><p>' + (cost === null ? '최고 단계에 도달했어요.' : '다음 확장 수익 +' + franchiseQuote(base, id).upgradeGain.toLocaleString() + '원 · 확장비 회수 ' + franchiseQuote(base, id).upgradeSessions + '회') + '</p>' : '<p>본점 Lv.' + (id === 2 ? 14 : 15) + ' · 마을 ' + (id + 1) + '단계' + (id > 2 ? ' · 이전 지점 · 투자 합계 ' + (id === 3 ? 8 : 12) : '') + '</p><label>상권<select data-region="' + id + '">' + investmentCatalog.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('') + '</select></label>') + '<button data-branch="' + id + '" ' + (cost === null || base.money < (cost ?? 0) || !b && !branchRequirement(base, id) ? 'disabled' : '') + '>' + (cost === null ? '최고 단계' : (b ? '확장 ' : '창업 ') + cost.toLocaleString() + '원') + '</button></article>'; }).join('') + '</div>' : '<p>다음 큰 목표: 본점 Lv.14 · 마을 3단계에서 자동 운영 2호점을 준비해요.</p>') + (unlocked(base, 'landmark') ? '<h3>마을 랜드마크 ' + v.landmark + '/6</h3><p>마을 4단계부터 건설할 수 있어요.</p><p>' + (landmarkNames[v.landmark] ?? '모든 기념 시설 완성') + '</p><button data-landmark ' + ((base.village?.progression?.stage ?? 1) < 4 || config.landmarkCosts[v.landmark] === undefined || base.money < (config.landmarkCosts[v.landmark] ?? 0) ? 'disabled' : '') + '>' + (config.landmarkCosts[v.landmark] === undefined ? '완성' : config.landmarkCosts[v.landmark].toLocaleString() + '원 건설') + '</button>' : '') + '<p role="status">' + message + '</p></div>';
        dialog.querySelector('[data-close]').addEventListener('click', () => { dialog.remove(); onClose(); });
        dialog.querySelectorAll('[data-invest]').forEach(b => b.onclick = () => edit(s => investVillage(s, b.dataset.invest)));
        dialog.querySelectorAll('[data-branch]').forEach(b => b.onclick = () => { const id = Number(b.dataset.branch), region = dialog.querySelector('[data-region="' + id + '"]')?.value; edit(s => v.branches.some(x => x.id === id) ? upgradeFranchise(s, id) : foundFranchise(s, id, region)); });
        dialog.querySelector('[data-album]')?.addEventListener('click', () => openManagementAlbum(base));
        dialog.querySelector('[data-landmark]')?.addEventListener('click', () => edit(buildLandmark));
    }
    paint();
}
