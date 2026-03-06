import {definePrivateEventHandler} from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, {auth}) => {
    const query = getQuery(event);
    const limit = Number(query.limit) || 20;
    const offset = Number(query.offset) || 0;

    const [notifications, notificationsCount] = await Promise.all([
        usePrisma().notification.findMany({
            where: {recipientId: auth.id},
            orderBy: {createdAt: 'desc'},
            skip: offset,
            take: limit,
            include: {
                actor: {
                    select: {
                        username: true,
                        image: true,
                    },
                },
            },
        }),
        usePrisma().notification.count({
            where: {recipientId: auth.id},
        }),
    ]);

    return {notifications, notificationsCount};
});
