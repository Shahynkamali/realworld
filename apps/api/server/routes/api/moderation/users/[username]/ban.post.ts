import HttpException from '~/models/http-exception.model';
import {defineModEventHandler} from '~/mod-event-handler';
import {banUserSchema} from '~/schemas/moderation.schema';
import {validateBody} from '~/utils/validate';

export default defineModEventHandler(async (event) => {
    const username = getRouterParam(event, 'username');
    const {ban: body} = validateBody(banUserSchema, await readBody(event));

    const user = await usePrisma().user.findUnique({
        where: { username },
        select: { id: true, bannedAt: true },
    });

    if (!user) {
        throw new HttpException(404, { errors: { user: ['not found'] } });
    }

    if (user.bannedAt) {
        throw new HttpException(422, { errors: { user: ['is already banned'] } });
    }

    const updated = await usePrisma().user.update({
        where: { username },
        data: {
            bannedAt: new Date(),
            banReason: body.reason,
        },
        select: { username: true, bannedAt: true, banReason: true },
    });

    return { user: updated };
}, { requireAdmin: true });
