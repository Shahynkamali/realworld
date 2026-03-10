import articleMapper from '~/utils/article.mapper';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { searchArticles } from '~/utils/search.service';
import { searchQuerySchema } from '~/schemas/search.schema';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const rawQuery = getQuery(event);

    const parsed = searchQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[issue.path.length - 1]?.toString() ?? 'query';
            if (!errors[field]) errors[field] = [];
            errors[field].push(issue.message);
        }
        throw new HttpException(422, { errors });
    }

    const { q, tag, author, from, to, limit, offset } = parsed.data;
    const tags = tag ? (Array.isArray(tag) ? tag : [tag]) : undefined;

    const { articleIds, total, highlights } = await searchArticles({
        query: q,
        tag: tags,
        author,
        from,
        to,
        limit,
        offset,
    });

    if (articleIds.length === 0) {
        return { articles: [], articlesCount: 0 };
    }

    // Fetch full articles in FTS rank order
    const articles = await usePrisma().article.findMany({
        where: { id: { in: articleIds } },
        include: {
            tagList: { select: { name: true } },
            author: {
                select: { username: true, bio: true, image: true, followedBy: true },
            },
            favoritedBy: true,
            _count: { select: { favoritedBy: true } },
        },
    });

    // Preserve FTS rank order
    const articleMap = new Map(articles.map(a => [a.id, a]));
    const ordered = articleIds
        .map(id => articleMap.get(id))
        .filter(Boolean)
        .map((article: any) => {
            const mapped = articleMapper(article, auth?.id);
            const hl = highlights.get(article.id);
            if (hl) {
                return {
                    ...mapped,
                    highlights: {
                        title: hl.title,
                        description: hl.description,
                        body: hl.body,
                    },
                };
            }
            return mapped;
        });

    return { articles: ordered, articlesCount: total };
}, { requireAuth: false });
