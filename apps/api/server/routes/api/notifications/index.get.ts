import { definePrivateEventHandler } from '~/auth-event-handler';
import notificationMapper from '~/utils/notification.mapper';

export default definePrivateEventHandler(async (event, { auth }) => {
  const query = getQuery(event);
  const limit = Number(query.limit) || 20;
  const offset = Number(query.offset) || 0;

  const where: any = { userId: auth.id };
  if (query.read === 'true') where.read = true;
  if (query.read === 'false') where.read = false;

  const [notifications, notificationsCount] = await Promise.all([
    usePrisma().notification.findMany({
      where,
      include: {
        actor: { select: { username: true, bio: true, image: true } },
        article: { select: { slug: true, title: true } },
        comment: { select: { id: true, body: true } },
        collaboration: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    usePrisma().notification.count({ where }),
  ]);

  return {
    notifications: notifications.map(notificationMapper),
    notificationsCount,
  };
});
