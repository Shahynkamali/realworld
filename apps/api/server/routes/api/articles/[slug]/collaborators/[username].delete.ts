import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
  const slug = getRouterParam(event, 'slug');
  const username = getRouterParam(event, 'username');

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
    where: { username },
  });

  if (!invitee) {
    throw new HttpException(404, { errors: { collaborator: ['not found'] } });
  }

  const collaboration = await usePrisma().collaboration.findUnique({
    where: { articleId_inviteeId: { articleId: article.id, inviteeId: invitee.id } },
  });

  if (!collaboration) {
    throw new HttpException(404, { errors: { collaboration: ['not found'] } });
  }

  await usePrisma().collaboration.delete({
    where: { id: collaboration.id },
  });

  return { message: 'collaborator removed' };
});
