import { definePrivateEventHandler } from '~/auth-event-handler';
import { banUserSchema } from '~/schemas/moderation.schema';
import { validateBody } from '~/utils/validate';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const moderator = await getAuthUser(auth.id);
    requireModerator(moderator);

    const { ban } = validateBody(banUserSchema, await readBody(event));
    const userId = Number(getRouterParam(event, 'id'));

    if (isNaN(userId)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const targetUser = await usePrisma().user.findUnique({ where: { id: userId } });
    if (!targetUser) {
        throw new HttpException(404, { errors: { user: ['not found'] } });
    }

    const actionType = ban.permanent ? 'permanent_ban' : 'temp_ban';
    const expiresAt = ban.permanent ? null : (ban.expiresAt ? new Date(ban.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const [action] = await usePrisma().$transaction([
        usePrisma().userModerationAction.create({
            data: {
                userId,
                actionType,
                reason: ban.reason,
                issuedById: auth.id,
                expiresAt,
            },
        }),
        usePrisma().user.update({
            where: { id: userId },
            data: { isBanned: true },
        }),
    ]);

    return { action };
});
