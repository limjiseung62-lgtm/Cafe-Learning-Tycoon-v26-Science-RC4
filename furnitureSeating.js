/** Existing party arrivals prefer the same communal table; each guest keeps one ordinary order/payment. */
export function chooseFurnitureSeat(available, tables, partySeats) {
    const preferred = partySeats.map(i => tables[i]?.id).find(Boolean);
    if (preferred) {
        const same = available.find(i => tables[i]?.id === preferred);
        if (same !== undefined)
            return same;
    }
    const long = available.filter(i => tables[i]?.kind === 'long');
    if (!long.length)
        return available[0];
    const counts = new Map();
    for (const i of long)
        counts.set(tables[i].id, (counts.get(tables[i].id) ?? 0) + 1);
    return long.sort((a, b) => counts.get(tables[b].id) - counts.get(tables[a].id) || a - b)[0];
}
