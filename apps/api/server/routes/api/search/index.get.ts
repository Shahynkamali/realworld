import { definePrivateEventHandler } from '~/auth-event-handler';
import { searchQuerySchema } from '~/schemas/search.schema';
import { searchArticles, getSearchSuggestions, getSearchFacets } from '~/utils/search.service';
import articleMapper from '~/utils/article.mapper';

export default definePrivateEventHandler(async (event, { auth }) => {
    const rawQuery = getQuery(event);
    const params = validateQuery(searchQuerySchema, rawQuery);

    const searchResult = await searchArticles(params);

    if (searchResult.articleIds.length === 0) {
        const suggestions = params.query
            ? await getSearchSuggestions(params.query)
            : [];

        return {
            articles: [],
            articlesCount: searchResult.total,
            suggestions,
            facets: { tags: [], authors: [] },
        };
    }

    // Fetch full articles for the matched IDs
    const articles = await usePrisma().article.findMany({
        where: { id: { in: searchResult.articleIds } },
        include: {
            tagList: {
                orderBy: { name: 'asc' },
                select: { name: true },
            },
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

    // Sort by search relevance order, boosting followed authors for authenticated users
    const articleMap = new Map(articles.map(a => [a.id, a]));
    const orderedArticles = searchResult.articleIds
        .map(id => articleMap.get(id))
        .filter(Boolean);

    if (auth?.id) {
        const followedAuthorIds = new Set(
            orderedArticles
                .filter((a: any) => a.author.followedBy.some((f: any) => f.id === auth.id))
                .map((a: any) => a.authorId)
        );

        if (followedAuthorIds.size > 0) {
            orderedArticles.sort((a: any, b: any) => {
                const aScore = (searchResult.scores.get(a.id) ?? 0) + (followedAuthorIds.has(a.authorId) ? 0.5 : 0);
                const bScore = (searchResult.scores.get(b.id) ?? 0) + (followedAuthorIds.has(b.authorId) ? 0.5 : 0);
                return bScore - aScore;
            });
        }
    }

    const mappedArticles = orderedArticles.map((article: any) => {
        const mapped = articleMapper(article, auth?.id);
        const snippet = searchResult.snippets.get(article.id);
        return {
            ...mapped,
            ...(snippet ? { highlights: snippet } : {}),
            relevanceScore: searchResult.scores.get(article.id) ?? 0,
        };
    });

    // Facets are computed from the current page of results only (not total matches)
    const [facets, suggestions] = await Promise.all([
        getSearchFacets(searchResult.articleIds),
        params.query ? getSearchSuggestions(params.query) : Promise.resolve([]),
    ]);

    return {
        articles: mappedArticles,
        articlesCount: searchResult.total,
        suggestions,
        facets,
    };
}, { requireAuth: false });
