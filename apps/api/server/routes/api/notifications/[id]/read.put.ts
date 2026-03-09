import { definePrivateEventHandler } from '~/auth-event-handler';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const notification = await usePrisma().notification.findUnique({ where: { id } });

    if (!notification) {
        throw new HttpException(404, { errors: { notification: ['not found'] } });
    }

    if (notification.userId !== auth.id) {
        throw new HttpException(403, { errors: { notification: ['access denied'] } });
    }

    const updated = await usePrisma().notification.update({
        where: { id },
        data: { isRead: true, updatedAt: new Date() },
    });

    return { notification: updated };
});
