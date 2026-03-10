import { describe, expect, test } from 'bun:test';
import { sanitizeFtsQuery } from './fts';

describe('sanitizeFtsQuery', () => {
    test('wraps regular words in quotes', () => {
        expect(sanitizeFtsQuery('hello world')).toBe('"hello" "world"');
    });

    test('escapes quotes in input by doubling them', () => {
        expect(sanitizeFtsQuery('say "hello"')).toBe('"say" """hello"""');
    });

    test('returns empty string for empty input', () => {
        expect(sanitizeFtsQuery('')).toBe('');
    });

    test('returns empty string for whitespace-only input', () => {
        expect(sanitizeFtsQuery('   ')).toBe('');
    });

    test('handles single word', () => {
        expect(sanitizeFtsQuery('test')).toBe('"test"');
    });

    test('handles multiple spaces between words', () => {
        expect(sanitizeFtsQuery('  foo   bar  ')).toBe('"foo" "bar"');
    });
});
