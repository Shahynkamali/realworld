import { definePrivateEventHandler } from '~/auth-event-handler';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const username = getRouterParam(event, 'username');

    const user = await usePrisma().user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (!user) {
        throw new HttpException(404, { errors: { profile: ['not found'] } });
    }

    const isOwner = auth?.id === user.id;

    const lists = await usePrisma().readingList.findMany({
        where: {
            userId: user.id,
            ...(isOwner ? {} : { isPublic: true }),
        },
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
}, { requireAuth: false });
