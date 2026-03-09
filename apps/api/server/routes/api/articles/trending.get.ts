import articleMapper from "~/utils/article.mapper";
import {definePrivateEventHandler} from "~/auth-event-handler";
import {calculateTrendingScore} from '~/utils/trending-score';

const WINDOW_MS: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

export default definePrivateEventHandler(async (event, {auth}) => {
    const query = getQuery(event);

    const window = typeof query.window === 'string' && query.window in WINDOW_MS ? query.window : '7d';
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 20);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const now = new Date();
    const since = new Date(now.getTime() - WINDOW_MS[window]);

    const articles = await usePrisma().article.findMany({
        where: {
            createdAt: { gte: since },
        },
        include: {
            tagList: {
                select: { name: true },
            },
            author: {
                select: {
                    username: true,
                    bio: true,
                    image: true,
                    followedBy: { select: { id: true } },
                },
            },
            favoritedBy: { select: { id: true } },
            _count: {
                select: {
                    favoritedBy: true,
                    views: true,
                },
            },
        },
    });

    const scored = articles
        .map(article => ({
            article,
            score: calculateTrendingScore(
                article._count.views,
                article._count.favoritedBy,
                article.createdAt,
                now,
            ),
        }))
        .sort((a, b) => b.score - a.score);

    const paginated = scored.slice(offset, offset + limit);

    return {
        articles: paginated.map(({ article }) => articleMapper(article, auth?.id)),
        articlesCount: scored.length,
    };
}, {requireAuth: false});
