import HttpException from "~/models/http-exception.model";
import articleMapper from "~/utils/article.mapper";
import { definePrivateEventHandler } from "~/auth-event-handler";
import { ftsSearch } from "~/utils/fts";

export default definePrivateEventHandler(async (event, { auth }) => {
    const query = getQuery(event);

    const q = String(query.q ?? '').trim();
    if (!q) {
        throw new HttpException(422, { errors: { q: ['is required'] } });
    }

    const limit = Math.min(Number(query.limit) || 10, 20);
    const offset = Number(query.offset) || 0;

    // Get candidate matches from FTS (fetch a large window for post-filtering)
    const ftsResults = await ftsSearch(q, 1000, 0);
    if (ftsResults.length === 0) {
        return { articles: [], articlesCount: 0 };
    }

    const articleIds = ftsResults.map(r => r.articleId);

    // Build optional filters
    const andQueries: any[] = [{ id: { in: articleIds } }];

    if (query.tag) {
        andQueries.push({
            tagList: { some: { name: String(query.tag) } },
        });
    }

    if (query.author) {
        andQueries.push({
            author: { username: { equals: String(query.author) } },
        });
    }

    if (query.publishedAfter) {
        andQueries.push({
            createdAt: { gte: new Date(String(query.publishedAfter)) },
        });
    }

    if (query.publishedBefore) {
        andQueries.push({
            createdAt: { lte: new Date(String(query.publishedBefore)) },
        });
    }

    const where = { AND: andQueries };

    const articlesCount = await usePrisma().article.count({ where });

    const articles = await usePrisma().article.findMany({
        where,
        include: {
            tagList: { select: { name: true } },
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
                },
            },
        },
    });

    // Build a rank/highlights lookup by article ID
    const ftsMap = new Map(ftsResults.map(r => [r.articleId, r]));

    // Sort by FTS rank (bm25 returns negative values; more negative = better match)
    const sorted = articles.sort((a: any, b: any) => {
        const rankA = ftsMap.get(a.id)?.rank ?? 0;
        const rankB = ftsMap.get(b.id)?.rank ?? 0;
        return rankA - rankB;
    });

    // Paginate in-memory
    const paginated = sorted.slice(offset, offset + limit);

    const mappedArticles = paginated.map((article: any) => {
        const fts = ftsMap.get(article.id);
        return {
            ...articleMapper(article, auth?.id),
            highlights: fts?.highlights ?? { title: '', description: '', body: '' },
        };
    });

    return { articles: mappedArticles, articlesCount };
}, { requireAuth: false });
