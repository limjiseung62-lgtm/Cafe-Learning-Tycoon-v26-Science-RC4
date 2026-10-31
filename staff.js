import { staffBalance } from './config.js';
export const staffDefinitions = [{ staffId: 'staff-1', name: '봄이', visualKey: 'spring' }, { staffId: 'staff-2', name: '준이', visualKey: 'jun' }, { staffId: 'staff-3', name: '하루', visualKey: 'haru' }, { staffId: 'staff-4', name: '루나', visualKey: 'luna' }, { staffId: 'staff-5', name: '도담', visualKey: 'dodam' }];
export const staffVisuals = { owner: { face: '🧑‍🍳', apron: '#795f42', accessory: '☕' }, spring: { face: '👩', apron: '#d4898f', accessory: '🌸' }, jun: { face: '👨‍🦱', apron: '#7d9cc1', accessory: '🎧' }, haru: { face: '👩‍🦰', apron: '#9aaf70', accessory: '🌿' }, luna: { face: '👩‍🦳', apron: '#ac8dbb', accessory: '⭐' }, dodam: { face: '👨‍🦲', apron: '#d8a562', accessory: '🎀' } };
export class StaffSystem {
    movement = null;
    pickupFlow = { sharedPickup: false, chainOrders: false };
    pickupClaims = new Map();
    pickupFor(w) { if (!this.movement)
        return this.pickup; const own = this.pickupClaims.get(w.staffId); if (own !== undefined)
        return this.movement.pickups[own]; const fallback = this.workers.indexOf(w); if (!this.pickupFlow.sharedPickup)
        return this.movement.pickups[fallback]; const occupied = new Set([...this.pickupClaims].filter(([id]) => id !== w.staffId).map(([, i]) => i)), target = w.orderId === null ? this.pickup : this.seats[this.currentOrders.get(w.orderId)?.seat ?? -1] ?? this.pickup; let best = fallback, cost = Infinity; for (let i = 0; i < this.movement.pickups.length; i++) {
        if (occupied.has(i))
            continue;
        const p = this.movement.pickups[i], d = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3), c = d(w.position, p) + d(p, { x: target.x, y: target.y + 5 });
        if (c < cost) {
            best = i;
            cost = c;
        }
    } this.pickupClaims.set(w.staffId, best); return this.movement.pickups[best]; }
    currentOrders = new Map();
    routes = new Map();
    configureMovement(movement, orderSeats) { this.movement = movement; this.routes.clear(); this.pickupClaims.clear(); for (const w of this.workers) {
        const i = this.workers.indexOf(w), seat = w.orderId === null ? undefined : this.seats[orderSeats.get(w.orderId) ?? -1];
        w.position = w.state === 'SERVING' && seat ? { x: seat.x, y: seat.y + 5 } : ['MOVING_TO_TABLE', 'PICKING_UP'].includes(w.state) ? { ...movement.pickups[i] } : { ...movement.homes[i] };
    } }
    // Headless balance simulations retain their automatic driver. Interactive play opts in.
    manualOwner = false;
    claimOwner(order) { const w = this.workers[0]; if (!this.manualOwner || this.paid.length || w.state !== 'IDLE' || !order.ready || !order.active || this.workers.some(worker => worker.orderId === order.id))
        return false; w.orderId = order.id; w.remaining = [...order.items]; this.change(w, 'CLAIMING_ORDER'); return true; }
    workers = [this.create('owner', '사장님', 'owner', true)];
    pickup = { x: 78, y: 30 };
    seats = [];
    completedByOwner = 0;
    completedByStaff = 0;
    totalOrderWait = 0;
    completedOrders = 0;
    create(staffId, name, visualKey, owner = false) { return { staffId, name, visualKey, owner, level: 1, ...staffBalance.levels[0], state: 'IDLE', position: { x: 78, y: 22 }, orderId: null, cargo: [], remaining: [], elapsed: 0, idleTime: 0, busyTime: 0, upgradeFeedbackUntil: 0 }; }
    get paid() { return this.workers.filter(w => !w.owner); }
    claimDuration;
    hire(definition) { const d = definition ?? staffDefinitions[this.paid.length]; if (!d || this.paid.some(w => w.staffId === d.staffId) || this.paid.length >= 5)
        return null; const w = this.create(d.staffId, d.name, d.visualKey); w.position = this.movement ? { ...this.movement.homes[this.workers.length] } : { x: 14 + this.paid.length * 12, y: 22 }; this.workers.push(w); return w; }
    upgrade(w, now) { w.level++; Object.assign(w, staffBalance.levels[w.level - 1]); w.upgradeFeedbackUntil = now + 3; }
    setLayout(pickup, seats) { this.pickup = { ...pickup }; this.seats = seats.map(p => ({ ...p })); }
    change(w, state) { if (!['MOVING_TO_PICKUP', 'PICKING_UP'].includes(state))
        this.pickupClaims.delete(w.staffId); w.state = state; w.elapsed = 0; this.routes.delete(w.staffId); }
    release(w) { w.orderId = null; w.cargo = []; w.remaining = []; this.change(w, 'RETURNING'); }
    move(w, to, dt) {
        if (this.movement) {
            const key = to.x + ',' + to.y;
            let route = this.routes.get(w.staffId);
            if (!route || route.target !== key) {
                route = { target: key, points: this.movement.route(w.position, to), index: 1 };
                this.routes.set(w.staffId, route);
            }
            if (route.points.length < 2 && Math.hypot(to.x - w.position.x, to.y - w.position.y) > .001) {
                this.routes.delete(w.staffId);
                return false;
            }
            const others = this.workers.filter(other => other !== w).map(other => other.position);
            const blocked = (next) => others.some(p => { const dx = next.x - w.position.x, dy = (next.y - w.position.y) * 2 / 3, px = p.x - w.position.x, py = (p.y - w.position.y) * 2 / 3, den = dx * dx + dy * dy, t = den ? Math.max(0, Math.min(1, (px * dx + py * dy) / den)) : 0; return Math.hypot(px - dx * t, py - dy * t) < 4 - 1e-8 && (Math.hypot(px, py) >= 4 - 1e-8 || Math.hypot(next.x - p.x, (next.y - p.y) * 2 / 3) < Math.hypot(px, py)); });
            let travel = w.moveSpeed * dt;
            while (route.index < route.points.length) {
                const p = route.points[route.index], dx = p.x - w.position.x, dy = p.y - w.position.y, distance = Math.hypot(dx, dy * 2 / 3) * this.movement.worldScale;
                const next = distance <= travel + 1e-9 ? p : { x: w.position.x + dx * travel / distance, y: w.position.y + dy * travel / distance };
                if (blocked(next)) {
                    try {
                        route = { target: key, points: this.movement.route(w.position, to, others), index: 1 };
                    }
                    catch {
                        route = { target: key, points: [{ ...w.position }], index: 1 };
                    }
                    this.routes.set(w.staffId, route);
                    return false;
                }
                if (distance <= travel + 1e-9) {
                    w.position = { ...p };
                    travel -= distance;
                    route.index++;
                }
                else {
                    w.position = { ...next };
                    return false;
                }
            }
            return true;
        }
        const dx = to.x - w.position.x, dy = to.y - w.position.y;
        const distance = Math.hypot(dx, dy);
        const travel = w.moveSpeed * dt;
        if (distance <= travel) {
            w.position = { ...to };
            return true;
        }
        w.position.x += dx / distance * travel;
        w.position.y += dy / distance * travel;
        return false;
    }
    tick(dt, orders, now, onComplete) {
        const active = new Map(orders.filter(o => o.active).map(o => [o.id, o]));
        this.currentOrders = active;
        // Claims are established synchronously; later workers cannot take the same order.
        const claimed = new Set(this.workers.map(w => w.orderId).filter((id) => id !== null));
        for (const w of this.workers) {
            if (w.orderId !== null && !active.has(w.orderId)) {
                claimed.delete(w.orderId);
                this.release(w);
            }
            if ((w.state === 'IDLE' || w.state === 'RETURNING' && this.pickupFlow.chainOrders) && !(w.owner && this.manualOwner && !this.paid.length)) {
                const order = orders.filter(o => o.ready && o.active && !claimed.has(o.id)).sort((a, b) => a.orderedAt - b.orderedAt || a.id - b.id)[0];
                if (order) {
                    w.orderId = order.id;
                    w.remaining = [...order.items];
                    claimed.add(order.id);
                    this.change(w, 'CLAIMING_ORDER');
                }
            }
            if (w.state === 'IDLE')
                w.idleTime += dt;
            else
                w.busyTime += dt;
            w.elapsed += dt;
            const order = w.orderId === null ? undefined : active.get(w.orderId);
            switch (w.state) {
                case 'IDLE': break;
                case 'CLAIMING_ORDER':
                    if (w.elapsed >= (this.claimDuration?.(w) ?? staffBalance.claimSeconds))
                        this.change(w, 'MOVING_TO_PICKUP');
                    break;
                case 'MOVING_TO_PICKUP':
                    if (this.move(w, this.pickupFor(w), dt))
                        this.change(w, 'PICKING_UP');
                    break;
                case 'PICKING_UP':
                    if (w.elapsed >= staffBalance.pickupSeconds) {
                        w.cargo = w.remaining.splice(0, w.carryCapacity);
                        this.change(w, 'MOVING_TO_TABLE');
                    }
                    break;
                case 'MOVING_TO_TABLE':
                    if (order && this.move(w, { x: (this.seats[order.seat]?.x ?? 50), y: (this.seats[order.seat]?.y ?? 60) + 5 }, dt))
                        this.change(w, 'SERVING');
                    break;
                case 'SERVING':
                    if (w.elapsed >= 1 / w.serveSpeed) {
                        w.cargo = [];
                        if (w.remaining.length)
                            this.change(w, 'MOVING_TO_PICKUP');
                        else if (order) {
                            this.completedOrders++;
                            this.totalOrderWait += Math.max(0, now - order.orderedAt);
                            if (w.owner)
                                this.completedByOwner++;
                            else
                                this.completedByStaff++;
                            onComplete(order.id, w);
                            if (!this.manualOwner)
                                claimed.delete(order.id);
                            this.release(w);
                        }
                    }
                    break;
                case 'RETURNING':
                    if (this.move(w, this.movement?.homes[this.workers.indexOf(w)] ?? (w.owner ? { x: 78, y: 22 } : { x: 14 + this.paid.indexOf(w) * 12, y: 22 }), dt))
                        this.change(w, 'IDLE');
                    break;
            }
        }
    }
}
