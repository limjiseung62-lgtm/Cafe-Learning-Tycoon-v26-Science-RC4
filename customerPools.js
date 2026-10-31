// Shared content unlocks, independent of session clock/persistence rules.
export const customerPoolByLevel = [
    ['student', 'grandma', 'reader', 'walker', 'bookworm', 'athlete'],
    ['student', 'grandma', 'reader', 'walker', 'bookworm', 'athlete', 'gentleman', 'painter'],
    ['student', 'grandma', 'reader', 'walker', 'bookworm', 'athlete', 'gentleman', 'painter', 'traveler', 'child'],
    ['student', 'grandma', 'reader', 'walker', 'bookworm', 'athlete', 'gentleman', 'painter', 'traveler', 'child', 'office', 'fashion']
];
export function customerPoolForLevel(level) { return [...customerPoolByLevel[Math.min(customerPoolByLevel.length - 1, Math.max(0, level - 1))]]; }
