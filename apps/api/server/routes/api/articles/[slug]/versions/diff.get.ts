import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { diffVersions } from '~/utils/diff.service';
import { parseVersionTags } from '~/utils/article-versioning.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const slug = getRouterParam(event, 'slug');
    const query = getQuery(event);
    const v1 = Number(query.v1);
    const v2 = Number(query.v2);

    if (!v1 || !v2 || isNaN(v1) || isNaN(v2)) {
        throw new HttpException(422, { errors: { versions: ['v1 and v2 query params are required and must be version IDs'] } });
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

    const versionSelect = {
        id: true, versionNumber: true, title: true, description: true, body: true, tags: true,
    } as const;

    const [version1, version2] = await Promise.all([
        usePrisma().articleVersion.findFirst({
            where: { id: v1, articleId: article.id },
            select: versionSelect,
        }),
        usePrisma().articleVersion.findFirst({
            where: { id: v2, articleId: article.id },
            select: versionSelect,
        }),
    ]);

    if (!version1 || !version2) {
        throw new HttpException(404, { errors: { version: ['one or both versions not found'] } });
    }

    // Always diff older → newer
    const [older, newer] = version1.versionNumber < version2.versionNumber
        ? [version1, version2]
        : [version2, version1];

    const diff = diffVersions(
        { title: older.title, description: older.description, body: older.body, tags: parseVersionTags(older) },
        { title: newer.title, description: newer.description, body: newer.body, tags: parseVersionTags(newer) },
    );

    return {
        diff,
        from: { id: older.id, versionNumber: older.versionNumber },
        to: { id: newer.id, versionNumber: newer.versionNumber },
    };
});
