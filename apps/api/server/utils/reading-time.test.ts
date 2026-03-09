import { describe, expect, test } from 'bun:test';
import { calculateReadingTime } from './reading-time';

describe('calculateReadingTime', () => {
    test('returns 1 for empty string', () => {
        expect(calculateReadingTime('')).toBe(1);
    });

    test('returns 1 for short text', () => {
        expect(calculateReadingTime('Hello world')).toBe(1);
    });

    test('returns 2 for 470 words', () => {
        const text = Array(470).fill('word').join(' ');
        expect(calculateReadingTime(text)).toBe(2);
    });

    test('handles extra whitespace', () => {
        const text = Array(470).fill('word').join('   \n\t  ');
        expect(calculateReadingTime(text)).toBe(2);
    });
});
