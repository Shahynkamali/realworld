import { definePrivateEventHandler } from '~/auth-event-handler';
import { reviewReportSchema } from '~/schemas/report.schema';
import { validateBody } from '~/utils/validate';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireModerator(user);

    const { report } = validateBody(reviewReportSchema, await readBody(event));
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const existing = await usePrisma().report.findUnique({ where: { id } });
    if (!existing) {
        throw new HttpException(404, { errors: { report: ['not found'] } });
    }

    const updated = await usePrisma().report.update({
        where: { id },
        data: {
            status: report.status,
            reviewedAt: new Date(),
            reviewedById: auth.id,
            updatedAt: new Date(),
        },
    });

    return { report: updated };
});
