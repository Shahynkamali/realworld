import HttpException from "~/models/http-exception.model";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {removeArticleFromIndex} from '~/utils/search.service';

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

    removeArticleFromIndex(existingArticle.id).catch(() => {});

    setResponseStatus(event, 204);
    return null;
});
