import { definePrivateEventHandler } from '~/auth-event-handler';
import articleMapper from '~/utils/article.mapper';

export default definePrivateEventHandler(async (event, { auth }) => {
    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const [bookmarks, total] = await Promise.all([
        usePrisma().bookmark.findMany({
            where: { userId: auth.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                article: {
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
                        _count: { select: { favoritedBy: true } },
                    },
                },
            },
        }),
        usePrisma().bookmark.count({ where: { userId: auth.id } }),
    ]);

    const articles = bookmarks.map(b => {
        const { body, ...article } = b.article;
        return articleMapper(article, auth.id);
    });

    return { articles, articlesCount: total };
});
