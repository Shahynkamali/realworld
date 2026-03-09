import { z } from 'zod';

export const createModerationRuleSchema = z.object({
    rule: z.object({
        name: z.string().trim().min(1, "can't be blank"),
        ruleType: z.enum(['banned_words', 'spam_pattern', 'content_length']),
        pattern: z.string().trim().min(1, "can't be blank"),
        severity: z.enum(['low', 'medium', 'high']).optional().default('low'),
        autoAction: z.enum(['flag', 'warn', 'ban']).optional().default('flag'),
    }),
});

export const warnUserSchema = z.object({
    warning: z.object({
        reason: z.string().trim().min(1, "can't be blank"),
    }),
});

export const banUserSchema = z.object({
    ban: z.object({
        reason: z.string().trim().min(1, "can't be blank"),
        permanent: z.boolean().optional().default(false),
        expiresAt: z.string().datetime().optional(),
    }),
});

export const createAppealSchema = z.object({
    appeal: z.object({
        moderationActionId: z.number().int().positive(),
        reason: z.string().trim().min(1, "can't be blank"),
    }),
});

export const reviewAppealSchema = z.object({
    appeal: z.object({
        status: z.enum(['approved', 'denied']),
    }),
});
