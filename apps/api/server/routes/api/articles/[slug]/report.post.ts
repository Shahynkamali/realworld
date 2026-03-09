import { definePrivateEventHandler } from '~/auth-event-handler';
import { createReportSchema } from '~/schemas/report.schema';
import { validateBody } from '~/utils/validate';
import { getAuthUser, requireNotBanned } from '~/utils/moderation.service';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireNotBanned(user);

    const { report } = validateBody(createReportSchema, await readBody(event));
    const slug = getRouterParam(event, 'slug');

    const article = await usePrisma().article.findUnique({
        where: { slug },
        select: { id: true },
    });

    if (!article) {
        throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    const created = await usePrisma().report.create({
        data: {
            reportedContentType: 'article',
            reportedContentId: article.id,
            reporterId: auth.id,
            reason: report.reason,
            description: report.description ?? null,
        },
    });

    setResponseStatus(event, 201);
    return { report: created };
});
