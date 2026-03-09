import { definePrivateEventHandler } from "~/auth-event-handler";
import { requireArticleAccess } from "~/utils/collaborator.service";

export default definePrivateEventHandler(async (event, { auth }) => {
  const slug = getRouterParam(event, 'slug');

  await requireArticleAccess(slug!, auth.id, 'viewer');

  const collaborators = await usePrisma().articleCollaborator.findMany({
    where: { article: { slug } },
    include: {
      user: {
        select: { username: true, image: true, bio: true },
      },
      invitedBy: {
        select: { username: true },
      },
    },
    orderBy: { invitedAt: 'desc' },
  });

  return {
    collaborators: collaborators.map((c) => ({
      userId: c.userId,
      username: c.user.username,
      image: c.user.image,
      role: c.role,
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
      invitedBy: c.invitedBy.username,
    })),
  };
});
