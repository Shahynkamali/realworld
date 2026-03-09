import { describe, test, expect } from 'bun:test';
import { createReadingListSchema, updateReadingListSchema, addArticleToListSchema } from '~/schemas/reading-list.schema';

describe('reading list schema validation', () => {
    describe('createReadingListSchema', () => {
        test('accepts valid reading list with name only', () => {
            const result = createReadingListSchema.parse({ readingList: { name: 'My List' } });
            expect(result.readingList.name).toBe('My List');
            expect(result.readingList.isPublic).toBe(false);
        });

        test('accepts reading list with all fields', () => {
            const result = createReadingListSchema.parse({
                readingList: { name: 'Public List', description: 'A description', isPublic: true },
            });
            expect(result.readingList.name).toBe('Public List');
            expect(result.readingList.description).toBe('A description');
            expect(result.readingList.isPublic).toBe(true);
        });

        test('rejects empty name', () => {
            expect(() => createReadingListSchema.parse({ readingList: { name: '' } })).toThrow();
        });

        test('rejects blank name', () => {
            expect(() => createReadingListSchema.parse({ readingList: { name: '   ' } })).toThrow();
        });

        test('rejects missing name', () => {
            expect(() => createReadingListSchema.parse({ readingList: {} })).toThrow();
        });
    });

    describe('updateReadingListSchema', () => {
        test('accepts partial update with name only', () => {
            const result = updateReadingListSchema.parse({ readingList: { name: 'New Name' } });
            expect(result.readingList.name).toBe('New Name');
        });

        test('accepts partial update with isPublic only', () => {
            const result = updateReadingListSchema.parse({ readingList: { isPublic: true } });
            expect(result.readingList.isPublic).toBe(true);
        });

        test('accepts empty update', () => {
            const result = updateReadingListSchema.parse({ readingList: {} });
            expect(result.readingList).toBeDefined();
        });
    });

    describe('addArticleToListSchema', () => {
        test('accepts valid articleId', () => {
            const result = addArticleToListSchema.parse({ article: { articleId: 5 } });
            expect(result.article.articleId).toBe(5);
        });

        test('rejects non-positive articleId', () => {
            expect(() => addArticleToListSchema.parse({ article: { articleId: 0 } })).toThrow();
        });

        test('rejects missing articleId', () => {
            expect(() => addArticleToListSchema.parse({ article: {} })).toThrow();
        });
    });
});
