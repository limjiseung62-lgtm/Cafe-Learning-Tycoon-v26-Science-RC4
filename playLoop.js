export function productionReceipt(before, menus) { return menus.map(m => ({ menuId: m.menuId, name: m.name, quantity: Math.max(0, m.stock - (before.get(m.menuId) ?? m.stock)), stock: m.stock, maxStock: m.maxStock })); }
export function stockStatus(stock, capacity, demand = 0) { return stock === 0 ? '0' : stock >= capacity ? 'MAX' : stock < Math.max(2, demand) ? '부족' : '충분'; }
