import { describe, test, expect } from 'bun:test';

// Unit tests for scoring logic (extracted for testability)
describe('trending score calculation', () => {
    const calculateScore = (
        recentViews: number,
        favorites: number,
        comments: number,
        ageMs: number,
        windowMs: number,
    ) => {
        const decayFactor = Math.exp(-ageMs / windowMs);
        const rawScore = recentViews * 0.6 + favorites * 0.3 + comments * 0.1;
        return rawScore * (0.5 + 0.5 * decayFactor);
    };

    test('weights views highest at 0.6', () => {
        const viewsOnly = calculateScore(10, 0, 0, 0, 1);
        const favsOnly = calculateScore(0, 10, 0, 0, 1);
        const commentsOnly = calculateScore(0, 0, 10, 0, 1);

        expect(viewsOnly).toBeGreaterThan(favsOnly);
        expect(favsOnly).toBeGreaterThan(commentsOnly);
    });

    test('newer articles score higher than older ones with same metrics', () => {
        const windowMs = 7 * 24 * 60 * 60 * 1000;
        const newArticle = calculateScore(10, 5, 2, 0, windowMs);
        const oldArticle = calculateScore(10, 5, 2, 6 * 24 * 60 * 60 * 1000, windowMs);

        expect(newArticle).toBeGreaterThan(oldArticle);
    });

    test('score is always positive with positive inputs', () => {
        const score = calculateScore(1, 1, 1, 30 * 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000);
        expect(score).toBeGreaterThan(0);
    });

    test('zero metrics produce zero score', () => {
        const score = calculateScore(0, 0, 0, 0, 7 * 24 * 60 * 60 * 1000);
        expect(score).toBe(0);
    });

    test('decay factor approaches 0.5 multiplier for very old articles', () => {
        const windowMs = 7 * 24 * 60 * 60 * 1000;
        const veryOld = calculateScore(10, 5, 2, 100 * windowMs, windowMs);
        const rawScore = 10 * 0.6 + 5 * 0.3 + 2 * 0.1;
        // With extreme age, decay → 0, so score → rawScore * 0.5
        expect(veryOld).toBeCloseTo(rawScore * 0.5, 1);
    });
});
