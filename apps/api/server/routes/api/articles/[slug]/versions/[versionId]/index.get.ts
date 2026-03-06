import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { parseVersionTags } from '~/utils/article-versioning.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const slug = getRouterParam(event, 'slug');
    const versionId = Number(getRouterParam(event, 'versionId'));

    if (!versionId || isNaN(versionId)) {
        throw new HttpException(422, { errors: { versionId: ['must be a number'] } });
    }

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

    const version = await usePrisma().articleVersion.findFirst({
        where: { id: versionId, articleId: article.id },
        select: {
            id: true,
            versionNumber: true,
            title: true,
            description: true,
            body: true,
            tags: true,
            createdAt: true,
            author: { select: { username: true } },
        },
    });

    if (!version) {
        throw new HttpException(404, { errors: { version: ['not found'] } });
    }

    return {
        version: {
            ...version,
            tags: parseVersionTags(version),
        },
    };
});
