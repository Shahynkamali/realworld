import { definePrivateEventHandler } from '~/auth-event-handler';
import { getAuthUser, requireModerator } from '~/utils/moderation.service';

export default definePrivateEventHandler(async (event, { auth }) => {
    const user = await getAuthUser(auth.id);
    requireModerator(user);

    const query = getQuery(event);
    const status = query.status as string | undefined;
    const reason = query.reason as string | undefined;
    const contentType = query.contentType as string | undefined;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (contentType) where.reportedContentType = contentType;

    const [reports, total] = await Promise.all([
        usePrisma().report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                reporter: { select: { id: true, username: true } },
                reviewedBy: { select: { id: true, username: true } },
            },
        }),
        usePrisma().report.count({ where }),
    ]);

    return { reports, reportsCount: total };
});
