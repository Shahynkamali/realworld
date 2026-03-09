import HttpException from "~/models/http-exception.model";
import { definePrivateEventHandler } from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, { auth }) => {
  const slug = getRouterParam(event, 'slug');
  const userId = Number(getRouterParam(event, 'userId'));

  if (Number.isNaN(userId)) {
    throw new HttpException(422, { errors: { userId: ['must be a number'] } });
  }

  const article = await usePrisma().article.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  // Only the article author or the collaborator themselves can remove
  if (article.authorId !== auth.id && userId !== auth.id) {
    throw new HttpException(403, { errors: { collaborator: ['forbidden'] } });
  }

  const collaborator = await usePrisma().articleCollaborator.findUnique({
    where: {
      articleId_userId: {
        articleId: article.id,
        userId,
      },
    },
  });

  if (!collaborator) {
    throw new HttpException(404, { errors: { collaborator: ['not found'] } });
  }

  await usePrisma().articleCollaborator.delete({
    where: { id: collaborator.id },
  });

  setResponseStatus(event, 204);
  return null;
});
