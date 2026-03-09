import HttpException from "~/models/http-exception.model";
import { definePrivateEventHandler } from "~/auth-event-handler";
import { requireArticleAccess } from "~/utils/collaborator.service";
import { handleUniqueConstraintError } from "~/utils/prisma-errors";
import { notifyCollaborationInvite } from "~/utils/notification.service";

export default definePrivateEventHandler(async (event, { auth }) => {
  const slug = getRouterParam(event, 'slug');
  const body = await readBody(event);
  const { username, role } = body?.collaborator ?? {};

  if (!username) {
    throw new HttpException(422, { errors: { username: ['is required'] } });
  }

  if (role && !['editor', 'viewer'].includes(role)) {
    throw new HttpException(422, { errors: { role: ['must be editor or viewer'] } });
  }

  const article = await requireArticleAccess(slug!, auth.id, 'author');

  const invitedUser = await usePrisma().user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!invitedUser) {
    throw new HttpException(404, { errors: { user: ['not found'] } });
  }

  if (invitedUser.id === auth.id) {
    throw new HttpException(422, { errors: { collaborator: ['cannot invite yourself'] } });
  }

  try {
    const collaborator = await usePrisma().articleCollaborator.create({
      data: {
        articleId: article.id,
        userId: invitedUser.id,
        invitedById: auth.id,
        role: role ?? 'viewer',
      },
      include: {
        user: {
          select: { username: true, image: true },
        },
      },
    });

    const actor = await usePrisma().user.findUnique({
      where: { id: auth.id },
      select: { username: true },
    });

    notifyCollaborationInvite(auth.id, actor!.username, invitedUser.id, { id: article.id, title: article.title }).catch(() => {});

    setResponseStatus(event, 201);
    return {
      collaborator: {
        userId: collaborator.userId,
        username: collaborator.user.username,
        image: collaborator.user.image,
        role: collaborator.role,
        invitedAt: collaborator.invitedAt,
        acceptedAt: collaborator.acceptedAt,
      },
    };
  } catch (e) {
    handleUniqueConstraintError(e, { collaborator: ['already invited'] });
    throw e;
  }
});
