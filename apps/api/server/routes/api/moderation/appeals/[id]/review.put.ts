import HttpException from '~/models/http-exception.model';
import {defineModEventHandler} from '~/mod-event-handler';
import {reviewAppealSchema} from '~/schemas/appeal.schema';
import {validateBody} from '~/utils/validate';

export default defineModEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'));
    const {appeal: body} = validateBody(reviewAppealSchema, await readBody(event));

    const existing = await usePrisma().appeal.findUnique({
        where: { id },
        include: { user: { select: { id: true } } },
    });

    if (!existing) {
        throw new HttpException(404, { errors: { appeal: ['not found'] } });
    }

    const updated = await usePrisma().appeal.update({
        where: { id },
        data: {
            status: body.status,
            response: body.response,
            updatedAt: new Date(),
        },
    });

    if (body.status === 'accepted') {
        await usePrisma().user.update({
            where: { id: existing.user.id },
            data: { bannedAt: null, banReason: null },
        });
    }

    return { appeal: updated };
}, { requireAdmin: true });
