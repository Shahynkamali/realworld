import { z } from 'zod';

export const searchQuerySchema = z.object({
    q: z.string().min(1, 'Search query is required'),
    tag: z.union([z.string(), z.array(z.string())]).optional(),
    author: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export const suggestionsQuerySchema = z.object({
    q: z.string().min(1, 'Query is required'),
    limit: z.coerce.number().int().min(1).max(10).default(10),
});
