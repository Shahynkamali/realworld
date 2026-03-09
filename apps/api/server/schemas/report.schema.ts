import { z } from 'zod';

export const createReportSchema = z.object({
    report: z.object({
        reason: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
        description: z.string().trim().min(1).optional(),
    }),
});

export const reviewReportSchema = z.object({
    report: z.object({
        status: z.enum(['reviewed', 'dismissed']),
    }),
});
