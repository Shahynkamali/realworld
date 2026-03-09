import { z } from 'zod';

export const createCollaborationSchema = z.object({
  collaborator: z.object({
    username: z.string().trim().min(1, "can't be blank"),
  }),
});
