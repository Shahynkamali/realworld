import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { createCollaborationSchema } from '~/schemas/collaboration.schema';
import { validateBody } from '~/utils/validate';
import collaborationMapper from '~/utils/collaboration.mapper';
import { useCreateNotification } from '~/utils/notification.create';
import { handleUniqueConstraintError } from '~/utils/prisma-errors';

export default definePrivateEventHandler(async (event, { auth }) => {
  const { collaborator } = validateBody(createCollaborationSchema, await readBody(event));
  const slug = getRouterParam(event, 'slug');

  const article = await usePrisma().article.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  if (article.authorId !== auth.id) {
    throw new HttpException(403, { errors: { article: ['forbidden'] } });
  }

  const invitee = await usePrisma().user.findUnique({
    where: { username: collaborator.username },
  });

  if (!invitee) {
    throw new HttpException(404, { errors: { collaborator: ['not found'] } });
  }

  if (invitee.id === auth.id) {
    throw new HttpException(422, { errors: { collaborator: ['cannot invite yourself'] } });
  }

  try {
    const collaboration = await usePrisma().collaboration.create({
      data: {
        articleId: article.id,
        inviterId: auth.id,
        inviteeId: invitee.id,
      },
      include: {
        article: { select: { slug: true, title: true } },
        inviter: { select: { username: true, bio: true, image: true } },
        invitee: { select: { username: true, bio: true, image: true } },
      },
    });

    await useCreateNotification({
      type: 'COLLABORATION_INVITE',
      userId: invitee.id,
      actorId: auth.id,
      articleId: article.id,
      collaborationId: collaboration.id,
    });

    setResponseStatus(event, 201);
    return { collaboration: collaborationMapper(collaboration) };
  } catch (e) {
    handleUniqueConstraintError(e, { collaboration: ['already exists'] });
    throw e;
  }
});
