import { definePrivateEventHandler } from "~/auth-event-handler";

export default definePrivateEventHandler(async (event, { auth }) => {
  const { count } = await usePrisma().notification.updateMany({
    where: { userId: auth.id, isRead: false },
    data: { isRead: true },
  });

  return { count };
});
