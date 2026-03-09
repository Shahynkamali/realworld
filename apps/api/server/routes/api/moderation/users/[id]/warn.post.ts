import { definePrivateEventHandler } from '~/auth-event-handler';
import { warnUserSchema } from '~/schemas/moderation.schema';
import { validateBody } from '~/utils/validate';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const moderator = await getAuthUser(auth.id);
    requireModerator(moderator);

    const { warning } = validateBody(warnUserSchema, await readBody(event));
    const userId = Number(getRouterParam(event, 'id'));

    if (isNaN(userId)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const targetUser = await usePrisma().user.findUnique({ where: { id: userId } });
    if (!targetUser) {
        throw new HttpException(404, { errors: { user: ['not found'] } });
    }

    const action = await usePrisma().userModerationAction.create({
        data: {
            userId,
            actionType: 'warning',
            reason: warning.reason,
            issuedById: auth.id,
        },
    });

    return { action };
});
