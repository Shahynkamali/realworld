import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
  const slug = getRouterParam(event, 'slug');

  const article = await usePrisma().article.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  const collaborations = await usePrisma().collaboration.findMany({
    where: { articleId: article.id, status: 'ACCEPTED' },
    include: {
      invitee: { select: { username: true, bio: true, image: true } },
    },
  });

  return {
    collaborators: collaborations.map((c) => ({
      username: c.invitee.username,
      bio: c.invitee.bio,
      image: c.invitee.image,
    })),
  };
});
