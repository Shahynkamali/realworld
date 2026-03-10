import type { PrismaClient } from '../../generated/prisma/client';

let ftsInitialized = false;

export const ensureFtsTable = async () => {
    if (ftsInitialized) return;
    const prisma = usePrisma();
    await prisma.$queryRawUnsafe(`
        CREATE VIRTUAL TABLE IF NOT EXISTS article_fts USING fts5(
            article_id UNINDEXED,
            title,
            description,
            body,
            content='Article',
            content_rowid='id'
        )
    `);
    ftsInitialized = true;
};

export const rebuildFtsIndex = async () => {
    const prisma = usePrisma();
    await ensureFtsTable();
    // Clear and rebuild from scratch
    await prisma.$queryRawUnsafe(`DELETE FROM article_fts`);
    await prisma.$queryRawUnsafe(`
        INSERT INTO article_fts(article_id, title, description, body)
        SELECT id, title, description, body FROM Article
    `);
};

export const indexArticle = async (articleId: number, title: string, description: string, body: string) => {
    const prisma = usePrisma();
    await ensureFtsTable();
    // Remove old entry then insert new one
    await prisma.$queryRawUnsafe(`DELETE FROM article_fts WHERE article_id = ?`, articleId);
    await prisma.$queryRawUnsafe(
        `INSERT INTO article_fts(article_id, title, description, body) VALUES (?, ?, ?, ?)`,
        articleId, title, description, body,
    );
};

export const removeArticleFromIndex = async (articleId: number) => {
    const prisma = usePrisma();
    await ensureFtsTable();
    await prisma.$queryRawUnsafe(`DELETE FROM article_fts WHERE article_id = ?`, articleId);
};

interface SearchOptions {
    query: string;
    tag?: string[];
    author?: string;
    from?: string;
    to?: string;
    limit: number;
    offset: number;
}

interface FtsRow {
    article_id: number;
    rank: number;
    title: string;
    description: string;
    body: string;
}

export const searchArticles = async (options: SearchOptions): Promise<{ articleIds: number[]; total: number; highlights: Map<number, { title: string; description: string; body: string }> }> => {
    const prisma = usePrisma();
    await ensureFtsTable();

    // Sanitize query for FTS5: escape double quotes
    const sanitized = options.query.replace(/"/g, '""');
    const ftsQuery = sanitized.split(/\s+/).filter(Boolean).map(term => `"${term}"*`).join(' ');

    if (!ftsQuery) {
        return { articleIds: [], total: 0, highlights: new Map() };
    }

    // Get matching article IDs with rank from FTS
    const ftsResults = await prisma.$queryRawUnsafe<FtsRow[]>(`
        SELECT
            article_id,
            rank,
            highlight(article_fts, 1, '<mark>', '</mark>') as title,
            highlight(article_fts, 2, '<mark>', '</mark>') as description,
            snippet(article_fts, 3, '<mark>', '</mark>', '...', 30) as body
        FROM article_fts
        WHERE article_fts MATCH ?
        ORDER BY rank
    `, ftsQuery);

    if (ftsResults.length === 0) {
        return { articleIds: [], total: 0, highlights: new Map() };
    }

    let articleIds = ftsResults.map(r => Number(r.article_id));

    // Apply filters via Prisma
    const where: any = { id: { in: articleIds } };

    if (options.tag && options.tag.length > 0) {
        where.tagList = { some: { name: { in: options.tag } } };
    }

    if (options.author) {
        where.author = { username: options.author };
    }

    if (options.from || options.to) {
        where.createdAt = {};
        if (options.from) where.createdAt.gte = new Date(options.from);
        if (options.to) where.createdAt.lte = new Date(options.to);
    }

    // Get filtered IDs to maintain FTS rank order
    const filtered = await prisma.article.findMany({
        where,
        select: { id: true },
    });

    const filteredIdSet = new Set(filtered.map(a => a.id));
    articleIds = articleIds.filter(id => filteredIdSet.has(id));

    const total = articleIds.length;
    const paginatedIds = articleIds.slice(options.offset, options.offset + options.limit);

    // Build highlights map
    const highlights = new Map<number, { title: string; description: string; body: string }>();
    for (const row of ftsResults) {
        const id = Number(row.article_id);
        if (filteredIdSet.has(id)) {
            highlights.set(id, {
                title: row.title,
                description: row.description,
                body: row.body,
            });
        }
    }

    return { articleIds: paginatedIds, total, highlights };
};

export const getSuggestions = async (query: string, maxResults: number = 10): Promise<Array<{ text: string; type: 'title' | 'tag' }>> => {
    const prisma = usePrisma();

    const pattern = `%${query}%`;

    const [titles, tags] = await Promise.all([
        prisma.article.findMany({
            where: { title: { contains: query } },
            select: { title: true },
            take: maxResults,
        }),
        prisma.tag.findMany({
            where: { name: { contains: query } },
            select: { name: true },
            take: maxResults,
        }),
    ]);

    const suggestions: Array<{ text: string; type: 'title' | 'tag' }> = [];

    for (const t of tags) {
        suggestions.push({ text: t.name, type: 'tag' });
    }
    for (const a of titles) {
        suggestions.push({ text: a.title, type: 'title' });
    }

    return suggestions.slice(0, maxResults);
};
