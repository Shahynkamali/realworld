import HttpException from "~/models/http-exception.model";
import { definePrivateEventHandler } from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, { auth }) => {
  const id = Number(getRouterParam(event, 'id'));

  if (!id || isNaN(id)) {
    throw new HttpException(422, { errors: { id: ['must be a valid number'] } });
  }

  const notification = await usePrisma().notification.findFirst({
    where: { id, userId: auth.id },
  });

  if (!notification) {
    throw new HttpException(404, { errors: { notification: ['not found'] } });
  }

  const updated = await usePrisma().notification.update({
    where: { id },
    data: { isRead: true },
    include: {
      actor: {
        select: { username: true, image: true },
      },
    },
  });

  return { notification: updated };
});
