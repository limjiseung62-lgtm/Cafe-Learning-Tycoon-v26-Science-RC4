import { customerPoolForLevel } from './customerPools.js';
export const cafeLevels = [
    { level: 1, name: '포근한 골목 카페', maxCustomers: 3, expansionCost: 0, theme: 'alley', order: { minQuantity: 1, maxQuantity: 2, maxTypes: 2 }, customerPool: customerPoolForLevel(1) },
    { level: 2, name: '햇살 동네 카페', maxCustomers: 4, expansionCost: 3000, theme: 'sunny', order: { minQuantity: 1, maxQuantity: 3, maxTypes: 2 }, customerPool: customerPoolForLevel(2) },
    { level: 3, name: '인기 디저트 카페', maxCustomers: 5, expansionCost: 8000, theme: 'dessert', order: { minQuantity: 2, maxQuantity: 4, maxTypes: 3 }, customerPool: customerPoolForLevel(3) },
    { level: 4, name: '대형 베이커리 카페', maxCustomers: 6, expansionCost: 22000, theme: 'bakery', order: { minQuantity: 2, maxQuantity: 5, maxTypes: 3 }, customerPool: customerPoolForLevel(4) },
    { level: 5, name: '프리미엄 가든 카페', maxCustomers: 7, expansionCost: 50000, theme: 'garden', order: { minQuantity: 3, maxQuantity: 6, maxTypes: 4 }, customerPool: customerPoolForLevel(5) },
    { level: 6, name: '드림 카페', maxCustomers: 8, expansionCost: 110000, theme: 'dream', order: { minQuantity: 3, maxQuantity: 8, maxTypes: 4 }, customerPool: customerPoolForLevel(6) }
];
export const warehouseLevels = [{ capacity: 5, cost: 0 }, { capacity: 8, cost: 1500 }, { capacity: 12, cost: 4000 }, { capacity: 16, cost: 9000 }, { capacity: 20, cost: 18000 }, { capacity: 25, cost: 30000 }];
export const balance = {
    cafe: cafeLevels[0], stock: { initial: 0, capacity: 5, newMenuInitial: 0 }, productionPerCorrect: 1,
    time: { defaultSeconds: 600, maxSeconds: 3600, presets: [300, 600, 900, 1200, 1800, 2400, 3600] },
    customer: { spawnSeconds: 4, entering: 1, moving: 2, ordering: 1.5, preparing: 1, serving: 2, eating: 5, paying: 1, leaving: 2 },
    order: cafeLevels[0].order, menuMultipliers: [1, 1.25, 1.55, 1.9, 2.3],
    menuUpgradeCostMultipliers: [4, 10, 30, 80], telemetry: { snapshotSeconds: 300 },
    future: { staffCosts: [2000, 7000, 15000, 30000, 50000] }
};
export const staffBalance = { hireCosts: [2000, 7000, 15000, 30000, 50000], limits: [1, 2, 2, 3, 4, 5], upgradeCosts: [1200, 4000, 12000, 30000], claimSeconds: .3, pickupSeconds: .5, levels: [{ moveSpeed: 22, carryCapacity: 1, serveSpeed: 1 }, { moveSpeed: 28, carryCapacity: 1, serveSpeed: 1 }, { moveSpeed: 28, carryCapacity: 2, serveSpeed: 1 }, { moveSpeed: 35, carryCapacity: 2, serveSpeed: 1.5 }, { moveSpeed: 42, carryCapacity: 3, serveSpeed: 2 }] };
