import HttpException from '~/models/http-exception.model';
import {defineModEventHandler} from '~/mod-event-handler';
import {reviewReportSchema} from '~/schemas/report.schema';
import {validateBody} from '~/utils/validate';

export default defineModEventHandler(async (event, {auth}) => {
    const id = Number(getRouterParam(event, 'id'));
    const {report: body} = validateBody(reviewReportSchema, await readBody(event));

    const existing = await usePrisma().report.findUnique({ where: { id } });

    if (!existing) {
        throw new HttpException(404, { errors: { report: ['not found'] } });
    }

    const updated = await usePrisma().report.update({
        where: { id },
        data: {
            status: body.status,
            action: body.action ?? 'none',
            moderatorId: auth.id,
            updatedAt: new Date(),
        },
    });

    return { report: updated };
});
