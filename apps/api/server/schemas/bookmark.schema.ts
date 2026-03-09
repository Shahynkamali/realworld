import { z } from 'zod';

export const createBookmarkSchema = z.object({
    bookmark: z.object({
        articleId: z.number().int().positive(),
    }),
});
