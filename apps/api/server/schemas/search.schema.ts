import { z } from 'zod';

export const searchQuerySchema = z.object({
    q: z.string().min(1, "can't be blank"),
    tag: z.string().optional(),
    author: z.string().optional(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const suggestionsQuerySchema = z.object({
    q: z.string().min(2, 'must be at least 2 characters'),
    limit: z.coerce.number().int().min(1).max(10).default(5),
});

export const trendingQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(20).default(10),
    period: z.enum(['day', 'week', 'month']).default('week'),
});
