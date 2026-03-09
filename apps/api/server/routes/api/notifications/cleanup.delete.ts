import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await usePrisma().notification.deleteMany({
        where: {
            userId: auth.id,
            isRead: true,
            createdAt: { lt: thirtyDaysAgo },
        },
    });

    return { deleted: result.count };
});
