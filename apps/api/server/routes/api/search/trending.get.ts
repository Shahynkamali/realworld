import articleMapper from '~/utils/article.mapper';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { validateQuery } from '~/utils/validate';
import { trendingQuerySchema } from '~/schemas/search.schema';
import { computeTrendingScore } from '~/utils/search-scoring';

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };

export default definePrivateEventHandler(async (event, { auth }) => {
    const { limit, period } = validateQuery(trendingQuerySchema, getQuery(event));

    const periodDays = PERIOD_DAYS[period];
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const articles = await usePrisma().article.findMany({
        where: {
            status: 'published',
            createdAt: { gte: since },
        },
        include: {
            tagList: { orderBy: { name: 'asc' }, select: { name: true } },
            author: {
                select: {
                    username: true,
                    image: true,
                    followedBy: { select: { id: true } },
                },
            },
            favoritedBy: { select: { id: true } },
            _count: { select: { favoritedBy: true, comments: true } },
        },
    });

    const scored = articles
        .map((article) => ({ article, score: computeTrendingScore(article, period) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return {
        articles: scored.map(({ article }) => articleMapper(article, auth?.id)),
        articlesCount: scored.length,
    };
}, { requireAuth: false });
