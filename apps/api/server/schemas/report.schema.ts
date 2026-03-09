import { z } from 'zod';

export const createReportSchema = z.object({
    report: z.object({
        reason: z.enum(['spam', 'harassment', 'hate_speech', 'misinformation', 'other']),
        description: z.string().optional(),
    }),
});

export const reviewReportSchema = z.object({
    report: z.object({
        status: z.enum(['reviewed', 'dismissed']),
        action: z.enum(['none', 'content_removed', 'user_warned', 'user_banned']).optional(),
    }),
});
