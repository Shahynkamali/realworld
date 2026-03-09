import { definePrivateEventHandler } from '~/auth-event-handler';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const articleId = Number(getRouterParam(event, 'articleId'));

    if (isNaN(articleId)) {
        throw new HttpException(422, { errors: { articleId: ['must be a number'] } });
    }

    const bookmark = await usePrisma().bookmark.findUnique({
        where: {
            userId_articleId: {
                userId: auth.id,
                articleId,
            },
        },
    });

    if (!bookmark) {
        throw new HttpException(404, { errors: { bookmark: ['not found'] } });
    }

    await usePrisma().bookmark.delete({
        where: { id: bookmark.id },
    });

    return { message: 'Bookmark removed' };
});
