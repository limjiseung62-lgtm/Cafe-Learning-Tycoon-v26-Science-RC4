/** CAFE_GROWTH only. Class-match and run economics remain in config.ts. */
export const growthEconomyConfig = {
    version: 1,
    // Early prices are deliberately revised only for persistent growth: source sale budgets are 10~40k per session.
    expansion: [0, 1500, 6500, 15000, 30000, 55000, 130000, 180000, 240000, 300000, 450000, 550000, 650000, 800000, 1000000],
    minimumSeconds: 900, minimumUnique: 8, minimumCorrect: 5,
    completionBase: 1000, completionPerLevel: 700,
    missionBase: 500, missionPerLevel: 100,
    reviewBase: 200, reviewPerLevel: 50, reviewLimit: 3,
    milestones: { 7: 10000, 11: 25000 }
};
