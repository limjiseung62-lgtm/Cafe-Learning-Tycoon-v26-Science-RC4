import { deploymentLocalStorage } from './deploymentStorage.js';
import { recentEventReaction } from './animationPresentation.js';
export function guestMotion(g, events) { if (g.miniReaction && events && events.now < g.miniReaction.until)
    return g.miniReaction.success ? 'REACT_HAPPY' : 'REACT_SAD'; if (g.state === 'EATING')
    return 'EAT'; if (g.state === 'PAYING')
    return 'REACT_HAPPY'; if (g.state === 'LEAVING')
    return g.abandoned && g.elapsed < .7 ? 'REACT_SAD' : g.elapsed < 2 ? 'WAVE' : 'WALK'; if (g.state === 'ENTERING' || g.state === 'MOVING_TO_SEAT')
    return 'WALK'; const reaction = recentEventReaction(events); if (reaction)
    return reaction; if (g.helperType === 'influencer')
    return 'CAMERA'; if (events?.active?.type === 'birthday' && g.eventArrival?.eventId === events.active.eventId)
    return 'REACT_HAPPY'; if (g.state === 'ORDERING' && g.eventArrival)
    return 'REACT_SURPRISED'; if (g.patienceRemaining < g.definition.patienceSeconds * .3)
    return 'REACT_WAIT'; return 'SIT'; }
export function workerMotion(w) { return w.state === 'IDLE' ? 'IDLE' : w.state === 'PICKING_UP' ? 'PICKUP' : w.state === 'MOVING_TO_TABLE' && w.cargo.length ? 'CARRY' : w.state === 'SERVING' ? 'SERVE' : w.state === 'RETURNING' ? 'RETURN' : 'WALK'; }
// Original vector motion accents: retain the exact identity/face/outfit of every existing bitmap.
export function motionArt() { return '<span class="motion-rig" aria-hidden="true"><svg class="eating-utensil" viewBox="0 0 40 60"><path d="M18 52 24 18" fill="none" stroke="#5e5145" stroke-width="5" stroke-linecap="round"/><ellipse cx="25" cy="12" rx="6" ry="10" fill="#eadcc5" stroke="#5e5145" stroke-width="2"/></svg><svg class="wave-hand" viewBox="0 0 42 56"><path d="M15 49 7 32Q4 26 8 24L15 30 12 10Q12 5 16 6L20 25 20 5Q22 1 25 5L25 25 29 8Q32 4 34 8L31 29 36 18Q40 15 40 20L35 40Q32 49 25 51Z" fill="#f3d6b3" stroke="#74543d" stroke-width="2" stroke-linejoin="round"/></svg><svg class="camera-rig" viewBox="0 0 40 55"><rect x="7" y="3" width="26" height="46" rx="5" fill="#70584f" stroke="#f8e5bc" stroke-width="3"/><rect x="12" y="10" width="16" height="26" rx="2" fill="#b4d3d2"/><circle cx="20" cy="42" r="3" fill="#f8e5bc"/></svg><span class="reaction-mark"></span></span>'; }
if (typeof document !== 'undefined') {
    const update = () => document.body.classList.toggle('motion-paused', document.hidden);
    document.addEventListener('visibilitychange', update);
    update();
    const low = () => { try {
        return deploymentLocalStorage.getItem('cafe-v15.reduce-motion') === 'true';
    }
    catch {
        return false;
    } };
    document.body.classList.toggle('motion-low', low());
    document.addEventListener('click', e => { if (!e.target.closest('#motion-toggle'))
        return; const on = document.body.classList.toggle('motion-low'); try {
        deploymentLocalStorage.setItem('cafe-v15.reduce-motion', String(on));
    }
    catch { } const button = document.getElementById('motion-toggle'); button?.setAttribute('aria-pressed', String(on)); if (button)
        button.textContent = on ? '움직임 줄이기 켜짐' : '움직임 줄이기'; });
    const button = document.createElement('button');
    button.id = 'motion-toggle';
    button.className = 'text-button motion-toggle';
    button.textContent = low() ? '움직임 줄이기 켜짐' : '움직임 줄이기';
    button.setAttribute('aria-pressed', String(low()));
    document.addEventListener('DOMContentLoaded', () => document.querySelector('.session-tools')?.append(button), { once: true });
    queueMicrotask(() => { if (!button.isConnected)
        document.querySelector('.session-tools')?.append(button); });
}
