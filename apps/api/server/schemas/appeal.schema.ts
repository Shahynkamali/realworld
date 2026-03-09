import { z } from 'zod';

export const createAppealSchema = z.object({
    appeal: z.object({
        body: z.string().min(1),
    }),
});

export const reviewAppealSchema = z.object({
    appeal: z.object({
        status: z.enum(['accepted', 'rejected']),
        response: z.string().optional(),
    }),
});
