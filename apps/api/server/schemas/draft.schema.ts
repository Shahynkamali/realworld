import { z } from 'zod';

export const createDraftSchema = z.object({
    article: z.object({
        title: z.string().trim().min(1, "can't be blank"),
        description: z.string().trim().optional().default(''),
        body: z.string().trim().optional().default(''),
        tagList: z.array(z.string()).optional().default([]),
    }),
});

export const updateDraftSchema = z.object({
    article: z.object({
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().optional(),
        body: z.string().trim().optional(),
        tagList: z.array(z.string()).optional(),
    }),
});

export const publishDraftSchema = z.object({
    publishedAt: z.string().datetime().optional(),
}).optional();
