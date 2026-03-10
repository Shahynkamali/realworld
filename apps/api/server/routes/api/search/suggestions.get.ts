import HttpException from "~/models/http-exception.model";
import { definePrivateEventHandler } from "~/auth-event-handler";
import { ftsSuggestTitles } from "~/utils/fts";

export default definePrivateEventHandler(async (event) => {
    const query = getQuery(event);

    const q = String(query.q ?? '').trim();
    if (q.length < 2) {
        throw new HttpException(422, { errors: { q: ['must be at least 2 characters'] } });
    }

    const limit = Math.min(Number(query.limit) || 5, 10);

    const [titles, tags] = await Promise.all([
        ftsSuggestTitles(q, limit),
        usePrisma().tag.findMany({
            where: { name: { startsWith: q } },
            select: { name: true },
            take: limit,
        }),
    ]);

    return {
        titles,
        tags: tags.map(t => t.name),
    };
}, { requireAuth: false });
