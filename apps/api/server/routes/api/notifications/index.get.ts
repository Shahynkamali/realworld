import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const [notifications, total] = await Promise.all([
        usePrisma().notification.findMany({
            where: { userId: auth.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        usePrisma().notification.count({ where: { userId: auth.id } }),
    ]);

    return { notifications, notificationsCount: total };
});
