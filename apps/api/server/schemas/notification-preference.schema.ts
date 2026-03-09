import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      type: z.enum(['FOLLOW', 'FAVORITE', 'COMMENT', 'COLLABORATION_INVITE', 'REVISION_CHANGE']),
      enabled: z.boolean(),
    }),
  ),
});
