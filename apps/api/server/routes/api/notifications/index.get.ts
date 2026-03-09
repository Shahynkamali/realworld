import { definePrivateEventHandler } from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, { auth }) => {
  const query = getQuery(event);
  const limit = Number(query.limit) || 20;
  const offset = Number(query.offset) || 0;

  const where: any = { userId: auth.id };
  if (query.unread === 'true') where.isRead = false;
  if (query.unread === 'false') where.isRead = true;

  const [notifications, notificationsCount] = await Promise.all([
    usePrisma().notification.findMany({
      where,
      include: {
        actor: {
          select: { username: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    usePrisma().notification.count({ where }),
  ]);

  return { notifications, notificationsCount };
});
