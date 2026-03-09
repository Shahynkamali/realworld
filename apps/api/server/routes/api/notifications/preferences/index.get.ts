import { definePrivateEventHandler } from '~/auth-event-handler';
import { NOTIFICATION_TYPES } from '~/models/notification.model';

export default definePrivateEventHandler(async (event, { auth }) => {
  const dbPreferences = await usePrisma().notificationPreference.findMany({
    where: { userId: auth.id },
  });

  const prefMap = new Map(dbPreferences.map((p) => [p.type, p.enabled]));

  const preferences = NOTIFICATION_TYPES.map((type) => ({
    type,
    enabled: prefMap.has(type) ? prefMap.get(type)! : true,
  }));

  return { preferences };
});
