import { definePrivateEventHandler } from '~/auth-event-handler';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireModerator(user);

    const query = getQuery(event);
    const status = query.status as string | undefined;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [appeals, total] = await Promise.all([
        usePrisma().appeal.findMany({
            where,
            orderBy: { submittedAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: { select: { id: true, username: true } },
                moderationAction: true,
                reviewedBy: { select: { id: true, username: true } },
            },
        }),
        usePrisma().appeal.count({ where }),
    ]);

    return { appeals, appealsCount: total };
});
