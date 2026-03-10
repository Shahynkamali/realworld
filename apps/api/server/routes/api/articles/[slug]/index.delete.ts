import HttpException from "~/models/http-exception.model";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {ftsDeleteArticle} from '~/utils/fts';

export default definePrivateEventHandler(async (event, {auth}) => {
const slug = getRouterParam(event, 'slug');

    const existingArticle = await usePrisma().article.findFirst({
        where: {
            slug,
        },
        select: {
            id: true,
            author: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    });

    if (!existingArticle) {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    if (existingArticle.author.id !== auth.id) {
        throw new HttpException(403, {errors: {article: ['forbidden']}});
    }
    await usePrisma().article.delete({
        where: {
            slug,
        },
    });

    try {
        await ftsDeleteArticle(existingArticle.id);
    } catch (_) { /* FTS sync failure is non-critical */ }

    setResponseStatus(event, 204);
    return null;
});
