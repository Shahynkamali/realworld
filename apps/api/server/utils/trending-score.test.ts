import { describe, expect, test } from 'bun:test';
import { calculateTrendingScore } from './trending-score';

describe('calculateTrendingScore', () => {
    const now = new Date('2025-01-01T12:00:00Z');

    test('returns 0 for zero engagement', () => {
        const createdAt = new Date('2025-01-01T00:00:00Z');
        expect(calculateTrendingScore(0, 0, createdAt, now)).toBe(0);
    });

    test('more engagement produces higher score', () => {
        const createdAt = new Date('2025-01-01T00:00:00Z');
        const low = calculateTrendingScore(1, 0, createdAt, now);
        const high = calculateTrendingScore(10, 5, createdAt, now);
        expect(high).toBeGreaterThan(low);
    });

    test('newer articles score higher than older ones', () => {
        const recent = new Date('2025-01-01T11:00:00Z');
        const old = new Date('2024-12-25T00:00:00Z');
        const recentScore = calculateTrendingScore(10, 2, recent, now);
        const oldScore = calculateTrendingScore(10, 2, old, now);
        expect(recentScore).toBeGreaterThan(oldScore);
    });

    test('favorites are weighted 3x views', () => {
        const createdAt = now; // same time, decay = 1
        const viewOnly = calculateTrendingScore(3, 0, createdAt, now);
        const favOnly = calculateTrendingScore(0, 1, createdAt, now);
        expect(viewOnly).toBe(favOnly);
    });
});
