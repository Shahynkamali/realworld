import { describe, test, expect } from 'bun:test';
import { calculateReadingTime } from './reading-time.service';

describe('calculateReadingTime', () => {
    test('returns 1 minute for short text', () => {
        expect(calculateReadingTime('Hello world')).toBe(1);
    });

    test('returns 1 minute for exactly 200 words', () => {
        const text = Array(200).fill('word').join(' ');
        expect(calculateReadingTime(text)).toBe(1);
    });

    test('returns 2 minutes for 201-400 words', () => {
        const text = Array(250).fill('word').join(' ');
        expect(calculateReadingTime(text)).toBe(2);
    });

    test('returns 5 minutes for 1000 words', () => {
        const text = Array(1000).fill('word').join(' ');
        expect(calculateReadingTime(text)).toBe(5);
    });

    test('returns 1 minute for empty string', () => {
        expect(calculateReadingTime('')).toBe(1);
    });

    test('handles text with extra whitespace', () => {
        const text = Array(400).fill('word').join('   ');
        expect(calculateReadingTime(text)).toBe(2);
    });
});
