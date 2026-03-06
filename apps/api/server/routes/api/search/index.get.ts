import articleMapper from '~/utils/article.mapper';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { validateQuery } from '~/utils/validate';
import { searchQuerySchema } from '~/schemas/search.schema';
import { scoreArticleRelevance } from '~/utils/search-scoring';

const MAX_INTERNAL_FETCH = 500;

export default definePrivateEventHandler(async (event, { auth }) => {
    const { q, tag, author, offset, limit } = validateQuery(searchQuerySchema, getQuery(event));

    const qLower = q.toLowerCase();
    const where: any = {
        AND: [
            { status: 'published' },
            {
                OR: [
                    { title: { contains: qLower } },
                    { description: { contains: qLower } },
                    { body: { contains: qLower } },
                    { tagList: { some: { name: { contains: qLower } } } },
                ],
            },
            ...(tag ? [{ tagList: { some: { name: tag } } }] : []),
            ...(author ? [{ author: { username: { equals: author } } }] : []),
        ],
    };

    const articles = await usePrisma().article.findMany({
        where,
        take: MAX_INTERNAL_FETCH,
        orderBy: { createdAt: 'desc' },
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
            _count: { select: { favoritedBy: true } },
        },
    });

    // Score and sort by relevance
    const scored = articles
        .map((article) => ({ article, score: scoreArticleRelevance(article, q) }))
        .sort((a, b) => b.score - a.score || new Date(b.article.createdAt).getTime() - new Date(a.article.createdAt).getTime());

    // Compute facets from all matched results
    const tagCounts = new Map<string, number>();
    const authorCounts = new Map<string, number>();
    for (const { article } of scored) {
        for (const t of article.tagList) {
            tagCounts.set(t.name, (tagCounts.get(t.name) ?? 0) + 1);
        }
        authorCounts.set(article.author.username, (authorCounts.get(article.author.username) ?? 0) + 1);
    }

    const facets = {
        tags: [...tagCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count })),
        authors: [...authorCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([username, count]) => ({ username, count })),
    };

    // Paginate
    const paginated = scored.slice(offset, offset + limit);

    return {
        articles: paginated.map(({ article }) => articleMapper(article, auth?.id)),
        articlesCount: scored.length,
        facets,
    };
}, { requireAuth: false });
