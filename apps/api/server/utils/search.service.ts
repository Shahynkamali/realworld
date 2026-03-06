import type { SearchQuery } from '~/schemas/search.schema';

interface FtsRow {
    article_id: number;
    rank: number;
    snippet_title: string;
    snippet_description: string;
    snippet_body: string;
}

interface TrendingRow {
    id: number;
    trending_score: number;
}

export interface SearchResult {
    articleIds: number[];
    scores: Map<number, number>;
    snippets: Map<number, { title?: string; description?: string; body?: string }>;
    total: number;
}

// Full-text search using FTS5
export async function searchArticles(params: SearchQuery): Promise<SearchResult> {
    const prisma = usePrisma();
    const { query, tag, author, limit, offset } = params;

    if (!query) {
        return getTrendingArticles(params);
    }

    // Sanitize query for FTS5: escape double quotes and wrap terms
    const sanitized = query
        .replace(/"/g, '""')
        .split(/\s+/)
        .filter(Boolean)
        .map(term => `"${term}"*`)
        .join(' ');

    if (!sanitized) {
        return getTrendingArticles(params);
    }

    // FTS5 auxiliary functions (bm25, snippet) require querying directly from the FTS table
    // without aliases. Faceted filters are applied via subqueries on article_id.
    let filterWhere = '';
    const filterParams: any[] = [];

    if (tag) {
        filterWhere += ` AND article_id IN (
            SELECT att."A" FROM "_ArticleToTag" att
            JOIN "Tag" tg ON tg.id = att."B"
            WHERE tg.name = ?)`;
        filterParams.push(tag);
    }

    if (author) {
        filterWhere += ` AND article_id IN (
            SELECT a.id FROM "Article" a
            JOIN "User" u ON u.id = a."authorId"
            WHERE u.username = ?)`;
        filterParams.push(author);
    }

    // Count total matches
    const countSql = `
        SELECT COUNT(*) as total
        FROM article_fts
        WHERE article_fts MATCH ?${filterWhere}`;

    const countResult: any[] = await (prisma as any).$queryRawUnsafe(countSql, sanitized, ...filterParams);
    const total = Number(countResult[0]?.total ?? 0);

    if (total === 0) {
        return { articleIds: [], scores: new Map(), snippets: new Map(), total: 0 };
    }

    // Search with ranking and snippets
    // bm25 weights: title(10), description(5), body(1), tags(8)
    const searchSql = `
        SELECT
            article_id,
            bm25(article_fts, 10.0, 5.0, 1.0, 8.0) as rank,
            snippet(article_fts, 0, '<mark>', '</mark>', '...', 32) as snippet_title,
            snippet(article_fts, 1, '<mark>', '</mark>', '...', 32) as snippet_description,
            snippet(article_fts, 2, '<mark>', '</mark>', '...', 32) as snippet_body
        FROM article_fts
        WHERE article_fts MATCH ?${filterWhere}
        ORDER BY rank
        LIMIT ? OFFSET ?`;

    const rows: FtsRow[] = await (prisma as any).$queryRawUnsafe(
        searchSql,
        sanitized,
        ...filterParams,
        limit,
        offset,
    );

    const articleIds = rows.map(r => Number(r.article_id));
    const scores = new Map(rows.map(r => [Number(r.article_id), Math.abs(r.rank)]));
    const snippets = new Map(rows.map(r => [
        Number(r.article_id),
        {
            title: r.snippet_title || undefined,
            description: r.snippet_description || undefined,
            body: r.snippet_body || undefined,
        },
    ]));

    return { articleIds, scores, snippets, total };
}

// Trending algorithm: weighted score of favorites + comments, decayed by age
async function getTrendingArticles(params: SearchQuery): Promise<SearchResult> {
    const prisma = usePrisma();
    const { tag, author, limit, offset } = params;

    let filterJoins = '';
    let filterWhere = '';
    const filterParams: any[] = [];

    if (tag) {
        filterJoins += `
            JOIN "_ArticleToTag" att ON att."A" = a.id
            JOIN "Tag" tg ON tg.id = att."B"`;
        filterWhere += ` AND tg.name = ?`;
        filterParams.push(tag);
    }

    if (author) {
        filterJoins += ` JOIN "User" au ON au.id = a."authorId"`;
        filterWhere += ` AND au.username = ?`;
        filterParams.push(author);
    }

    // Count
    const countSql = `
        SELECT COUNT(DISTINCT a.id) as total
        FROM "Article" a
        ${filterJoins}
        WHERE 1=1${filterWhere}`;

    const countResult: any[] = await (prisma as any).$queryRawUnsafe(countSql, ...filterParams);
    const total = Number(countResult[0]?.total ?? 0);

    if (total === 0) {
        return { articleIds: [], scores: new Map(), snippets: new Map(), total: 0 };
    }

    // Trending score: (favorites * 3 + comments) / (age_days + 2)^1.5
    // Use a subquery so correlated counts are computed once and reused in ORDER BY
    const trendingSql = `
        SELECT id, trending_score FROM (
            SELECT
                a.id,
                (CAST((SELECT COUNT(*) FROM "_UserFavorites" WHERE "A" = a.id) AS REAL) * 3.0
                 + CAST((SELECT COUNT(*) FROM "Comment" WHERE "articleId" = a.id) AS REAL))
                / POWER(CAST((julianday('now') - julianday(a."createdAt")) AS REAL) + 2.0, 1.5)
                AS trending_score,
                a."createdAt"
            FROM "Article" a
            ${filterJoins}
            WHERE 1=1${filterWhere}
            GROUP BY a.id
        )
        ORDER BY trending_score DESC, "createdAt" DESC
        LIMIT ? OFFSET ?`;

    const rows: TrendingRow[] = await (prisma as any).$queryRawUnsafe(
        trendingSql,
        ...filterParams,
        limit,
        offset,
    );

    const articleIds = rows.map(r => Number(r.id));
    const scores = new Map(rows.map(r => [Number(r.id), Number(r.trending_score)]));

    return { articleIds, scores, snippets: new Map(), total };
}

// Search suggestions based on tags and article titles
export async function getSearchSuggestions(partial: string): Promise<string[]> {
    const prisma = usePrisma();

    if (!partial || partial.length < 2) return [];

    const [tags, articles] = await Promise.all([
        prisma.tag.findMany({
            where: { name: { startsWith: partial } },
            select: { name: true },
            take: 5,
            orderBy: { articles: { _count: 'desc' } },
        }),
        prisma.article.findMany({
            where: { title: { startsWith: partial } },
            select: { title: true },
            distinct: ['title'],
            take: 5,
        }),
    ]);

    const suggestions = [
        ...tags.map(t => t.name),
        ...articles.map(a => a.title),
    ];

    // Deduplicate and limit
    return [...new Set(suggestions)].slice(0, 10);
}

// Get available facets for current results
export async function getSearchFacets(articleIds: number[]): Promise<{
    tags: { name: string; count: number }[];
    authors: { username: string; count: number }[];
}> {
    const prisma = usePrisma();

    if (articleIds.length === 0) {
        return { tags: [], authors: [] };
    }

    const placeholders = articleIds.map(() => '?').join(',');

    const tagFacets: { name: string; count: number }[] = await (prisma as any).$queryRawUnsafe(
        `SELECT t.name, COUNT(DISTINCT att."A") as count
         FROM "_ArticleToTag" att
         JOIN "Tag" t ON t.id = att."B"
         WHERE att."A" IN (${placeholders})
         GROUP BY t.name
         ORDER BY count DESC
         LIMIT 20`,
        ...articleIds,
    );

    const authorFacets: { username: string; count: number }[] = await (prisma as any).$queryRawUnsafe(
        `SELECT u.username, COUNT(DISTINCT a.id) as count
         FROM "Article" a
         JOIN "User" u ON u.id = a."authorId"
         WHERE a.id IN (${placeholders})
         GROUP BY u.username
         ORDER BY count DESC
         LIMIT 20`,
        ...articleIds,
    );

    return {
        tags: tagFacets.map(t => ({ name: t.name, count: Number(t.count) })),
        authors: authorFacets.map(a => ({ username: a.username, count: Number(a.count) })),
    };
}
