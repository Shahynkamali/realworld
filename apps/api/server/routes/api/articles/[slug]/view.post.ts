import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import { trackArticleView } from '~/utils/analytics.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const slug = getRouterParam(event, 'slug');

    const article = await usePrisma().article.findUnique({
        where: { slug },
        select: { id: true, viewCount: true },
    });

    if (!article) {
        throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    const ip = getRequestIP(event) ?? getHeader(event, 'x-forwarded-for') ?? 'unknown';
    const userAgent = getHeader(event, 'user-agent') ?? 'unknown';

    const isNew = await trackArticleView(article.id, ip, userAgent, auth?.id);

    return {
        viewCount: isNew ? article.viewCount + 1 : article.viewCount,
    };
}, { requireAuth: false });
