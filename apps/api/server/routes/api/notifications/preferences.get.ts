import { definePrivateEventHandler } from "~/auth-event-handler";
import { NOTIFICATION_TYPES } from "~/utils/notification.service";

export default definePrivateEventHandler(async (event, { auth }) => {
  const prefs = await usePrisma().notificationPreference.findMany({
    where: { userId: auth.id },
  });

  // Build a complete preferences map with defaults (all enabled)
  const prefMap = Object.fromEntries(NOTIFICATION_TYPES.map(t => [t, true]));
  for (const pref of prefs) {
    prefMap[pref.notificationType] = pref.isEnabled;
  }

  return { preferences: prefMap };
});
