import articleMapper from '~/utils/article.mapper';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { getTrendingArticles } from '~/utils/analytics.service';

const VALID_WINDOWS = ['24h', '7d', '30d'] as const;
type TimeWindow = (typeof VALID_WINDOWS)[number];

export default definePrivateEventHandler(async (event, { auth }) => {
    const query = getQuery(event);

    const timeWindow = VALID_WINDOWS.includes(query.timeWindow as TimeWindow)
        ? (query.timeWindow as TimeWindow)
        : '7d';

    const rawLimit = Number(query.limit) || 10;
    const limit = Math.min(Math.max(rawLimit, 1), 50);

    const scored = await getTrendingArticles(timeWindow, limit);

    const articles = scored.map(({ article, score }) => ({
        ...articleMapper(article, auth?.id),
        score: Math.round(score * 100) / 100,
        readingTimeMinutes: article.readingTimeMinutes,
    }));

    return { articles, articlesCount: articles.length };
}, { requireAuth: false });
