import HttpException from '~/models/http-exception.model';
import {defineModEventHandler} from '~/mod-event-handler';

export default defineModEventHandler(async (event) => {
    const username = getRouterParam(event, 'username');

    const user = await usePrisma().user.findUnique({
        where: { username },
        select: { id: true, bannedAt: true },
    });

    if (!user) {
        throw new HttpException(404, { errors: { user: ['not found'] } });
    }

    if (!user.bannedAt) {
        throw new HttpException(422, { errors: { user: ['is not banned'] } });
    }

    const updated = await usePrisma().user.update({
        where: { username },
        data: {
            bannedAt: null,
            banReason: null,
        },
        select: { username: true, bannedAt: true },
    });

    return { user: updated };
}, { requireAdmin: true });
