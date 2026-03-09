import { definePrivateEventHandler } from '~/auth-event-handler';
import { createBookmarkSchema } from '~/schemas/bookmark.schema';
import { validateBody } from '~/utils/validate';
import { handleUniqueConstraintError } from '~/utils/prisma-errors';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const { bookmark } = validateBody(createBookmarkSchema, await readBody(event));

    const article = await usePrisma().article.findUnique({
        where: { id: bookmark.articleId },
        select: { id: true },
    });

    if (!article) {
        throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    try {
        const created = await usePrisma().bookmark.create({
            data: {
                userId: auth.id,
                articleId: bookmark.articleId,
            },
        });

        setResponseStatus(event, 201);
        return { bookmark: created };
    } catch (e) {
        handleUniqueConstraintError(e, { bookmark: ['article already bookmarked'] });
        throw e;
    }
});
