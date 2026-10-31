export function motionFrame(elapsed, id, reduced = false) { return reduced ? 0 : Math.floor((Math.max(0, elapsed) + (id % 4) * .09) / .7) % 2; }
export function recentEventReaction(events) {
    if (!events)
        return null;
    for (let i = events.records.length - 1; i >= 0; i--) {
        const r = events.records[i];
        if (r.kind === 'mission' && r.resolvedAt !== undefined && events.now - r.resolvedAt >= 0 && events.now - r.resolvedAt < 1.8)
            return r.outcome === 'success' ? 'REACT_HAPPY' : r.outcome === 'failed' ? 'REACT_SAD' : null;
    }
    return null;
}
export function bubbleCorrection(bubble, room, padding = 4) { return { x: bubble.left < room.left + padding ? room.left + padding - bubble.left : bubble.right > room.right - padding ? room.right - padding - bubble.right : 0, y: bubble.top < room.top + padding ? room.top + padding - bubble.top : bubble.bottom > room.bottom - padding ? room.bottom - padding - bubble.bottom : 0 }; }
