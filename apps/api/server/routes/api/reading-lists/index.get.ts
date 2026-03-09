import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
    const lists = await usePrisma().readingList.findMany({
        where: { userId: auth.id },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { items: true } },
        },
    });

    const readingLists = lists.map(({ _count, ...list }) => ({
        ...list,
        articlesCount: _count.items,
    }));

    return { readingLists };
});
