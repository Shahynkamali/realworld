import HttpException from '~/models/http-exception.model';
import {defineModEventHandler} from '~/mod-event-handler';

export default defineModEventHandler(async (event) => {
    const username = getRouterParam(event, 'username');

    const user = await usePrisma().user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            bannedAt: true,
            banReason: true,
            bio: true,
            image: true,
            warnings: { orderBy: { createdAt: 'desc' } },
            _count: { select: { articles: true, comments: true } },
        },
    });

    if (!user) {
        throw new HttpException(404, { errors: { user: ['not found'] } });
    }

    return { user };
});
