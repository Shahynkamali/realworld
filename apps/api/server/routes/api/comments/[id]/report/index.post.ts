import HttpException from '~/models/http-exception.model';
import {definePrivateEventHandler} from '~/auth-event-handler';
import {createReportSchema} from '~/schemas/report.schema';
import {validateBody} from '~/utils/validate';

export default definePrivateEventHandler(async (event, {auth}) => {
    const {report} = validateBody(createReportSchema, await readBody(event));
    const commentId = Number(getRouterParam(event, 'id'));

    const comment = await usePrisma().comment.findUnique({
        where: { id: commentId },
        select: { id: true },
    });

    if (!comment) {
        throw new HttpException(404, {errors: {comment: ['not found']}});
    }

    const created = await usePrisma().report.create({
        data: {
            reason: report.reason,
            description: report.description,
            reporterId: auth.id,
            commentId: comment.id,
        },
    });

    setResponseStatus(event, 201);
    return { report: { id: created.id, reason: created.reason, status: created.status, createdAt: created.createdAt } };
});
