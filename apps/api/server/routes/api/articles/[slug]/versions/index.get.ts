import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
    const slug = getRouterParam(event, 'slug');
    const query = getQuery(event);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const article = await usePrisma().article.findFirst({
        where: { slug },
        select: { id: true, authorId: true },
    });

    if (!article) {
        throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    if (article.authorId !== auth.id) {
        throw new HttpException(403, { errors: { article: ['forbidden'] } });
    }

    const [versions, versionsCount] = await Promise.all([
        usePrisma().articleVersion.findMany({
            where: { articleId: article.id },
            orderBy: { versionNumber: 'desc' },
            skip: offset,
            take: limit,
            select: {
                id: true,
                versionNumber: true,
                title: true,
                createdAt: true,
                author: {
                    select: { username: true },
                },
            },
        }),
        usePrisma().articleVersion.count({
            where: { articleId: article.id },
        }),
    ]);

    return {
        versions,
        versionsCount,
    };
});
