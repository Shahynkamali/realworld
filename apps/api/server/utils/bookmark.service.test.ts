import { describe, test, expect } from 'bun:test';
import { z } from 'zod';
import { createBookmarkSchema } from '~/schemas/bookmark.schema';

describe('bookmark schema validation', () => {
    test('accepts valid bookmark with articleId', () => {
        const result = createBookmarkSchema.parse({ bookmark: { articleId: 1 } });
        expect(result.bookmark.articleId).toBe(1);
    });

    test('rejects non-integer articleId', () => {
        expect(() => createBookmarkSchema.parse({ bookmark: { articleId: 1.5 } })).toThrow();
    });

    test('rejects negative articleId', () => {
        expect(() => createBookmarkSchema.parse({ bookmark: { articleId: -1 } })).toThrow();
    });

    test('rejects missing articleId', () => {
        expect(() => createBookmarkSchema.parse({ bookmark: {} })).toThrow();
    });

    test('rejects missing bookmark wrapper', () => {
        expect(() => createBookmarkSchema.parse({ articleId: 1 })).toThrow();
    });
});
