import { definePrivateEventHandler } from '~/auth-event-handler';
import { createReportSchema } from '~/schemas/report.schema';
import { validateBody } from '~/utils/validate';
import { getAuthUser, requireNotBanned } from '~/utils/moderation.service';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireNotBanned(user);

    const { report } = validateBody(createReportSchema, await readBody(event));
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const comment = await usePrisma().comment.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!comment) {
        throw new HttpException(404, { errors: { comment: ['not found'] } });
    }

    const created = await usePrisma().report.create({
        data: {
            reportedContentType: 'comment',
            reportedContentId: comment.id,
            reporterId: auth.id,
            reason: report.reason,
            description: report.description ?? null,
        },
    });

    setResponseStatus(event, 201);
    return { report: created };
});
