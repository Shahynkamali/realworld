import { definePrivateEventHandler } from '~/auth-event-handler';
import HttpException from '~/models/http-exception.model';
import notificationMapper from '~/utils/notification.mapper';

export default definePrivateEventHandler(async (event, { auth }) => {
  const id = Number(getRouterParam(event, 'id'));

  const notification = await usePrisma().notification.findUnique({ where: { id } });

  if (!notification || notification.userId !== auth.id) {
    throw new HttpException(404, { errors: { notification: ['not found'] } });
  }

  const updated = await usePrisma().notification.update({
    where: { id },
    data: { read: true },
    include: {
      actor: { select: { username: true, bio: true, image: true } },
      article: { select: { slug: true, title: true } },
      comment: { select: { id: true, body: true } },
    },
  });

  return { notification: notificationMapper(updated) };
});
