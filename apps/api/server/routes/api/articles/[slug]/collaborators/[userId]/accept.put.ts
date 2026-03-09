import HttpException from "~/models/http-exception.model";
import { definePrivateEventHandler } from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, { auth }) => {
  const slug = getRouterParam(event, 'slug');
  const userId = Number(getRouterParam(event, 'userId'));

  if (Number.isNaN(userId)) {
    throw new HttpException(422, { errors: { userId: ['must be a number'] } });
  }

  if (userId !== auth.id) {
    throw new HttpException(403, { errors: { collaborator: ['can only accept your own invitation'] } });
  }

  const collaborator = await usePrisma().articleCollaborator.findFirst({
    where: {
      article: { slug },
      userId: auth.id,
    },
  });

  if (!collaborator) {
    throw new HttpException(404, { errors: { invitation: ['not found'] } });
  }

  if (collaborator.acceptedAt) {
    throw new HttpException(422, { errors: { invitation: ['already accepted'] } });
  }

  const updated = await usePrisma().articleCollaborator.update({
    where: { id: collaborator.id },
    data: { acceptedAt: new Date() },
    include: {
      user: {
        select: { username: true, image: true },
      },
    },
  });

  return {
    collaborator: {
      userId: updated.userId,
      username: updated.user.username,
      image: updated.user.image,
      role: updated.role,
      invitedAt: updated.invitedAt,
      acceptedAt: updated.acceptedAt,
    },
  };
});
