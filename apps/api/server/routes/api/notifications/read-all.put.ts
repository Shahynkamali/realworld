import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
    const result = await usePrisma().notification.updateMany({
        where: { userId: auth.id, isRead: false },
        data: { isRead: true, updatedAt: new Date() },
    });

    return { count: result.count };
});
