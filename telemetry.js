export class LocalTelemetry {
    intervalSeconds;
    phase4 = { customersSpawned: 0, specialCustomersSpawned: 0, specialCustomersServed: 0, specialCustomerTypes: {}, vipVisits: 0, regularCustomerRevisits: 0, regularHighestTier: 0, itemPurchases: [], itemUsage: [], goldenOrdersCompleted: 0, boostedCorrectAnswers: 0, visits: [], payments: [] };
    staffHireTimes = [];
    staffUpgradePurchases = [];
    snapshots = [];
    upgradePurchases = [];
    cafeUpgradeTimes = [];
    constructor(intervalSeconds) {
        this.intervalSeconds = intervalSeconds;
        if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0)
            throw new Error('스냅샷 간격은 양수여야 합니다.');
    }
    record(snapshot) { this.snapshots.push(structuredClone(snapshot)); }
    export(final) { return structuredClone({ schemaVersion: 1, phase4: this.phase4, staffHireTimes: this.staffHireTimes, staffUpgradePurchases: this.staffUpgradePurchases, snapshotIntervalSeconds: this.intervalSeconds, snapshots: this.snapshots, upgradePurchases: this.upgradePurchases, cafeUpgradeTimes: this.cafeUpgradeTimes, final }); }
}
