import { definePrivateEventHandler } from '~/auth-event-handler';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireModerator(user);

    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const [actions, total] = await Promise.all([
        usePrisma().userModerationAction.findMany({
            orderBy: { issuedAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: { select: { id: true, username: true } },
                issuedBy: { select: { id: true, username: true } },
            },
        }),
        usePrisma().userModerationAction.count(),
    ]);

    return { actions, actionsCount: total };
});
