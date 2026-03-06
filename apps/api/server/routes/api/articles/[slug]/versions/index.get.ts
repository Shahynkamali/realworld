import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
    const slug = getRouterParam(event, 'slug');

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

    const versions = await usePrisma().articleVersion.findMany({
        where: { articleId: article.id },
        orderBy: { versionNumber: 'desc' },
        select: {
            id: true,
            versionNumber: true,
            title: true,
            createdAt: true,
            author: {
                select: { username: true },
            },
        },
    });

    return {
        versions,
        versionsCount: versions.length,
    };
});
