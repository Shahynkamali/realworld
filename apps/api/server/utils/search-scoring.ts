export const scoreArticleRelevance = (article: any, query: string): number => {
    const q = query.toLowerCase();
    let score = 0;

    const title = (article.title ?? '').toLowerCase();
    const description = (article.description ?? '').toLowerCase();
    const body = (article.body ?? '').toLowerCase();

    if (title.includes(q)) score += 10;
    if (title.startsWith(q)) score += 5;
    if (description.includes(q)) score += 5;

    for (const tag of article.tagList ?? []) {
        const tagName = (tag.name ?? tag).toLowerCase();
        if (tagName === q) {
            score += 4;
        } else if (tagName.includes(q)) {
            score += 2;
        }
    }

    if (body.includes(q)) score += 1;

    return score;
};

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };

export const computeTrendingScore = (article: any, period: string): number => {
    const periodDays = PERIOD_DAYS[period] ?? 7;
    const favoritesCount = article._count?.favoritedBy ?? 0;
    const commentsCount = article._count?.comments ?? 0;

    const daysSincePublished =
        (Date.now() - new Date(article.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, periodDays - daysSincePublished) / periodDays * 10;

    return favoritesCount * 3 + commentsCount * 2 + recencyBonus;
};
