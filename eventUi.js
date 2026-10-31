import { eventBalance } from './eventConfig.js';
import { escapeText as esc } from './questionRenderer.js';
import { missionGoal, noticeTone } from './eventPresentation.js';
let previous = '', previousGame = null, collapsed = false;
export function renderEventPanel(game, problemOpen) {
    if (previousGame !== game) {
        previousGame = game;
        previous = '';
        collapsed = false;
    }
    let panel = document.getElementById('event-panel');
    if (!panel) {
        panel = document.createElement('aside');
        panel.id = 'event-panel';
        panel.setAttribute('aria-label', '카페 이벤트');
        document.querySelector('.lesson-card')?.append(panel);
        panel.addEventListener('click', e => { if (!e.target.closest('#mission-fold'))
            return; collapsed = !collapsed; previous = ''; if (previousGame)
            renderEventPanel(previousGame, document.body.classList.contains('event-reading')); });
    }
    const a = game.events.active, m = game.events.mission, s = game.events, seconds = a ? Math.max(0, Math.ceil(a.deadline - s.now)) : 0, notice = s.notice.until > s.now ? s.notice.text : '', warning = !!a && seconds <= eventBalance.warningSeconds;
    panel.hidden = game.status !== 'RUNNING' || !s.enabled || (!a && !notice);
    document.body.classList.toggle('event-reading', problemOpen);
    const room = document.getElementById('cafe-room');
    room?.setAttribute('data-event-effect', m?.effect ?? 'none');
    let cue = document.getElementById('room-event-cue');
    if (!cue && room) {
        cue = document.createElement('div');
        cue.id = 'room-event-cue';
        cue.setAttribute('aria-hidden', 'true');
        cue.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
        room.append(cue);
    }
    if (cue) {
        cue.dataset.effect = m?.effect ?? (notice && noticeTone(notice) === 'success' ? 'cheer' : 'none');
        cue.hidden = game.status !== 'RUNNING' || problemOpen || document.hidden;
    }
    document.getElementById('event-banner')?.remove();
    const key = JSON.stringify([a?.eventId, a?.correct, a?.served, a?.streak, seconds, warning, notice, collapsed, problemOpen]);
    if (key === previous && (!problemOpen || document.getElementById('mission-compact')))
        return;
    previous = key;
    const goal = a && m ? missionGoal(a, m) : '';
    panel.dataset.tone = noticeTone(notice);
    panel.classList.toggle('mission-warning', warning);
    panel.dataset.active = String(!!a);
    panel.innerHTML = a && m ? '<div class="mission-heading"><strong>' + esc(m.name) + '</strong><b class="mission-time" aria-label="남은 ' + seconds + '초">' + seconds + '초' + (warning ? ' · 곧 종료' : '') + '</b><button id="mission-fold" aria-label="미션 보상 안내 ' + (collapsed ? '펼치기' : '접기') + '" aria-expanded="' + !collapsed + '">' + (collapsed ? '+' : '−') + '</button></div><p class="mission-goals">' + esc(goal) + '</p><small' + (collapsed ? ' hidden' : '') + '>성공 시 최대 ' + s.rewardPreview(m.cash) + '원' + (m.id === 'sns' || m.id === 'team' ? ' + 잠시 홍보' : '') + ' · 실패 벌금 없음</small>' : '';
    if (notice)
        panel.insertAdjacentHTML('beforeend', '<p class="event-notice" role="status">' + esc(notice) + '</p>');
    let compact = document.getElementById('mission-compact');
    if (problemOpen) {
        if (!compact) {
            compact = document.createElement('div');
            compact.id = 'mission-compact';
            compact.className = 'mission-compact';
        }
        compact.classList.toggle('mission-warning', warning);
        compact.innerHTML = a && m ? '<b>' + esc(m.name) + '</b><span class="mission-time">' + seconds + '초</span><span class="compact-goal">' + esc(goal) + '</span>' : notice ? esc(notice) : '';
        compact.hidden = !a && !notice;
        const question = document.getElementById('problem-panel');
        if (question && !question.contains(compact))
            question.querySelector('.problem-head')?.after(compact);
    }
    else
        compact?.remove();
    panel.setAttribute('aria-live', warning ? 'polite' : 'off');
}
