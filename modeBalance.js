import { growthEconomyConfig } from './growthEconomyConfig.js';
import { longGrowthLevels } from './longGrowthConfig.js';
import { balance, cafeLevels, warehouseLevels, staffBalance } from './config.js';
import { phase4Balance } from './phase4Config.js';
// CLASS_MATCH references the approved data without changing any values.
export const classMatchBalance = { cafes: cafeLevels, warehouses: warehouseLevels, staff: staffBalance, menuMultipliers: balance.menuMultipliers, menuUpgradeMultipliers: balance.menuUpgradeCostMultipliers, special: phase4Balance, initial: { cafeLevel: 1, money: 0, warehouseLevel: 1 } };
// Independent v1 growth costs. Shared capacity, art, menus and service mechanics.
const growthCafes = [...cafeLevels, ...longGrowthLevels.map(c => ({ ...structuredClone(cafeLevels[5]), level: c.level, name: c.name, maxCustomers: c.capacity, theme: c.level >= 11 ? 'loft-bakery' : 'garden' }))];
export const cafeGrowthBalance = { cafes: growthCafes.map((c, i) => ({ ...structuredClone(c), expansionCost: growthEconomyConfig.expansion[i] })), warehouses: warehouseLevels.map(w => ({ ...w, cost: w.cost * 2 })), staff: { ...structuredClone(staffBalance), limits: [...staffBalance.limits, 5, 5, 5, 5, 5, 5, 5, 5, 5], hireCosts: staffBalance.hireCosts.map(n => n * 2), upgradeCosts: staffBalance.upgradeCosts.map(n => n * 2) }, menuMultipliers: [...balance.menuMultipliers], menuUpgradeMultipliers: balance.menuUpgradeCostMultipliers.map(n => n * 2), special: { ...structuredClone(phase4Balance), itemPriceMultipliers: [1, 2, 4, 7, 11, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34] }, initial: { cafeLevel: 1, money: 0, warehouseLevel: 1 } };
