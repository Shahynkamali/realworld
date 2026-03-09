import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
  await usePrisma().notification.updateMany({
    where: { userId: auth.id, read: false },
    data: { read: true },
  });

  return { message: 'all notifications marked as read' };
});
