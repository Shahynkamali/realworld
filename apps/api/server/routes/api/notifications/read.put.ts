import { definePrivateEventHandler } from '~/auth-event-handler';

export default definePrivateEventHandler(async (event, { auth }) => {
  const result = await usePrisma().notification.updateMany({
    where: { userId: auth.id, read: false },
    data: { read: true },
  });

  return { notifications: { updated: result.count } };
});
