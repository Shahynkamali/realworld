import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (_event, {auth}) => {
    const articles = await usePrisma().article.findMany({
        where: { authorId: auth.id },
        select: {
            slug: true,
            title: true,
            createdAt: true,
            _count: {
                select: {
                    views: true,
                    favoritedBy: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const totalViews = articles.reduce((sum, a) => sum + a._count.views, 0);
    const totalFavorites = articles.reduce((sum, a) => sum + a._count.favoritedBy, 0);

    return {
        stats: {
            totalArticles: articles.length,
            totalViews,
            totalFavorites,
            articles: articles.map(a => ({
                slug: a.slug,
                title: a.title,
                viewCount: a._count.views,
                favoritesCount: a._count.favoritedBy,
                createdAt: a.createdAt,
            })),
        },
    };
});
