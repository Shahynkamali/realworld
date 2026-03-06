import { definePrivateEventHandler } from '~/auth-event-handler';
import { validateQuery } from '~/utils/validate';
import { suggestionsQuerySchema } from '~/schemas/search.schema';

export default definePrivateEventHandler(async (event) => {
    const { q, limit } = validateQuery(suggestionsQuerySchema, getQuery(event));

    const qLower = q.toLowerCase();

    const [articles, tags, authors] = await Promise.all([
        usePrisma().article.findMany({
            where: {
                status: 'published',
                title: { contains: qLower },
            },
            select: { title: true, slug: true },
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        usePrisma().tag.findMany({
            where: { name: { contains: qLower } },
            select: { name: true },
            take: limit,
        }),
        usePrisma().user.findMany({
            where: { username: { contains: qLower } },
            select: { username: true },
            take: limit,
        }),
    ]);

    const suggestions: { type: string; text: string; slug?: string }[] = [];

    for (const a of articles) {
        suggestions.push({ type: 'article', text: a.title, slug: a.slug });
    }
    for (const t of tags) {
        suggestions.push({ type: 'tag', text: t.name });
    }
    for (const u of authors) {
        suggestions.push({ type: 'author', text: u.username });
    }

    return { suggestions: suggestions.slice(0, limit) };
}, { requireAuth: false });
