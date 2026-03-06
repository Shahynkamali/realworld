import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    const slug = getRouterParam(event, "slug");

    const article = await usePrisma().article.findUnique({ where: { slug } });
    if (!article || article.status !== 'published') {
        throw new HttpException(404, {errors: {article: ['not found']}});
    }

    await usePrisma().bookmark.deleteMany({
        where: {
            userId: auth.id,
            articleId: article.id,
        },
    });

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
