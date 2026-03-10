let initialized = false;

export function sanitizeFtsQuery(raw: string): string {
    return raw.trim().split(/\s+/).filter(Boolean)
        .map(token => `"${token.replace(/"/g, '""')}"`)
        .join(' ');
}

export async function ensureFtsTable(): Promise<void> {
    if (initialized) return;

    const prisma = usePrisma();

    await prisma.$executeRawUnsafe(`
        CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
            article_id UNINDEXED,
            title,
            description,
            body,
            tokenize='porter unicode61'
        );
    `);

    // If table is empty but articles exist, rebuild index
    const ftsCount: any[] = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as cnt FROM articles_fts`
    );

    if (Number(ftsCount[0]?.cnt) === 0) {
        const articles: any[] = await prisma.$queryRawUnsafe(
            `SELECT id, title, description, body FROM Article`
        );

        for (const article of articles) {
            await prisma.$executeRawUnsafe(
                `INSERT INTO articles_fts(article_id, title, description, body) VALUES (?, ?, ?, ?)`,
                String(article.id),
                article.title,
                article.description,
                article.body,
            );
        }
    }

    initialized = true;
}

export async function ftsIndexArticle(
    articleId: number,
    title: string,
    description: string,
    body: string,
): Promise<void> {
    await ensureFtsTable();
    await usePrisma().$executeRawUnsafe(
        `INSERT INTO articles_fts(article_id, title, description, body) VALUES (?, ?, ?, ?)`,
        String(articleId),
        title,
        description,
        body,
    );
}

export async function ftsUpdateArticle(
    articleId: number,
    title: string,
    description: string,
    body: string,
): Promise<void> {
    await ensureFtsTable();
    const prisma = usePrisma();
    await prisma.$executeRawUnsafe(
        `DELETE FROM articles_fts WHERE article_id = ?`,
        String(articleId),
    );
    await prisma.$executeRawUnsafe(
        `INSERT INTO articles_fts(article_id, title, description, body) VALUES (?, ?, ?, ?)`,
        String(articleId),
        title,
        description,
        body,
    );
}

export async function ftsDeleteArticle(articleId: number): Promise<void> {
    await ensureFtsTable();
    await usePrisma().$executeRawUnsafe(
        `DELETE FROM articles_fts WHERE article_id = ?`,
        String(articleId),
    );
}

export async function ftsSearch(
    query: string,
    limit: number,
    offset: number,
): Promise<Array<{
    articleId: number;
    rank: number;
    highlights: { title: string; description: string; body: string };
}>> {
    await ensureFtsTable();

    const sanitized = sanitizeFtsQuery(query);
    if (!sanitized) return [];

    const results: any[] = await usePrisma().$queryRawUnsafe(
        `SELECT
            article_id,
            bm25(articles_fts, 10.0, 5.0, 1.0) as rank,
            highlight(articles_fts, 1, '<mark>', '</mark>') as title_hl,
            highlight(articles_fts, 2, '<mark>', '</mark>') as description_hl,
            highlight(articles_fts, 3, '<mark>', '</mark>') as body_hl
        FROM articles_fts
        WHERE articles_fts MATCH ?
        ORDER BY rank
        LIMIT ? OFFSET ?`,
        sanitized,
        limit,
        offset,
    );

    return results.map(r => ({
        articleId: Number(r.article_id),
        rank: Number(r.rank),
        highlights: {
            title: r.title_hl,
            description: r.description_hl,
            body: r.body_hl,
        },
    }));
}

export async function ftsSuggestTitles(
    prefix: string,
    limit: number,
): Promise<string[]> {
    await ensureFtsTable();

    const sanitized = prefix.trim().split(/\s+/).filter(Boolean)
        .map(token => `"${token.replace(/"/g, '""')}"*`)
        .join(' ');
    if (!sanitized) return [];

    const results: any[] = await usePrisma().$queryRawUnsafe(
        `SELECT highlight(articles_fts, 1, '', '') as title
        FROM articles_fts
        WHERE title MATCH ?
        LIMIT ?`,
        sanitized,
        limit,
    );

    return results.map(r => r.title);
}
