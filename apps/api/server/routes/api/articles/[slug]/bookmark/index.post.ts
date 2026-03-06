import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {handleUniqueConstraintError} from '~/utils/prisma-errors';

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, "slug");

    const article = await usePrisma().article.findUnique({ where: { slug } });
    if (!article || article.status !== 'published') {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    try {
        await usePrisma().bookmark.create({
            data: {
                userId: auth.id,
                articleId: article.id,
            },
        });
    } catch (e) {
        handleUniqueConstraintError(e, {bookmark: ['already bookmarked']});
        throw e;
    }

    const updatedArticle = await usePrisma().article.findUnique({
        where: { slug },
        include: {
            tagList: { select: { name: true } },
            author: {
                select: {
                    username: true,
                    bio: true,
                    image: true,
                    followedBy: true,
                },
            },
            favoritedBy: true,
            bookmarkedBy: { select: { userId: true } },
            _count: { select: { favoritedBy: true } },
        },
    });

    return {article: articleMapper(updatedArticle, auth.id)};
});
