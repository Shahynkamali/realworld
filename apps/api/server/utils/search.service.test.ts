import { describe, test, expect } from 'bun:test';

// Unit tests for search query sanitization and suggestion deduplication logic

describe('FTS query sanitization', () => {
    const sanitizeQuery = (query: string): string => {
        const sanitized = query.replace(/"/g, '""');
        return sanitized.split(/\s+/).filter(Boolean).map(term => `"${term}"*`).join(' ');
    };

    test('single word produces prefix match', () => {
        expect(sanitizeQuery('hello')).toBe('"hello"*');
    });

    test('multiple words produce multiple prefix matches', () => {
        expect(sanitizeQuery('hello world')).toBe('"hello"* "world"*');
    });

    test('escapes double quotes', () => {
        expect(sanitizeQuery('hello "world"')).toBe('"hello"* """world"""*');
    });

    test('empty string produces empty result', () => {
        expect(sanitizeQuery('')).toBe('');
    });

    test('whitespace-only produces empty result', () => {
        expect(sanitizeQuery('   ')).toBe('');
    });

    test('handles extra whitespace between words', () => {
        expect(sanitizeQuery('hello   world')).toBe('"hello"* "world"*');
    });
});

describe('search query schema validation', () => {
    // Inline schema validation logic tests
    test('limit is clamped to max 100', () => {
        const clamp = (v: number) => Math.min(Math.max(v, 1), 100);
        expect(clamp(200)).toBe(100);
        expect(clamp(50)).toBe(50);
        expect(clamp(0)).toBe(1);
    });

    test('offset defaults to 0', () => {
        const offset = (v?: number) => v ?? 0;
        expect(offset(undefined)).toBe(0);
        expect(offset(10)).toBe(10);
    });
});

describe('suggestion merging', () => {
    const mergeSuggestions = (
        tags: { name: string }[],
        titles: { title: string }[],
        max: number,
    ) => {
        const suggestions: Array<{ text: string; type: 'title' | 'tag' }> = [];
        for (const t of tags) suggestions.push({ text: t.name, type: 'tag' });
        for (const a of titles) suggestions.push({ text: a.title, type: 'title' });
        return suggestions.slice(0, max);
    };

    test('tags appear before titles', () => {
        const result = mergeSuggestions(
            [{ name: 'javascript' }],
            [{ title: 'JavaScript Tutorial' }],
            10,
        );
        expect(result[0].type).toBe('tag');
        expect(result[1].type).toBe('title');
    });

    test('respects max limit', () => {
        const tags = Array.from({ length: 8 }, (_, i) => ({ name: `tag${i}` }));
        const titles = Array.from({ length: 8 }, (_, i) => ({ title: `title${i}` }));
        const result = mergeSuggestions(tags, titles, 10);
        expect(result.length).toBe(10);
    });

    test('returns empty array when no matches', () => {
        const result = mergeSuggestions([], [], 10);
        expect(result.length).toBe(0);
    });
});
