import {defineModEventHandler} from '~/mod-event-handler';

export default defineModEventHandler(async (event) => {
    const query = getQuery(event);
    const status = typeof query.status === 'string' ? query.status : undefined;

    const appeals = await usePrisma().appeal.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { username: true, bannedAt: true, banReason: true } },
        },
    });

    return { appeals };
});
