const DEDUP_HOURS = 24;

export const trackArticleView = async (
    articleId: number,
    ipAddress: string,
    userAgent: string,
    userId?: number,
) => {
    const prisma = usePrisma();
    const since = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000);

    // Check for duplicate view within 24 hours
    const existing = await prisma.articleView.findFirst({
        where: {
            articleId,
            createdAt: { gte: since },
            ...(userId ? { userId } : { ipAddress, userId: null }),
        },
    });

    if (existing) {
        return false;
    }

    // Create view record and increment counter atomically
    await prisma.$transaction([
        prisma.articleView.create({
            data: { articleId, userId: userId ?? null, ipAddress, userAgent },
        }),
        prisma.article.update({
            where: { id: articleId },
            data: {
                viewCount: { increment: 1 },
                lastViewedAt: new Date(),
            },
        }),
    ]);

    return true;
};

type TimeWindow = '24h' | '7d' | '30d';

const TIME_WINDOW_MS: Record<TimeWindow, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

export const getTrendingArticles = async (
    timeWindow: TimeWindow = '7d',
    limit: number = 10,
) => {
    const prisma = usePrisma();
    const since = new Date(Date.now() - TIME_WINDOW_MS[timeWindow]);

    // Get articles with recent activity
    const articles = await prisma.article.findMany({
        where: {
            OR: [
                { views: { some: { createdAt: { gte: since } } } },
                { favoritedBy: { some: {} } },
                { comments: { some: { createdAt: { gte: since } } } },
            ],
        },
        include: {
            tagList: { select: { name: true } },
            author: {
                select: { username: true, bio: true, image: true, followedBy: true },
            },
            favoritedBy: true,
            _count: {
                select: {
                    favoritedBy: true,
                    comments: true,
                },
            },
            views: {
                where: { createdAt: { gte: since } },
                select: { id: true },
            },
        },
    });

    // Calculate weighted scores with exponential decay
    const now = Date.now();
    const windowMs = TIME_WINDOW_MS[timeWindow];

    const scored = articles.map((article) => {
        const recentViews = article.views.length;
        const totalFavorites = article._count.favoritedBy;
        const totalComments = article._count.comments;

        // Exponential decay: newer articles get a boost
        const ageMs = now - article.createdAt.getTime();
        const decayFactor = Math.exp(-ageMs / windowMs);

        const rawScore =
            recentViews * 0.6 + totalFavorites * 0.3 + totalComments * 0.1;
        const score = rawScore * (0.5 + 0.5 * decayFactor);

        return { article, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
};

export const getAuthorStats = async (username: string) => {
    const prisma = usePrisma();

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            articles: {
                include: {
                    _count: {
                        select: { favoritedBy: true, comments: true },
                    },
                },
            },
        },
    });

    if (!user) return null;

    const articles = user.articles;
    const totalArticles = articles.length;
    const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);
    const totalFavorites = articles.reduce((sum, a) => sum + a._count.favoritedBy, 0);
    const totalComments = articles.reduce((sum, a) => sum + a._count.comments, 0);
    const readingTimes = articles
        .map((a) => a.readingTimeMinutes)
        .filter((t): t is number => t !== null);
    const avgReadingTime =
        readingTimes.length > 0
            ? Math.round(readingTimes.reduce((s, t) => s + t, 0) / readingTimes.length)
            : 0;

    const articleBreakdown = articles.map((a) => ({
        articleSlug: a.slug,
        title: a.title,
        views: a.viewCount,
        favorites: a._count.favoritedBy,
        comments: a._count.comments,
        readingTime: a.readingTimeMinutes,
        publishedAt: a.createdAt,
    }));

    return {
        totalViews,
        totalArticles,
        totalFavorites,
        totalComments,
        avgReadingTime,
        articles: articleBreakdown,
    };
};
