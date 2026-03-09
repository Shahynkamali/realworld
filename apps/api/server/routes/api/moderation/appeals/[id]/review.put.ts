import { definePrivateEventHandler } from '~/auth-event-handler';
import { reviewAppealSchema } from '~/schemas/moderation.schema';
import { validateBody } from '~/utils/validate';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';
import HttpException from '~/models/http-exception.model';

export default definePrivateEventHandler(async (event, { auth }) => {
    const moderator = await getAuthUser(auth.id);
    requireModerator(moderator);

    const { appeal } = validateBody(reviewAppealSchema, await readBody(event));
    const id = Number(getRouterParam(event, 'id'));

    if (isNaN(id)) {
        throw new HttpException(422, { errors: { id: ['must be a number'] } });
    }

    const existing = await usePrisma().appeal.findUnique({
        where: { id },
        include: { moderationAction: true },
    });

    if (!existing) {
        throw new HttpException(404, { errors: { appeal: ['not found'] } });
    }

    if (existing.status !== 'pending') {
        throw new HttpException(422, { errors: { appeal: ['has already been reviewed'] } });
    }

    // If approved, deactivate the moderation action and unban the user
    if (appeal.status === 'approved') {
        await usePrisma().$transaction([
            usePrisma().appeal.update({
                where: { id },
                data: {
                    status: 'approved',
                    reviewedAt: new Date(),
                    reviewedById: auth.id,
                },
            }),
            usePrisma().userModerationAction.update({
                where: { id: existing.moderationActionId },
                data: { isActive: false },
            }),
            // Check if user has any other active bans before unbanning
            ...(existing.moderationAction.actionType !== 'warning'
                ? [usePrisma().user.update({
                    where: { id: existing.userId },
                    data: { isBanned: false },
                })]
                : []),
        ]);
    } else {
        await usePrisma().appeal.update({
            where: { id },
            data: {
                status: 'denied',
                reviewedAt: new Date(),
                reviewedById: auth.id,
            },
        });
    }

    const updated = await usePrisma().appeal.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, username: true } },
            moderationAction: true,
            reviewedBy: { select: { id: true, username: true } },
        },
    });

    return { appeal: updated };
});
