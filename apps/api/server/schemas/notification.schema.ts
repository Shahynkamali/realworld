import { z } from 'zod';

export const updatePreferencesSchema = z.object({
    preferences: z.array(z.object({
        type: z.enum(['follow', 'favorite', 'comment', 'reply']),
        isEnabled: z.boolean(),
    })).min(1),
});
