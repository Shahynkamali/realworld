import { definePrivateEventHandler } from '~/auth-event-handler';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const id = Number(getRouterParam(event, 'id'));
    const articleId = Number(getRouterParam(event, 'articleId'));

    if (isNaN(id) || isNaN(articleId)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const list = await usePrisma().readingList.findUnique({ where: { id } });

    if (!list) {
        throw new HttpException(404, { errors: { readingList: ['not found'] } });
    }

    if (list.userId !== auth.id) {
        throw new HttpException(403, { errors: { readingList: ['access denied'] } });
    }

    const item = await usePrisma().readingListItem.findUnique({
        where: {
            readingListId_articleId: {
                readingListId: id,
                articleId,
            },
        },
    });

    if (!item) {
        throw new HttpException(404, { errors: { article: ['not in this reading list'] } });
    }

    await usePrisma().readingListItem.delete({ where: { id: item.id } });

    return { message: 'Article removed from reading list' };
});
