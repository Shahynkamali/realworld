import HttpException from '~/models/http-exception.model';
import { definePrivateEventHandler } from '~/auth-event-handler';
import notificationMapper from '~/utils/notification.mapper';

export default definePrivateEventHandler(async (event, { auth }) => {
  const id = Number(getRouterParam(event, 'id'));

  const notification = await usePrisma().notification.findFirst({
    where: { id, userId: auth.id },
  });

  if (!notification) {
    throw new HttpException(404, { errors: { notification: ['not found'] } });
  }

  const updated = await usePrisma().notification.update({
    where: { id },
    data: { read: true },
    include: {
      actor: { select: { username: true, bio: true, image: true } },
      article: { select: { slug: true, title: true } },
      comment: { select: { id: true, body: true } },
      collaboration: { select: { id: true, status: true } },
    },
  });

  return { notification: notificationMapper(updated) };
});
