import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { createVersionSnapshot, parseVersionTags } from '~/utils/article-versioning.service';

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

    const targetVersion = await usePrisma().articleVersion.findFirst({
        where: { id: versionId, articleId: article.id },
        select: { versionNumber: true, title: true, description: true, body: true, tags: true },
    });

    if (!targetVersion) {
        throw new HttpException(404, { errors: { version: ['not found'] } });
    }

    const restoredTags = parseVersionTags(targetVersion);
    const tagConnects = restoredTags.map(tag => ({
        create: { name: tag },
        where: { name: tag },
    }));

    await usePrisma().$transaction(async (tx) => {
        // Snapshot current state before rolling back
        await createVersionSnapshot(article.id, auth.id, tx);

        await tx.article.update({
            where: { id: article.id },
            data: { tagList: { set: [] } },
        });

        await tx.article.update({
            where: { id: article.id },
            data: {
                title: targetVersion.title,
                description: targetVersion.description,
                body: targetVersion.body,
                updatedAt: new Date(),
                tagList: { connectOrCreate: tagConnects },
            },
        });
    });

    return {
        message: `Rolled back to version ${targetVersion.versionNumber}`,
        versionNumber: targetVersion.versionNumber,
    };
});
