import { definePrivateEventHandler } from '~/auth-event-handler';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const existing = await usePrisma().readingList.findUnique({ where: { id } });

    if (!existing) {
        throw new HttpException(404, { errors: { readingList: ['not found'] } });
    }

    if (existing.userId !== auth.id) {
        throw new HttpException(403, { errors: { readingList: ['access denied'] } });
    }

    await usePrisma().readingList.delete({ where: { id } });

    return { message: 'Reading list deleted' };
});
