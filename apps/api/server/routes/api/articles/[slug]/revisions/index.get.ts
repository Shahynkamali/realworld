import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import revisionMapper from '~/utils/revision.mapper';

export default definePrivateEventHandler(
  async (event, { auth }) => {
    const slug = getRouterParam(event, 'slug');

    const article = await usePrisma().article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    const revisions = await usePrisma().revision.findMany({
      where: { articleId: article.id },
      include: {
        author: { select: { username: true, bio: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      revisions: revisions.map(revisionMapper),
      revisionsCount: revisions.length,
    };
  },
  { requireAuth: false },
);
