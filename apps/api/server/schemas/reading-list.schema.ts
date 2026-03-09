import { z } from 'zod';

export const createReadingListSchema = z.object({
    readingList: z.object({
        name: z.string().trim().min(1, "can't be blank"),
        description: z.string().trim().optional(),
        isPublic: z.boolean().optional().default(false),
    }),
});

export const updateReadingListSchema = z.object({
    readingList: z.object({
        name: z.string().trim().min(1).optional(),
        description: z.string().trim().optional(),
        isPublic: z.boolean().optional(),
    }),
});

export const addArticleToListSchema = z.object({
    article: z.object({
        articleId: z.number().int().positive(),
    }),
});
