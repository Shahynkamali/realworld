import { describe, expect, test } from 'bun:test';
import { analyzeContent } from './content-moderation';

describe('analyzeContent', () => {
    test('returns not flagged for normal content', () => {
        const result = analyzeContent('This is a normal article about programming.');
        expect(result.flagged).toBe(false);
        expect(result.reasons).toHaveLength(0);
    });

    test('flags spam keywords', () => {
        const result = analyzeContent('Buy now and get free money!');
        expect(result.flagged).toBe(true);
        expect(result.reasons.some(r => r.includes('buy now'))).toBe(true);
        expect(result.reasons.some(r => r.includes('free money'))).toBe(true);
    });

    test('flags excessive capitalization', () => {
        const result = analyzeContent('THIS IS ALL CAPS AND VERY LOUD TEXT');
        expect(result.flagged).toBe(true);
        expect(result.reasons.some(r => r.includes('Excessive capitalization'))).toBe(true);
    });

    test('does not flag short caps text', () => {
        const result = analyzeContent('OK FINE');
        expect(result.flagged).toBe(false);
    });

    test('flags link spam', () => {
        const urls = Array.from({ length: 6 }, (_, i) => `https://example${i}.com`).join(' ');
        const result = analyzeContent(`Check these out: ${urls}`);
        expect(result.flagged).toBe(true);
        expect(result.reasons.some(r => r.includes('Link spam'))).toBe(true);
    });

    test('does not flag 5 or fewer links', () => {
        const urls = Array.from({ length: 5 }, (_, i) => `https://example${i}.com`).join(' ');
        const result = analyzeContent(`Some links: ${urls}`);
        expect(result.reasons.some(r => r.includes('Link spam'))).toBe(false);
    });

    test('can flag multiple reasons at once', () => {
        const urls = Array.from({ length: 6 }, (_, i) => `https://spam${i}.com`).join(' ');
        const result = analyzeContent(`BUY NOW CLICK HERE FREE MONEY ${urls}`);
        expect(result.flagged).toBe(true);
        expect(result.reasons.length).toBeGreaterThanOrEqual(3);
    });
});
