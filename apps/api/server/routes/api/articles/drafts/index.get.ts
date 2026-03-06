import articleMapper from "~/utils/article.mapper";
import {draftFilter} from "~/utils/article-visibility";
import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    const query = getQuery(event);

    const where = draftFilter(auth.id);

    const articlesCount = await usePrisma().article.count({ where });

    const articles = await usePrisma().article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(query.offset) || 0,
        take: Number(query.limit) || 10,
        include: {
            tagList: { select: { name: true } },
            author: {
                select: {
                    username: true,
                    image: true,
                    followedBy: { select: { id: true } },
                },
            },
            favoritedBy: { select: { id: true } },
            _count: { select: { favoritedBy: true } },
        },
    });

    return {
        articles: articles.map((article: any) => articleMapper(article, auth.id)),
        articlesCount,
    };
});
