import { z } from 'zod';

const NOTIFICATION_TYPES = ['FOLLOW', 'FAVORITE', 'COMMENT', 'COLLABORATION_INVITE', 'REVISION_CHANGE'] as const;

export const updatePreferencesSchema = z.object({
  preferences: z.record(
    z.enum(NOTIFICATION_TYPES),
    z.boolean(),
  ),
});
