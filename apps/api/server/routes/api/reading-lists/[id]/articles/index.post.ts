import { definePrivateEventHandler } from '~/auth-event-handler';
import { addArticleToListSchema } from '~/schemas/reading-list.schema';
import { validateBody } from '~/utils/validate';
import { handleUniqueConstraintError } from '~/utils/prisma-errors';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const { article } = validateBody(addArticleToListSchema, await readBody(event));
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const list = await usePrisma().readingList.findUnique({ where: { id } });

    if (!list) {
        throw new HttpException(404, { errors: { readingList: ['not found'] } });
    }

    if (list.userId !== auth.id) {
        throw new HttpException(403, { errors: { readingList: ['access denied'] } });
    }

    const articleExists = await usePrisma().article.findUnique({
        where: { id: article.articleId },
        select: { id: true },
    });

    if (!articleExists) {
        throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    try {
        const item = await usePrisma().readingListItem.create({
            data: {
                readingListId: id,
                articleId: article.articleId,
                addedById: auth.id,
            },
        });

        setResponseStatus(event, 201);
        return { item };
    } catch (e) {
        handleUniqueConstraintError(e, { article: ['already in this reading list'] });
        throw e;
    }
});
