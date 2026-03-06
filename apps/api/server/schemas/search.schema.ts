import { z } from 'zod';

export const searchQuerySchema = z.object({
    query: z.string().trim().optional().default(''),
    tag: z.string().trim().optional(),
    author: z.string().trim().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: z.coerce.number().int().min(0).optional().default(0),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
