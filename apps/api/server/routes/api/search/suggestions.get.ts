import { definePrivateEventHandler } from '~/auth-event-handler';
import { getSuggestions } from '~/utils/search.service';
import { suggestionsQuerySchema } from '~/schemas/search.schema';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event) => {
    const rawQuery = getQuery(event);

    const parsed = suggestionsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[issue.path.length - 1]?.toString() ?? 'query';
            if (!errors[field]) errors[field] = [];
            errors[field].push(issue.message);
        }
        throw new HttpException(422, { errors });
    }

    const { q, limit } = parsed.data;
    const suggestions = await getSuggestions(q, limit);

    return { suggestions };
}, { requireAuth: false });
