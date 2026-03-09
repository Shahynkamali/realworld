import { z } from 'zod';

export const warnUserSchema = z.object({
    warning: z.object({
        reason: z.string().min(1),
    }),
});

export const banUserSchema = z.object({
    ban: z.object({
        reason: z.string().min(1),
    }),
});
